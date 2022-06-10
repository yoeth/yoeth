import { Random } from '../utils/mod.ts'
import { Adapter } from './adapter.ts'
import { cordis, cosmokit, Logger } from '../../deps.ts'

export interface Bot extends Bot.BaseConfig, Bot.Methods {
  socket?: WebSocket
}

export abstract class Bot<T extends Bot.BaseConfig = Bot.BaseConfig> {
  public app: cordis.App
  public ctx: cordis.Context
  public platform: string
  public hidden?: boolean
  public internal?: any
  public selfId?: string
  public logger: Logger
  public id = Random.id()

  error?: Error

  constructor(public adapter: Adapter, public config: T) {
    this.ctx = adapter.ctx
    this.app = this.ctx.app
    this.platform = config.platform || adapter.platform
    this.logger = new Logger(adapter.platform)

    adapter.ctx.on('ready', () => this.start())
    adapter.ctx.on('dispose', () => this.stop())
  }


  async start() {
    if (this.config.disabled) return
    await this.adapter.connect(this)
  }

  async stop() {
    try {
      await this.adapter.disconnect(this)
    } catch (error) {
      this.logger.warn(error)
    }
  }

  get sid() {
    return `${this.platform}:${this.selfId}`
  }
}

export namespace Bot {
  export const library: cosmokit.Dict<Bot.Constructor> = {}

  export interface BaseConfig {
    disabled?: boolean
    protocol?: string
    platform?: string
  }

  export interface Constructor<S extends Bot.BaseConfig = Bot.BaseConfig> {
    new(adapter: Adapter, config: S): Bot<S>
  }

  export interface Methods {
    // message
    action(action: string, params: Record<string, any>, isMessagePack?: boolean): Promise<Record<string, any> | Error>
  }
}