import { walk } from "https://deno.land/std@0.125.0/fs/mod.ts";
import { extname } from "https://deno.land/std@0.125.0/path/mod.ts";

class Plugin {
    plugin_add(name, func) {
        this[name] = func
    }
}

class Session {
    #ws;
    constructor(ws, data) {
        this.alt_message = data.alt_message;
        this.#ws = ws;
        this.detail_type = data.detail_type;
        this.group_id = data.group_id;
        this.user_id = data.user_id;
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
        this.#ws.send(JSON.stringify(obj));
    }
}

class App {
    constructor(ws) {
        this.ws = ws;
        this.plugin_list = new Set();
        this.plugin_manage = new Plugin();
        this.load_plugin();
    }
    bot_event(data) {
        if (data.status === "failed") {
            console.error(data)
        } else if (data.type !== "meta") {
            let args = {
                class_this: this,
                data: data
            }
            this.plugin_list.forEach(this.trigger_plugin, args);
        }
    }
    async load_plugin() {
        for await (const entry of walk("plugin")) {
            if (extname(entry.path) === ".js" || extname(entry.path) === ".ts") {
                try {
                    const module = await import(`file://${Deno.cwd()}\\${entry.path}`)
                    console.log(`已加载插件: ${module.default.name}`);
                    this.plugin_manage.plugin_add(module.default.name, module.default);
                    this.plugin_list.add(module.default.name);
                } catch (err) {
                    console.error(err.message);
                };
            }
        }
    }
    trigger_plugin(name) {
        const { class_this, data } = this;
        class_this.plugin_manage[name]({ session: new Session(class_this.ws, data) });
    }
}

export { App }