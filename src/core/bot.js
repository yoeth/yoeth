export class Bot {
    constructor(adapter, config) {
        this.adapter = adapter
        this.config = config
        this.app = adapter.ctx.app
        this.self_id = config.self_id
    }
    action(action, params = {}) {
        const field = ["message", "group_id", "user_id", "message_id", "group_name"]
        for (const entry of field) {
            typeof params[entry] === "number" && (params[entry] = params[entry].toString())
        }
        return this.adapter._request(action, params)
    }
}