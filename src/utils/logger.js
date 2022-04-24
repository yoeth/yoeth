import { std } from '../../deps.js';
import { Time } from './time.ts'

export default class Logger {
    constructor(name) {
        this.name = name;
        this.extend = (namespace) => {
            return new Logger(`${this.name}:${namespace}`);
        };
        if (name in Logger.instances)
            return Logger.instances[name];
        Logger.instances[name] = this;
        this.code = Logger.code(name);
        this.createMethod('success', '[SUCCESS] ', Logger.SUCCESS);
        this.createMethod('error', '[ERROR] ', Logger.ERROR);
        this.createMethod('info', '[INFO] ', Logger.INFO);
        this.createMethod('warn', '[WARN] ', Logger.WARN);
        this.createMethod('debug', '[DEBUG] ', Logger.DEBUG);
    }
    static color(target, code, value, decoration = '') {
        if (!target.colors)
            return '' + value;
        return `\u001b[3${code < 8 ? code : '8;5;' + code}${target.colors >= 2 ? decoration : ''}m${value}\u001b[0m`;
    }
    static code(name) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash = ((hash << 3) - hash) + name.charCodeAt(i);
            hash |= 0;
        }
        return Logger.colors[Math.abs(hash) % Logger.colors.length];
    }
    createMethod(name, prefix, minLevel) {
        this[name] = (...args) => {
            if (this.level < minLevel)
                return;
            const now = Date.now();
            for (const target of Logger.targets) {
                let indent = 4, output = '';
                if (target.showTime) {
                    indent += target.showTime.length + 1;
                    output += Time.template(target.showTime + ' ');
                }
                output += prefix + std.rgb8(this.name, this.code) + ' ' + this.format(target, indent, ...args);
                if (target.showDiff) {
                    const diff = Logger.timestamp && now - Logger.timestamp;
                    output += std.rgb8(' +' + Time.format(diff), this.code);
                }
                target.print(output, name);
            }
            Logger.timestamp = now;
        };
    }
    format(target, indent, ...args) {
        if (args[0] instanceof Error) {
            args[0] = args[0].stack || args[0].message;
        }
        else if (typeof args[0] !== 'string') {
            args.unshift('%O');
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
            if (match === '%%')
                return '%';
            index += 1;
            const formatter = Logger.formatters[format];
            if (typeof formatter === 'function') {
                match = formatter(args[index], target, this);
                args.splice(index, 1);
                index -= 1;
            }
            return match;
        }).replace(/\n/g, '\n' + ' '.repeat(indent));
        return std.format(...args);
    }
    get level() {
        var _a;
        const paths = this.name.split(':');
        let config = Logger.levels;
        do {
            config = (_a = config[paths.shift()]) !== null && _a !== void 0 ? _a : config['base'];
        } while (paths.length && typeof config === 'object');
        return config;
    }
    set level(value) {
        const paths = this.name.split(':');
        let config = Logger.levels;
        while (paths.length > 1) {
            const name = paths.shift();
            const value = config[name];
            if (typeof value === 'object') {
                config = value;
            }
            else {
                config = config[name] = { base: value !== null && value !== void 0 ? value : config.base };
            }
        }
        config[paths[0]] = value;
    }
}
// log levels
Logger.SILENT = 0;
Logger.SUCCESS = 1;
Logger.ERROR = 1;
Logger.INFO = 2;
Logger.WARN = 2;
Logger.DEBUG = 3;
// global config
Logger.timestamp = 0;
Logger.colors = [
    20, 21, 26, 27, 32, 33, 38, 39, 40, 41, 42, 43, 44, 45, 56, 57, 62,
    63, 68, 69, 74, 75, 76, 77, 78, 79, 80, 81, 92, 93, 98, 99, 112, 113,
    129, 134, 135, 148, 149, 160, 161, 162, 163, 164, 165, 166, 167, 168,
    169, 170, 171, 172, 173, 178, 179, 184, 185, 196, 197, 198, 199, 200,
    201, 202, 203, 204, 205, 206, 207, 208, 209, 214, 215, 220, 221,
];
Logger.instances = {};
Logger.targets = [{
    colors: 3,
    print(text, name) {
        console[name === 'debug' ? 'debug' : 'log'](text)
    },
}];
Logger.formatters = {
    c: (value, target, logger) => Logger.color(target, logger.code, value),
    C: (value, target) => Logger.color(target, 15, value, ';1'),
    o: (value, target) => std.inspect(value, { colors: !!target.colors }).replace(/\s*\n\s*/g, ' '),
};
Logger.levels = {
    base: 2,
};