import { join } from "../../deps.js";
import { Context } from "./context.js";
import { OneBot } from "./onebot.js";
import { log } from "../utils/logger.js";

class App extends Context {
  constructor() {
    super();
    this.message_plugin = new Array();
    this.notice_plugin = new Array();
    this.bots = new OneBot(this);
    this.app = this;
  }
  async plugin({ entry, config }) {
    let is_url, file;
    if (typeof entry === "string") {
      is_url = true;
      file = entry;
    } else {
      is_url = false;
      file = "null";
    }
    try {
      let module = is_url
        ? await import(
          file.includes("://") ? file : join(`file://${Deno.cwd()}`, file)
        )
        : entry;
      if (
        typeof (module.type) === "undefined" || module.type === "message"
      ) {
        this.message_plugin.push({
          function: module.apply,
          config: typeof (config) === "undefined" ? null : config,
        });
        log(
          "插件服务:加载成功",
          `name:${module.name}  file:${file}  type:message`,
          "green",
        );
      } else if (module.type === "notice") {
        this.notice_plugin.push({
          function: module.apply,
          config: typeof (config) === "undefined" ? null : config,
        });
        log(
          "插件服务:加载成功",
          `name:${module.name}  file:${file}  type:notice`,
          "green",
        );
      } else {
        log(
          "插件服务:加载失败",
          `name:${module.name}  file:${file}  type:${module.type}  error_message:插件 type 错误`,
          "red",
        );
      }
    } catch (err) {
      log(
        "插件服务:加载失败",
        `file:${file}  error_message:${err.message}`,
        "red",
      );
    }
  }
  plugin_list({ list }) {
    for (const { disable = false, path, config } of list) {
      if (!disable) {
        this.plugin({ entry: path, config: config });
      }
    }
  }
  start({ bots, plugins }) {
    this.plugin_list({ list: plugins });
    this.bots.registry(bots);
  }
}

export { App };
