
import { Bot } from "./bot.js"

class Session {
    #server;
    constructor(server, data) {
        this.#server = server;

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
        //return new Bot(this.#ws);
    }
    send({ message }) {
        return this.#server.request("send_message", {
            "detail_type": this.detail_type,
            "group_id": this.group_id,
            "user_id": this.user_id,
            "message": message
        })
    }
}

export { Session }