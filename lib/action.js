class Action {
    #ws;
    constructor(ws) {
        this.#ws = ws;
    }
    get_latest_events(limit, timeout) {
        const data = {
            "action": "get_latest_events",
            "params": {
                "limit": limit,
                "timeout": timeout,
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_supported_actions() {
        const data = {
            "action": "get_supported_actions"
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_status() {
        const data = {
            "action": "get_status"
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_version() {
        const data = {
            "action": "get_version"
        };
        this.#ws.send(JSON.stringify(data));
    }
    send_message(detail_type, group_id, user_id, message) {
        const data = {
            "action": "send_message",
            "params": {
                "detail_type": detail_type,
                "group_id": group_id,
                "user_id": user_id,
                "message": message
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    delete_message(message_id) {
        const data = {
            "action": "delete_message",
            "params": {
                "message_id": message_id,
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_self_info() {
        const data = {
            "action": "get_self_info"
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_user_info(user_id) {
        const data = {
            "action": "get_user_info",
            "params": {
                "user_id": user_id,
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_friend_list() {
        const data = {
            "action": "get_friend_list",
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_group_info(group_id) {
        const data = {
            "action": "get_group_info",
            "params": {
                "group_id": group_id,
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_group_member_info(group_id, user_id) {
        const data = {
            "action": "get_group_member_info",
            "params": {
                "group_id": group_id,
                "user_id": user_id
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    get_group_member_list(group_id) {
        const data = {
            "action": "get_group_member_list",
            "params": {
                "group_id": group_id
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    set_group_name(group_id, group_name) {
        const data = {
            "action": "set_group_name",
            "params": {
                "group_id": group_id,
                "group_name": group_name
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    kick_group_member(group_id, user_id) {
        const data = {
            "action": "kick_group_member",
            "params": {
                "group_id": group_id,
                "user_id": user_id
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    ban_group_member(group_id, user_id, duration) {
        const data = {
            "action": "ban_group_member",
            "params": {
                "group_id": group_id,
                "user_id": user_id,
                "duration": duration
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    unban_group_member(group_id, user_id) {
        const data = {
            "action": "unban_group_member",
            "params": {
                "group_id": group_id,
                "user_id": user_id
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    set_group_admin(group_id, user_id) {
        const data = {
            "action": "set_group_admin",
            "params": {
                "group_id": group_id,
                "user_id": user_id
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
    unset_group_admin(group_id, user_id) {
        const data = {
            "action": "unset_group_admin",
            "params": {
                "group_id": group_id,
                "user_id": user_id
            }
        };
        this.#ws.send(JSON.stringify(data));
    }
}
export { Action }