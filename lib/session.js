
import { Bot } from "./bot.js"
import { Action } from "./action.js"

class Session {
    #ws;
    constructor(ws, data) {
        this.#ws = ws;

        this.raw = data;
        this.self_id = data.self_id;
        this.type = data.type;
        this.user_id = data.user_id;
        this.message_id = data.message_id;
        this.time = data.time;
        this.message = data.message;
        this.alt_message = data.alt_message;
        this.group_id = data.group_id;
        this.detail_type = data.detail_type;
        this.platform = data.platform;
        this.impl = data.impl;
        this.sub_type = data.sub_type;
    }
    get Bot() {
        return new Bot(this.#ws);
    }
    send(value) {
        new Action(this.#ws).send_message(this.detail_type, this.group_id, this.user_id, value);
    }
}

export { Session }