import { Bot } from "./bot.js";
import { Server } from "./server.js";
import { Context } from './context.js';

export class OneBot extends Server {
  constructor(ctx, config) {
    super(ctx, { ...config })
    this.bots = [];
    ctx.on('ready', () => super.start());
  }
  dispatch(session) {
    if (!this.ctx.app.isActive)
      return;
    const events = [session.type];
    events.unshift(events[0] + '.' + session.detail_type);
    if (session.sub_type && session.sub_type !== "") {
      events.unshift(events[0] + '.' + session.sub_type);
    }
    for (const event of events) {
      this.ctx.emit(session, event, session);
    }
  }
}
(function (OneBot) {
  class BotList extends Array {
    constructor(app) {
      super();
      this.app = app;
      this.adapters = {};
    }
    get(id) {
      return this.find(bot => bot.self_id === id)
    }
    create(options) {
      const adapter = this.resolve(options);
      const bot = new Bot(adapter, options);
      adapter.bots.push(bot);
      this.push(bot);
      return bot;
    }
    resolve(config) {
      const adapter = new OneBot(this[Context.current], config);
      return this.adapters[config.self_id] = adapter;
    }
  }
  OneBot.BotList = BotList;
})(OneBot || (OneBot = {}));