import { defineProperty } from "../utils/mod.js"

function remove(list, item) {
    const index = list.indexOf(item);
    if (index >= 0) {
        list.splice(index, 1);
        return true;
    }
}

export class Session {
    constructor(bot, data, id) {
        this.raw = data
        this.content = data.alt_message
        this.type = data.type
        this.detail_type = data.detail_type
        defineProperty(this, 'id', id);
        defineProperty(this, '_queued', Promise.resolve());
        defineProperty(this, 'app', bot.app)
        defineProperty(this, 'bot', bot)
        defineProperty(this, '_hooks', []);
    }
    send(message) {
        return this.bot.action("send_message", {
            "detail_type": this.raw.detail_type,
            "group_id": this.raw.group_id,
            "user_id": this.raw.user_id,
            "message": message
        })
    }
    async send_queued(content, delay) {
        if (!content)
            return;
        if (typeof delay === 'undefined') {
            const { message, character } = this.app.options.delay;
            delay = Math.max(message, character * content.length);
        }
        return this._queued = this._queued.then(() => new Promise((resolve) => {
            const hook = () => {
                resolve();
                clearTimeout(timer);
                remove(this._hooks, hook);
            };
            this._hooks.push(hook);
            const timer = setTimeout(async () => {
                await this.send(content);
                this._delay = delay;
                hook();
            }, this._delay || 0);
        }));
    }
}