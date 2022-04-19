import { serve } from "../../deps.js";
import { log } from "../utils/logger.js";

class WebsocketsRegistry extends Map {
}

class Server {
  constructor(app) {
    this.listeners = {};
    this.app = app;
    this.num = 0;
    this.ws_registry = new WebsocketsRegistry();
  }
  dispatch(parsed) {
    if (parsed.echo in this.listeners) {
      this.listeners[parsed.echo](parsed);
      delete this.listeners[parsed.echo];
    }
    this.app.bot_event(parsed, this);
  }
  reconnect(config, self_id, time) {
    setTimeout(() => {
      this.connect(config, self_id);
    }, time * 1000);
  }
  connect(config, self_id) {
    let { url, access_token = null, disable = false, reconnect_interval = 4 } =
      config;
    if (disable) {
      return;
    }
    let ws_id = `${this.num}_${self_id}`;
    const socket = new WebSocket(url);
    this.ws_registry.set(ws_id, {
      socket,
      status: "created",
    });
    this.num += 1;
    socket.addEventListener("open", () => {
      log(
        "通信服务:连接建立",
        `ws_id:${ws_id}  url:${url}  protocol:websocket`,
        "green",
      );
      this.ws_registry.set(
        ws_id,
        {
          socket,
          status: "open",
        },
      );
    });
    socket.addEventListener("message", (e) => {
      let parsed;
      try {
        parsed = JSON.parse(e.data);
      } catch (error) {
        log(
          "通信服务:消息解析失败",
          `ws_id:${ws_id}  url:${url}  protocol:websocket  raw_message:${e.data}`,
          "red",
        );
        return;
      }
      this.dispatch(parsed);
    });
    socket.addEventListener("close", () => {
      log("通信服务:连接关闭", `ws_id:${ws_id}  url:${url}  protocol:websocket`, "red");
      this.ws_registry.delete(ws_id);
      log(
        "通信服务:尝试重连",
        `ws_old_id:${ws_id}  url:${url}  protocol:websocket`,
        "yellow",
      );
      this.reconnect(config, self_id, reconnect_interval);
    });
    socket.addEventListener("error", (e) => {
      log(
        "通信服务:连接错误",
        `ws_id:${ws_id}  url:${url}  protocol:websocket  error_message:${e.message}`,
        "red",
      );
    });
  }
  listen(protocol, self_id) {
    if (typeof protocol.websocket_rev !== "undefined") {
      for (
        const { port, host, access_token = null, disable = false } of protocol
          .websocket_rev
      ) {
        if (disable) {
          continue;
        }
        serve((req) => {
          let socket, response;
          let ws_id = `${this.num}_${self_id}`;
          if (
            access_token !== null &&
            req.headers.get("Authorization") !== access_token
          ) {
            log(
              "通信服务:连接失败",
              `error_message:401 Unauthorized`,
              "red",
            );
            return new Response("401 Unauthorized", {
              status: 401,
            });
          }
          try {
            ({ response, socket } = Deno.upgradeWebSocket(req));
          } catch (err) {
            log(
              "通信服务:连接失败",
              `error_message:request isn't trying to upgrade to websocket.`,
              "red",
            );
            return new Response(
              "request isn't trying to upgrade to websocket.",
            );
          }
          this.ws_registry.set(ws_id, {
            socket,
            status: "created",
          });
          this.num += 1;
          socket.onopen = () => {
            log(
              "通信服务:连接建立",
              `ws_id:${ws_id}  port:${port}  host:${host}  protocol:websocket_rev`,
              "green",
            );
            this.ws_registry.set(
              ws_id,
              {
                socket,
                status: "open",
              },
            );
          };
          socket.onmessage = (e) => {
            let parsed;
            try {
              parsed = JSON.parse(e.data);
            } catch (error) {
              log(
                "通信服务:消息解析失败",
                `ws_id:${ws_id}  port:${port}  host:${host}  protocol:websocket_rev  raw_message:${e.data}`,
                "red",
              );
              return;
            }
            this.dispatch(parsed);
          };
          socket.onerror = (e) =>
            log(
              "通信服务:连接错误",
              `ws_id:${ws_id}  port:${port}  host:${host}  protocol:websocket_rev  error_message:${e.message}`,
              "red",
            );
          socket.onclose = () => {
            log(
              "通信服务:连接关闭",
              `ws_id:${ws_id}  port:${port}  host:${host}  protocol:websocket_rev`,
              "red",
            );
            this.ws_registry.delete(ws_id);
          };
          return response;
        }, { port: port, hostname: host });
      }
    }
    if (typeof protocol.websocket !== "undefined") {
      for (
        const config of protocol
          .websocket
      ) {
        this.connect(config, self_id);
      }
    }
  }
  request(action, params) {
    const data = {
      "action": action,
      "params": params,
      "echo": new Date().getTime().toString(),
    };
    let task = [];
    this.ws_registry.forEach((v) => {
      if (v.status === "open") {
        task.push(
          new Promise((resolve, reject) => {
            this.listeners[data.echo] = resolve;
            /*setTimeout(() => {
                    delete this.listeners[data.echo];
                    reject(new Error("response timeout"));
                  }, 1500);*/
            v.socket.send(JSON.stringify(data));
          }),
        );
      }
    });
    if (task.length === 0) {
      log("通信服务:无可用连接", `ws_total:${this.ws_registry.length}`, "red");
    }
    return Promise.all(task);
  }
}

export { Server };
