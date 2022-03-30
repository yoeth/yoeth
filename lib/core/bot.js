class Bot {
  #server;
  constructor(server) {
    this.#server = server;
  }
  send_message({ detail_type, group_id, user_id, message }) {
    return this.#server.request("send_message", {
      "detail_type": detail_type,
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
      "message": message,
    });
  }
  delete_message({ message_id }) {
    return this.#server.request("delete_message", {
      "message_id": message_id.toString(),
    });
  }
  get_self_info() {
    return this.#server.request("get_self_info", {});
  }
  get_user_info({ user_id }) {
    return this.#server.request("get_user_info", {
      "user_id": user_id.toString(),
    });
  }
  get_friend_list() {
    return this.#server.request("get_friend_list", {});
  }
  get_group_info({ group_id }) {
    return this.#server.request("get_group_info", {
      "group_id": group_id.toString(),
    });
  }
  get_group_member_info({ group_id, user_id }) {
    return this.#server.request("get_group_member_info", {
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
    });
  }
  get_group_member_list({ group_id }) {
    return this.#server.request("get_group_member_list", {
      "group_id": group_id.toString(),
    });
  }
  set_group_name({ group_id, group_name }) {
    return this.#server.request("set_group_name", {
      "group_id": group_id.toString(),
      "group_name": group_name,
    });
  }
  kick_group_member({ group_id, user_id }) {
    return this.#server.request("kick_group_member", {
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
    });
  }
  ban_group_member({ group_id, user_id, duration }) {
    return this.#server.request("ban_group_member", {
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
      "duration": duration,
    });
  }
  unban_group_member({ group_id, user_id }) {
    return this.#server.request("unban_group_member", {
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
    });
  }
  set_group_admin({ group_id, user_id }) {
    return this.#server.request("set_group_admin", {
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
    });
  }
  unset_group_admin({ group_id, user_id }) {
    return this.#server.request("unset_group_admin", {
      "group_id": group_id.toString(),
      "user_id": user_id.toString(),
    });
  }
  get_latest_events({ limit, timeout }) {
    return this.#server.request("get_latest_events", {
        "limit": limit,
        "timeout": timeout,
      });
  }
  get_status() {
    return this.#server.request("get_status", {});
  }
  get_group_list() {
    return this.#server.request("get_group_list", {});
  }
  leave_group({ group_id }) {
    return this.#server.request("leave_group", {
      "group_id": group_id.toString(),
    });
  }
}
export { Bot };
