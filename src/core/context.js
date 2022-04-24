import { Logger, defineProperty, Random, isConstructor } from "../utils/mod.js";
import { std } from "../../deps.js";

export var Next;
(function (Next) {
    Next.MAX_DEPTH = 64;
    async function compose(callback, next) {
        return typeof callback === "function" ? callback(next) : callback;
    }
    Next.compose = compose;
})(Next || (Next = {}));
export var Plugin;
(function (Plugin) {
    class ContextRegistry extends Map {
        resolve(plugin) {
            return plugin && (typeof plugin === "function" ? plugin : plugin.apply);
        }
        get(plugin) {
            return super.get(this.resolve(plugin));
        }
        set(plugin, state) {
            return super.set(this.resolve(plugin), state);
        }
        has(plugin) {
            return super.has(this.resolve(plugin));
        }
        delete(plugin) {
            return super.delete(this.resolve(plugin));
        }
    }
    class NoticeRegistry extends Map {
        resolve(plugin) {
            return plugin && (typeof plugin === "function" ? plugin : plugin.apply);
        }
        get(plugin) {
            return super.get(this.resolve(plugin));
        }
        set(plugin, state) {
            return super.set(this.resolve(plugin), state);
        }
        has(plugin) {
            return super.has(this.resolve(plugin));
        }
        delete(plugin) {
            return super.delete(this.resolve(plugin));
        }
    }
    class MessageRegistry extends Map {
        resolve(plugin) {
            return plugin && (typeof plugin === "function" ? plugin : plugin.apply);
        }
        get(plugin) {
            return super.get(this.resolve(plugin));
        }
        set(plugin, state) {
            return super.set(this.resolve(plugin), state);
        }
        has(plugin) {
            return super.has(this.resolve(plugin));
        }
        delete(plugin) {
            return super.delete(this.resolve(plugin));
        }
    }
    Plugin.ContextRegistry = ContextRegistry;
    Plugin.NoticeRegistry = NoticeRegistry;
    Plugin.MessageRegistry = MessageRegistry;
})(Plugin || (Plugin = {}));

function remove(list, item) {
    const index = list.indexOf(item);
    if (index >= 0) {
        list.splice(index, 1);
        return true;
    }
}
function isApplicable(object) {
    return object && typeof object === 'object' && typeof object.apply === 'function';
}

