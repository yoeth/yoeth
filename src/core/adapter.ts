import { paramCase } from '../utils/mod.ts'
import { cordis, cosmokit } from '../../deps.ts'
import { Session } from './session.ts'
import { Bot } from './bot.ts'

declare module '../../deps.ts' {
  namespace cordis {
    interface Context {
      bots: Adapter.BotList
    }
  }
}

function remove<T>(list: Array<T>, item: any) {
  const index = list.indexOf(item)
  if (index >= 0) {
    list.splice(index, 1)
    return true
  }
}

export abstract class Adapter<S extends Bot.BaseConfig = Bot.BaseConfig, T = {}> {
  public bots: Bot<S>[] = []
  public platform!: string

  protected abstract start(): cosmokit.Awaitable<void>
  protected abstract stop(): cosmokit.Awaitable<void>

  constructor(public ctx: cordis.Context, public config: T) {
    ctx.on('ready', () => this.start())
    ctx.on('dispose', () => this.stop())
  }

  connect(bot: Bot): cosmokit.Awaitable<void> { }
  disconnect(bot: Bot): cosmokit.Awaitable<void> { }

  dispatch(session: Session) {
    if (!this.ctx.lifecycle.isActive) return
    const events: string[] = [session.type!]
    events.unshift(events[0] + '.' + session.detailType)
    if (session.subType) {
      events.unshift(events[0] + '.' + session.subType)
    }
    for (const event of events) {
      this.ctx.emit(session, paramCase<any>(event), session)
    }
  }
}

export namespace Adapter {
  export interface Constructor<T extends Bot.BaseConfig = Bot.BaseConfig, S = any> {
    new(ctx: cordis.Context, options?: S): Adapter<T>
  }

  export function join(platform: string, protocol: string) {
    return protocol ? `${platform}.${protocol}` : platform
  }

  export class BotList extends Array<Bot> {
    adapters: cosmokit.Dict<Adapter> = {}

    get caller(): cordis.Context {
      return this[cordis.Context.current as any] as any || this.ctx
    }

    constructor(private ctx: cordis.Context) {
      super()
    }

    get(sid: string) {
      return this.find(bot => bot.sid === sid)
    }

    create<T extends Bot>(platform: string, options: any, botConstructor: new (adapter: Adapter, config: any) => T, adapterConstructor: Constructor): T {
      const adapter = new adapterConstructor(this.caller, options)
      adapter.platform = platform
      const bot = new botConstructor(adapter, options)
      adapter.bots.push(bot)
      this.push(bot)
      return bot
    }

    remove(id: string) {
      const index = this.findIndex(bot => bot.id === id)
      if (index < 0) return
      const [bot] = this.splice(index, 1)
      const exist = remove(bot.adapter.bots, bot)
      return exist
    }
  }
}

cordis.Context.service('bots', {
  constructor: Adapter.BotList,
})