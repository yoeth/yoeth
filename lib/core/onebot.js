import { Session } from "./session.js";
import { Bot } from "./bot.js";
import { Server } from "./server.js";

class BotList extends Map {
}

export class OneBot {
  constructor(app) {
    this.app = app;
    this.bot_list = new BotList();
  }
  bot_event(data, socket) {
    if (data.type === "message") {
      for (const entry of this.app.message_plugin) {
        entry.function({
          session: new Session(socket, data),
          config: entry.config,
        });
      }
    } else if (data.type === "notice") {
      for (const entry of this.app.notice_plugin) {
        entry.function({
          bot: new Bot(socket),
          data: data,
          config: entry.config,
        });
      }
    }
  }
  registry(list) {
    for (const bot of list) {
      let socket = new Server(this);
      this.bot_list.set(bot.self_id, {
        socket,
      });
      socket.listen(bot.protocol, bot.self_id);
    }
  }
}
