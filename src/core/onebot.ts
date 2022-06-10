import { Bot } from './bot.ts'
import { Adapter } from './adapter.ts'
import { bot } from './app.ts'
import { cordis, serve, cosmokit, msgpack, Logger } from '../../deps.ts'
import { Session } from './session.ts'

const logger = new Logger('onebot')

export class OneBot extends Bot {
    public _request?(action: string, params: Record<string, any>, isMessagePack: boolean): Promise<OneBot.Response>

    constructor(adapter: Adapter, config: bot) {
        super(adapter, config)
        this.selfId = config.selfId.toString()
    }
    async action(action: string, params: Record<string, any> = {}, isMessagePack = false): Promise<OneBot.Response | Error> {
        const field = ["message", "group_id", "user_id", "message_id", "group_name", 'guild_id', 'channel_id']
        for (const entry of field) {
            typeof params[entry] === "number" && (params[entry] = params[entry].toString())
        }
        if (this._request) {
            return await this._request(action, params, isMessagePack)
        }
        return Error('未连接到 OneBot 实现')
    }
}

export namespace OneBot {
    export interface Response {
        status: string
        retcode: number
        data: any
        message: string
    }
}

export class OneBotWebSocketServer extends Adapter<{}, bot> {
    public wsServer?: WebSocket

    protected accept = accept

    constructor(ctx: cordis.Context, config: bot) {
        super(ctx, config)
        const { access_token, port, host } = config.websocket_rev!
        serve((req) => {
            let response, socket: WebSocket
            if (
                access_token &&
                req.headers.get("Authorization") !== access_token
            ) {
                logger.error(`401 Unauthorized`);
                return new Response("401 Unauthorized", {
                    status: 401
                })
            }
            const selfId = req.headers.get("x-self-id") || ""
            const bot = this.bots.find(bot => bot.selfId === selfId.toString())
            if (!bot) {
                logger.error(`invalid x-self-id`)
                return new Response("invalid x-self-id", {
                    status: 403
                })
            }
            try {
                ({ response, socket } = Deno.upgradeWebSocket(req));
            } catch (err) {
                logger.error(`request isn't trying to upgrade to websocket.`)
                return new Response(
                    "request isn't trying to upgrade to websocket.",
                )
            }
            bot!.socket = socket
            this.accept(bot as unknown as OneBot)
            return response
        }, { port: port, hostname: host })
    }

    start() { }

    stop() { }
}

export class OneBotWebSocketClient extends Adapter<{}, bot> {
    public wsServer?: WebSocket
    public isListening = false

    protected accept = accept

    constructor(ctx: cordis.Context, config: bot) {
        super(ctx, config)
        const { access_token, url, reconnect_interval = 4 } = config.websocket!
        const bot = this.bots.find(bot => bot.selfId === config.selfId.toString())
        const reconnect = async (initial = false) => {
            logger.debug('websocket client opening')
            const socket = new WebSocket(url)
            const socketUrl = socket.url.replace(/\?.+/, '')

            socket.addEventListener('error', e => logger.debug(e))

            socket.addEventListener('close', (e) => {
                bot!.socket = undefined
                if (this.isListening) return
                const message = e.reason.toString() || `failed to connect to ${socketUrl}, code: ${e.code}`
                logger.warn(`${message}, will retry in ${cosmokit.Time.format(reconnect_interval)}...`)
                setTimeout(() => {
                    this.isListening && reconnect()
                }, reconnect_interval)
            })

            socket.addEventListener('open', () => {
                bot!.socket = socket
                logger.info('connect to server: %c', url)
                this.accept(bot as unknown as OneBot)
            })
        }

        reconnect(true)
    }

    start() {
        this.isListening = true
    }

    stop() { }
}

let counter = 0
const listeners: Record<string, (response: OneBot.Response) => void> = {}

export function accept(this: Adapter<{}, bot>, bot: OneBot) {
    bot.socket!.addEventListener('message', ({ data }) => {
        let parsed: any
        try {
            parsed = typeof data === 'string' ? JSON.parse(data) : msgpack.decode(data)
        } catch (error) {
            return logger.warn('cannot parse message', data)
        }

        if ('type' in parsed) {
            logger.debug('receive %o', parsed)
            dispatchSession(bot, parsed)
        } else if (parsed.echo in listeners) {
            listeners[parsed.echo](parsed)
            delete listeners[parsed.echo]
        }
    })

    bot.socket!.addEventListener('close', () => {
        delete bot.internal._request
    })

    bot._request = (action: string, params: Record<string, any>, isMessagePack: boolean) => {
        const echo = (++counter).toString()
        const data = { action, params, echo }
        return new Promise((resolve, reject) => {
            listeners[echo] = resolve
            setTimeout(() => {
                delete listeners[echo]
                reject(new Error('response timeout'))
            }, cosmokit.Time.minute)
            const serialize = isMessagePack ? msgpack.encode(data) : JSON.stringify(data)
            bot.socket!.send(serialize)
        })
    }
}

export function dispatchSession(bot: OneBot, data: any) {
    const payload = adaptSession(data)
    if (!payload) return

    const session = new Session(bot, payload)
    bot.adapter.dispatch(session)
}

function adaptSession(data: any) {
    const session: Partial<Session> = {}
    data.type && (session.type = data.type)
    data.detail_type && (session.detailType = data.detail_type)
    data.sub_type && (session.subType = data.sub_type)
    data.alt_message && (session.content = data.alt_message)
    session.raw = data
    return session
}