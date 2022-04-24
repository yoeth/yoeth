import { Context, Next, Plugin } from "./context.js";
import { OneBot } from "./onebot.js";
import { Logger, isConstructor } from "../utils/mod.js";

const logger = new Logger('app')
logger.info(`%C`, "Yoeth/0.1.0");

export class App extends Context {
  constructor(options) {
    super(() => true);
    this.app = this;
    this.registry = new Plugin.ContextRegistry();
    this.notice_plugin_registry = new Plugin.NoticeRegistry();
    this.message_plugin_registry = new Plugin.MessageRegistry();
    this.bots = new OneBot.BotList(this);
    this._hooks = {};
    this._sessions = Object.create(null);
    this.options = options || { maxListeners: 64 };
    this.isActive = false;
    this._tasks = new TaskQueue()
    this.registry.set(null, {
      id: '',
      parent: null,
      children: [],
      disposables: [],
    });
    this.on('message.private', this._handleMessage.bind(this))
    this.on('message.group', this._handleMessage.bind(this))
    this.on('message', this._applyMessagePlugin.bind(this))
    this.on('notice', this._applyNoticePlugin.bind(this))
  }
  async start() {
    this.isActive = true
    logger.debug('started')
    for (const callback of this.getHooks('ready')) {
      this._tasks.queue(callback())
    }
    delete this._hooks.ready
    await this._tasks.flush()
  }
  _applyMessagePlugin(session) {
    this.message_plugin_registry.forEach((v) => {
      if (typeof v.plugin !== "function") {
        v.plugin.apply({ session, config: v.config });
      } else if (isConstructor(v.plugin)) {
        new v.plugin({ session, config: v.config });
      } else {
        v.plugin({ session, config: v.config });
      }
    })
  }
  _applyNoticePlugin(session) {
    this.notice_plugin_registry.forEach((v) => {
      if (typeof v.plugin !== "function") {
        v.plugin.apply({ session, config: v.config });
      } else if (isConstructor(v.plugin)) {
        new v.plugin({ session, config: v.config });
      } else {
        v.plugin({ session, config: v.config });
      }
    })
  }
  async _handleMessage(session) {
    // preparation
    this._sessions[session.id] = session;
    const queue = this._hooks[Context.middleware]
      .filter(([context]) => context.match(session))
      .map(([, middleware]) => middleware.bind(null, session));
    // execute middlewares
    let index = 0, midStack = '', lastCall = '';
    const { prettyErrors } = this.options;
    const next = async (callback) => {
      var _a;
      if (prettyErrors) {
        lastCall = new Error().stack.split('\n', 3)[2];
        if (index) {
          const capture = lastCall.match(/\((.+)\)/);
          midStack = `\n  - ${capture ? capture[1] : lastCall.slice(7)}${midStack}`;
        }
      }
      try {
        if (!this._sessions[session.id]) {
          throw new Error('isolated next function detected');
        }
        if (callback !== undefined) {
          queue.push(next => Next.compose(callback, next));
          if (queue.length > Next.MAX_DEPTH) {
            throw new Error(`middleware stack exceeded ${Next.MAX_DEPTH}`);
          }
        }
        return await ((_a = queue[index++]) === null || _a === void 0 ? void 0 : _a.call(queue, next));
      }
      catch (error) {
        let stack = coerce(error);
        if (prettyErrors) {
          const index = stack.indexOf(lastCall);
          if (index >= 0) {
            stack = stack.slice(0, index);
          }
          else {
            stack += '\n';
          }
          stack += `Middleware stack:${midStack}`;
        }
        this.logger('session').warn(`${session.content}\n${stack}`)
      }
    };
    try {
      const result = await next();
      if (result)
        await session.send(result);
    }
    finally {
      // update session map
      delete this._sessions[session.id];
      this.emit(session, 'middleware', session);
    }
  }
}

class TaskQueue {
  #internal = new Set()

  queue(value) {
    const task = Promise.resolve(value)
      .catch(err => logger.warn(err))
      .then(() => this.#internal.delete(task))
    this.#internal.add(task)
  }

  async flush() {
    while (this.#internal.size) {
      await Promise.all(Array.from(this.#internal))
    }
  }
}