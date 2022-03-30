import { Session } from "./session.js";
import { Bot } from "./bot.js";
import { Server } from "./server.js";
import { join } from "../../deps.js";

class App {
  constructor() {
    this.message_plugin = new Array();
    this.notice_plugin = new Array();
    this.server = null;
  }
  bot_event(data) {
    if (data.type === "message") {
      for (const entry of this.message_plugin) {
        entry.function({
          session: new Session(this.server, data),
          config: entry.config,
        });
      }
    } else if (data.type === "notice") {
      for (const entry of this.notice_plugin) {
        entry.function({
          bot: new Bot(this.server),
          data: data,
          config: entry.config,
        });
      }
    }
  }
  async load_plugin(plugin_list) {
    for (const entry of plugin_list) {
      if (typeof (entry.disable) === "undefined" || !entry.disable) {
        try {
          const module = await import(
            entry.path.includes("://")
              ? entry.path
              : join(`file://${Deno.cwd()}`, entry.path)
          );
          if (
            typeof (module.type) === "undefined" || module.type === "message"
          ) {
            this.message_plugin.push({
              function: module.default,
              config: typeof (entry.config) === "undefined"
                ? null
                : entry.config,
            });
            console.log(`已加载插件: ${entry.path}`);
          } else if (module.type === "notice") {
            this.notice_plugin.push({
              function: module.default,
              config: typeof (entry.config) === "undefined"
                ? null
                : entry.config,
            });
            console.log(`已加载插件: ${entry.path}`);
          }
        } catch (err) {
          console.error(err.message);
        }
      }
    }
  }
  async start({ port, hostname, plugins }) {
    await this.load_plugin(plugins);
    this.server = new Server();
    this.server.listen(port, hostname, this);
  }
}

export { App };
