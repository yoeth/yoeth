import { walk } from "../../deps.js";
import { extname } from "../../deps.js";
import { Session } from "./session.js";
import { Bot } from "./bot.js";
import { Server } from "./server.js"

class MessagePlugin {
    plugin_add(name, func) {
        this[name] = func;
    }
}

class EventPlugin {
    plugin_add(name, func) {
        this[name] = func;
    }
}

class App {
    constructor() {
        this.message_plugin_list = new Set();
        this.message_plugin_manage = new MessagePlugin();
        this.event_plugin_list = new Set();
        this.event_plugin_manage = new EventPlugin();
        this.server = null;
    }
    bot_event(data) {
        if (data.type === "message") {
            this.message_plugin_list.forEach((name) => {
                this.message_plugin_manage[name]({ session: new Session(this.server, data) });
            });
        }else if (data.type === "notice") {
            this.event_plugin_list.forEach((name) => {
                this.event_plugin_manage[name]({ bot: new Bot(this.server), data: data });
            });
        }
    }
    async load_plugin() {
        for await (const entry of walk("message_plugin")) {
            if (extname(entry.path) === ".js" || extname(entry.path) === ".ts") {
                try {
                    const module = await import(`file://${Deno.cwd()}\\${entry.path}`);
                    console.log(`已加载 Message 插件: ${module.default.name}`);
                    this.message_plugin_manage.plugin_add(module.default.name, module.default);
                    this.message_plugin_list.add(module.default.name);
                } catch (err) {
                    console.error(err.message);
                };
            }
        }
        for await (const entry of walk("notice_plugin")) {
            if (extname(entry.path) === ".js" || extname(entry.path) === ".ts") {
                try {
                    const module = await import(`file://${Deno.cwd()}\\${entry.path}`);
                    console.log(`已加载 Notice 插件: ${module.default.name}`);
                    this.event_plugin_manage.plugin_add(module.default.name, module.default);
                    this.event_plugin_list.add(module.default.name);
                } catch (err) {
                    console.error(err.message);
                };
            }
        }
    }
    async start({ port, hostname }) {
        await this.load_plugin();
        this.server = new Server();
        this.server.listen(port, hostname, this)
    }
}

export { App }