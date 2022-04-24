export class Bot {
    constructor(adapter, config) {
        this.adapter = adapter
        this.config = config
        this.app = adapter.ctx.app
        this.self_id = config.self_id
    }
    action(event, options = {}) {
        return this.adapter._request(event, options)
    }
}