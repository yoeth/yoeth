import { cosmokit, Logger } from '../../deps.ts'
import { App } from './app.ts'
import { Bot } from './bot.ts'

type SessionEventCallback = (session: Session) => void

declare module '../../deps.ts' {
    namespace cordis {
        interface Events {
            [prop: string]: SessionEventCallback
        }
    }
}

export namespace Session {
    export interface Payload {
        raw?: Record<string, any>
        platform?: string
        selfId: string
        timestamp?: number
        type?: string
        detailType?: string
        subType?: string
        content?: string
    }
}

export interface Session extends Session.Payload {
    bot: Bot
    app: App
}

const logger = new Logger('session')

export class Session {
    type?: string
    detailType?: string
    subType?: string
    raw?: Record<string, any>
    platform?: string
    constructor(bot: Bot, session: Partial<Session.Payload>) {
        Object.assign(this, session)
        this.platform = bot.platform
        cosmokit.defineProperty(this, 'app', bot.ctx.app)
        cosmokit.defineProperty(this, 'bot', bot)
    }
    async send(content: string | Record<string, any>[] | Record<string, any>) {
        if (!content) return
        return await this.bot.action('send_message', {
            detail_type: this.raw?.detail_type,
            user_id: this.raw?.user_id,
            group_id: this.raw?.group_id,
            guild_id: this.raw?.guild_id,
            channel_id: this.raw?.channel_id,
            message: content
        })
    }
}