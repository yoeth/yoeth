import { std, msgpack } from "../../deps.js";
import { Logger } from "../utils/mod.js";
import { Session } from "./session.js";

class WebsocketsRegistry extends Map {

}

class HttpRegistry extends Map {

}

const logger = new Logger("server");

export class Server {
  constructor(ctx, config) {
    this.ctx = ctx
    this.config = config
    this.listeners = {};
    this.num = 0;
    this.self_id = config.self_id;
    this.ws_registry = new WebsocketsRegistry();
    this.http_registry = new HttpRegistry();
  }
  onmessage(e, flag) {
    let parsed;
    try {
      typeof e.data === "string" ? (parsed = JSON.parse(e.data)) : (parsed = msgpack.decode(e.data));
    } catch (error) {
      logger.error(`消息解析失败，${flag}，原始消息为“${e.data}”`)
    }
    if (parsed.echo in this.listeners) {
      this.listeners[parsed.echo](parsed);
      delete this.listeners[parsed.echo];
    } else if (parsed.type !== "meta") {
      const bot = this.ctx.bots.find(bot => bot.self_id === this.self_id)
      const session = new Session(bot, parsed, parsed.id);
      this.dispatch(session, parsed.detail_type);
    }
  }
  onopen(socket, ws_id) {
    this.ws_registry.set(
      ws_id,
      {
        socket,
        status: "open",
      },
    );
  }
  reconnect(config, time) {
    setTimeout(() => {
      this.connect(config);
    }, time * 1000);
  }
  connect(config) {
    let { url, access_token = null, disable = false, reconnect_interval = 4 } =
      config;
    if (disable) {
      return;
    }
    let ws_id = `${this.num}_${this.config.self_id}`;
    const socket = new WebSocket(url);
    this.ws_registry.set(ws_id, {
      socket,
      status: "created",
    });
    this.num += 1;
    socket.addEventListener("open", () => {
      logger.success(`连接建立，其标识号为“${ws_id}”，统一资源定位符(url)为“%c”，通信方式为“websocket”`, url)
      this.onopen(socket, ws_id)
    });
    socket.addEventListener("message", (e) => {
      this.onmessage(e, `其标识号为“${ws_id}”，统一资源定位符(url)为“%c”，通信方式为“websocket”`, url)
    });
    socket.addEventListener("close", () => {
      logger.error(`连接关闭，其标识号为“${ws_id}”，统一资源定位符(url)为“%c”，通信方式为“websocket”`, url);
      this.ws_registry.delete(ws_id);
      logger.info(`尝试重连，其在重连前的标识号为“${ws_id}”，统一资源定位符(url)为“%c”，通信方式为“websocket”`, url)
      this.reconnect(config, reconnect_interval);
    });
    socket.addEventListener("error", (e) => {
      logger.error(`连接错误，其标识号为“${ws_id}”，统一资源定位符(url)为“%c”，通信方式为“websocket”，错误信息为“${e.message}”`, url);
    });
  }
  listen(config) {
    let { port, host, access_token = null, disable = false } =
      config;
    if (disable) {
      return;
    }
    logger.info(`等待连接，其端口(port)为“%c”，主机名称(host)为“${host}”，通信方式为“websocket_rev”`, port);
    std.serve((req) => {
      let socket, response;
      let ws_id = `${this.num}_${this.config.self_id}`;
      if (
        access_token !== null &&
        req.headers.get("Authorization") !== access_token
      ) {
        logger.error(`连接失败，因为此请求未通过鉴权`);
        return new Response("401 Unauthorized", {
          status: 401,
        });
      }
      try {
        ({ response, socket } = Deno.upgradeWebSocket(req));
      } catch (err) {
        logger.error(`连接失败，因为此请求未尝试升级到 websocket`);
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
        logger.success(`连接建立，其标识号为“${ws_id}”，端口(port)为“%c”，主机名称(host)为“${host}”，通信方式为“websocket_rev”`, port)
        this.onopen(socket, ws_id, `其标识号为“${ws_id}”，端口(port)为“%c”，主机名称(host)为“${host}”，通信方式为“websocket_rev”`, port)
      };
      socket.onmessage = (e) => {
        this.onmessage(e, `其标识号为“${ws_id}”，端口(port)为“%c”，主机名称(host)为“${host}”，通信方式为“websocket_rev”`, port)
      };
      socket.onerror = (e) =>
        logger.error(`连接错误，其标识号为“${ws_id}”，端口(port)为“%c”，主机名称(host)为“${host}”，通信方式为“websocket_rev”，错误信息为“${e.message}”`, port);
      socket.onclose = () => {
        logger.error(`连接关闭，其标识号为“${ws_id}”，端口(port)为“%c”，主机名称(host)为“${host}”，通信方式为“websocket_rev”`, port);
        this.ws_registry.delete(ws_id);
      };
      return response;
    }, { port: port, hostname: host });
  }
  start() {
    if (this.config.disable) {
      return false;
    }
    if (typeof this.config.protocol.websocket_rev !== "undefined") {
      for (
        const config of this.config.protocol
          .websocket_rev
      ) {
        this.listen(config);
      }
    }
    if (typeof this.config.protocol.websocket !== "undefined") {
      for (
        const config of this.config.protocol
          .websocket
      ) {
        this.connect(config);
      }
    }
    if (typeof this.config.protocol.http !== "undefined") {
      let h_num = 0;
      for (
        const { disable = false, access_token = null, url } of this.config.protocol
          .http
      ) {
        if (disable) {
          continue;
        }
        this.http_registry.set(`h_${h_num}_${this.config.self_id}`, {
          url,
          access_token,
        });
        h_num += 1;
      }
    }
  }
  _request(action, params, isMessagePack) {
    const data = {
      action,
      params,
      echo: new Date().getTime().toString(),
    };
    let task = [];
    let serializableData;
    isMessagePack ? (serializableData = msgpack.encode(data)) : (serializableData = JSON.stringify(data));
    this.ws_registry.forEach((v) => {
      if (v.status === "open") {
        task.push(
          new Promise((resolve, reject) => {
            this.listeners[data.echo] = resolve;
            /*setTimeout(() => {
                    delete this.listeners[data.echo];
                    reject(new Error("response timeout"));
                  }, 1500);*/
            v.socket.send(serializableData);
          }),
        );
      }
    });
    this.http_registry.forEach((v, k) => {
      task.push(
        new Promise((resolve, reject) => {
          const headers = new Headers();
          isMessagePack ? headers.append('Content-Type', 'application/msgpack') : headers.append('Content-Type', 'application/json');
          v.access_token !== null && headers.append('Authorization', v.access_token);
          fetch(v.url, {
            method: 'POST',
            headers: headers,
            body: serializableData,
          })
            .then(response => response.json())
            .then(data => {
              resolve(data)
            })
            .catch(error => {
              logger.error(`请求失败，其标识号为“${k}”，统一资源定位符(url)为“%c”，通信方式为“http”，错误信息为“${error.message}”`, v.url);
            })
        }),
      );
    });
    if (task.length === 0) {
      logger.error(`无可用连接，机器人自身账号(self_id)为“${this.self_id}”拥有的 websocket 实例总数为“${this.ws_registry.length}”`);
    }
    return Promise.all(task);
  }
}
