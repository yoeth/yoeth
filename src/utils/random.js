/**
 * random operations
 */
export class Random {
    constructor(value = Math.random()) {
        this.value = value;
    }
    bool(probability) {
        if (probability >= 1)
            return true;
        if (probability <= 0)
            return false;
        return this.value < probability;
    }
    real(...args) {
        const start = args.length > 1 ? args[0] : 0;
        const end = args[args.length - 1];
        return this.value * (end - start) + start;
    }
    int(...args) {
        return Math.floor(this.real(...args));
    }
    pick(source) {
        return source[Math.floor(this.value * source.length)];
    }
    splice(source) {
        return source.splice(Math.floor(this.value * source.length), 1)[0];
    }
    weightedPick(weights) {
        const total = Object.entries(weights).reduce((prev, [, curr]) => prev + curr, 0);
        const pointer = this.value * total;
        let counter = 0;
        for (const key in weights) {
            counter += weights[key];
            if (pointer < counter)
                return key;
        }
    }
}
(function (Random) {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    function id(length = 8, radix = 16) {
        let result = '';
        for (let i = 0; i < length; ++i) {
            result += chars[Math.floor(Math.random() * radix)];
        }
        return result;
    }
    Random.id = id;
    function real(...args) {
        return new Random().real(...args);
    }
    Random.real = real;
    function int(...args) {
        return new Random().int(...args);
    }
    Random.int = int;
    function pick(source) {
        return new Random().pick(source);
    }
    Random.pick = pick;
    function shuffle(source) {
        const clone = source.slice();
        const result = [];
        for (let i = source.length; i > 0; --i) {
            result.push(new Random().splice(clone));
        }
        return result;
    }
    Random.shuffle = shuffle;
    function multiPick(source, count) {
        source = source.slice();
        const result = [];
        const length = Math.min(source.length, count);
        for (let i = 0; i < length; i += 1) {
            const index = Math.floor(Math.random() * source.length);
            const [item] = source.splice(index, 1);
            result.push(item);
        }
        return result;
    }
    Random.multiPick = multiPick;
    function weightedPick(weights) {
        return new Random().weightedPick(weights);
    }
    Random.weightedPick = weightedPick;
    function bool(probability) {
        return new Random().bool(probability);
    }
    Random.bool = bool;
})(Random || (Random = {}));