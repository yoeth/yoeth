
import { Bot } from "./bot.js"

class Session {
    #server;
    constructor(server, data) {
        this.#server = server;

        this.raw = data;
        this.self_id = data.self_id;
        this.user_id = data.user_id;
        this.message_id = data.message_id;
        this.message = data.message;
        this.alt_message = data.alt_message;
        this.group_id = data.group_id;
        this.detail_type = data.detail_type;
        this.platform = data.platform;
        this.sub_type = data.sub_type;
    }
    get bot() {
        return new Bot(this.#server);
    }
    send({ message }) {
        return this.#server.request("send_message", {
            "detail_type": this.detail_type,
            "group_id": this.group_id,
            "user_id": this.user_id,
            "message": message
        }, this.self_id)
    }
}

export { Session }