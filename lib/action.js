class Action {
    #ws;
    constructor(ws) {
        this.#ws = ws;
    }
    send_message(value) {
        const obj = {
            "action": "send_message",
            "params": {
                "detail_type": this.detail_type,
                "group_id": this.group_id,
                "user_id": this.user_id,
                "message": [{
                    "type": "text",
                    "data": {
                        "text": value
                    }
                }]
            }
        };
        console.log(JSON.stringify(obj))
        this.#ws.send(JSON.stringify(obj));
    }
}
export { Action }