export class Context {
    constructor(filter, app, _plugin = null) {
        this.filter = filter;
        this.app = app;
        this._plugin = _plugin;
    }
    get state() {
        return this.app.registry.get(this._plugin);
    }
    logger(name) {
        return new Logger(name)
    }
    match(session) {
        return !session || this.filter(session);
    }
    validate(plugin, config) {
        if (config === false)
            return;
        if (config === true)
            config = undefined;
        config !== null && config !== void 0 ? config : (config = {});
        return config;
    }
    *getHooks(name, session) {
        const hooks = this.app._hooks[name] || [];
        for (const [context, callback] of hooks.slice()) {
            if (!context.match(session)) {
                continue;
            }
            yield callback;
        }
    }
    async parallel(...args) {
        const tasks = [];
        const session = typeof args[0] === "object" ? args.shift() : null;
        const name = args.shift();
        for (const callback of this.getHooks(name, session)) {
            tasks.push(
                Promise.resolve(callback.apply(session, args)).catch((error) => {
                    this.logger("app").warn(error);
                }),
            );
        }
        await Promise.all(tasks);
    }
    emit(...args) {
        this.parallel(...args);
    }
    on(name, listener, prepend = false) {
        var _a;
        const method = prepend ? "unshift" : "push";
        if (typeof name === "string" && name in Context.deprecatedEvents) {
            const alternative = Context.deprecatedEvents[name];
            this.logger("app").warn(
                `event "${name}" is deprecated, use "${alternative}" instead`,
            );
            name = alternative;
        }
        const hooks = (_a = this.app._hooks)[name] || (_a[name] = []);
        if (hooks.length >= this.app.options.maxListeners) {
            this.logger("app").warn(
                'max listener count (%d) for event "%s" exceeded, which may be caused by a memory leak',
                this.app.options.maxListeners,
                name,
            );
        }
        hooks[method]([this, listener]);
        const dispose = () => {
            remove(this.state.disposables, dispose);
            return this.off(name, listener);
        };
        this.state.disposables.push(dispose);
        return dispose;
    }
    off(name, listener) {
        const index = (this.app._hooks[name] || [])
            .findIndex(([context, callback]) =>
                context === this && callback === listener
            );
        if (index >= 0) {
            this.app._hooks[name].splice(index, 1);
            return true;
        }
    }
    middleware(middleware, prepend = false) {
        return this.on(Context.middleware, middleware, prepend);
    }
    /*getCommand(name) {
        return this.app._commands.get(name);
    }
    command(def, ...args) {
        const desc = typeof args[0] === "string" ? args.shift() : "";
        const config = args[0];
        const path = def.split(" ", 1)[0].toLowerCase();
        const decl = def.slice(path.length);
        const segments = path.split(/(?=[./])/g);
        let parent, root;
        const list = [];
        segments.forEach((segment, index) => {
            const code = segment.charCodeAt(0);
            const name = code === 46
                ? parent.name + segment
                : code === 47
                    ? segment.slice(1)
                    : segment;
            let command = this.getCommand(name);
            if (command) {
                if (parent) {
                    if (command === parent) {
                        throw new Error(
                            `cannot set a command (${command.name}) as its own subcommand`,
                        );
                    }
                    if (command.parent) {
                        if (command.parent !== parent) {
                            throw new Error(
                                `cannot create subcommand ${path}: ${command.parent.name}/${command.name} already exists`,
                            );
                        }
                    } else {
                        command.parent = parent;
                        parent.children.push(command);
                    }
                }
                return parent = command;
            }
            command = new Command(name, decl, this);
            list.push(command);
            if (!root) {
                root = command;
            }
            if (parent) {
                command.parent = parent;
                command.config.authority = parent.config.authority;
                parent.children.push(command);
            }
            parent = command;
        });
        if (desc) {
            this.i18n.define("", `commands.${parent.name}.description`, desc);
        }
        Object.assign(parent.config, config);
        list.forEach((command) => this.emit("command-added", command));
        if (!(config === null || config === void 0 ? void 0 : config.patch)) {
            if (root) {
                this.state.disposables.unshift(() => root.dispose());
            }
            return parent;
        }
        if (root) {
            root.dispose();
        }
        const command = Object.create(parent);
        command._disposables = this.state.disposables;
        return command;
    }*/
    async plugin(entry, config) {
        const file = typeof entry === "string" ? entry : null;
        // load plugin by name
        const plugin = typeof entry === "string"
            ? await import(
                entry.includes("://") ? entry : std.join(`file://${Deno.cwd()}`, entry)
            )
            : entry;
        // check duplication
        if (this.app.registry.has(plugin) || this.app.notice_plugin_registry.has(plugin) || this.app.message_plugin_registry.has(plugin)) {
            this.logger('app').warn(`duplicate plugin detected: ${plugin.name}`)
            return this;
        }
        // check if it's a valid plugin
        if (typeof plugin !== "function" && !isApplicable(plugin)) {
            throw new Error(
                'invalid plugin, expect function or object with an "apply" method',
            );
        }
        // validate plugin config
        config = this.validate(plugin, config);
        if (!config) {
            return this;
        }
        const context = new Context(this.filter, this.app, plugin);
        if (plugin.type === "ctx") {
            this.logger('app').info(`尝试加载插件，其名称(name)为“${plugin.name}”，文件地址(file)为“%c”，类型(type)为“${plugin.type}”`, file)
            this.app.registry.set(plugin, {
                plugin,
                context,
                id: Random.id(),
                parent: this,
                config: config,
                children: [],
                disposables: [],
            });
            this.state.children.push(plugin);
            const callback = () => {
                if (typeof plugin !== "function") {
                    plugin.apply(context, config);
                } else if (isConstructor(plugin)) {
                    // eslint-disable-next-line new-cap
                    const instance = new plugin(context, config);
                    if (instance instanceof Service && instance.immediate) {
                        context[instance.name] = instance;
                    }
                } else {
                    plugin(context, config);
                }
            };
            callback();
            return this;
        } else if (plugin.type === "notice") {
            this.logger('app').info(`尝试加载插件，其名称(name)为“${plugin.name}”，文件地址(file)为“%c”，类型(type)为“${plugin.type}”`, file)
            this.app.notice_plugin_registry.set(plugin, {
                plugin,
                id: Random.id(),
                config: config,
            });
            return this;
        } else if (plugin.type === "message") {
            this.logger('app').info(`尝试加载插件，其名称(name)为“${plugin.name}”，文件地址(file)为“%c”，类型(type)为“${plugin.type}”`, file)
            this.app.message_plugin_registry.set(plugin, {
                plugin,
                id: Random.id(),
                config: config,
            });
            return this;
        } else {
            this.logger('app').error(`有一个插件加载失败，因为其类型(type)错误，其名称(name)为“${plugin.name}”，文件地址(file)为“%c”，类型(type)为“${plugin.type}”`, file)
            return this;
        }
    }
    plugin_list(list) {
        for (const { disable = false, path, config } of list) {
            !disable && this.plugin(path, config);
        }
    }
    bot_list(list) {
        for (const options of list) {
            !options.disable && this.bots.create(options);
        }
    }
}
Context.middleware = Symbol("middleware");
Context.current = Symbol("source");
(function (Context) {
    Context.Services = [];
    function service(key) {
        if (Object.prototype.hasOwnProperty.call(Context.prototype, key))
            return;
        Context.Services.push(key);
        const privateKey = Symbol(key);
        Object.defineProperty(Context.prototype, key, {
            get() {
                const value = this.app[privateKey];
                if (!value)
                    return;
                defineProperty(value, Context.current, this);
                return value;
            },
            set(value) {
                const oldValue = this.app[privateKey];
                if (oldValue === value)
                    return;
                this.app[privateKey] = value;
                const action = value ? oldValue ? 'changed' : 'enabled' : 'disabled';
                this.logger('service').debug(key, action);
            },
        });
    }
    Context.service = service;
    service('bots');
    Context.deprecatedEvents = {};
})(Context || (Context = {}));
