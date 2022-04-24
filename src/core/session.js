import { defineProperty } from "../utils/mod.js"

export class Session {
    constructor(bot, data, id) {
        defineProperty(this, 'app', bot.app)
        defineProperty(this, 'bot', bot)
        this.raw = data
        this.content = data.alt_message
        this.type = data.type
        this.detail_type = data.detail_type
        this.id = id
    }
    send(message) {
        return this.bot.action("send_message", {
            "detail_type": this.raw.detail_type,
            "group_id": this.raw.group_id,
            "user_id": this.raw.user_id,
            "message": message
        })
    }
}