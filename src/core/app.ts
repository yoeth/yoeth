import { cordis, join, Logger } from '../../deps.ts'
import { OneBot, OneBotWebSocketServer, OneBotWebSocketClient } from './onebot.ts'

export interface plugin {
    path: string
    disabled?: boolean
    config: any
}

export interface bot {
    disabled?: boolean
    platform: string
    selfId: string
    protocol: 'websocket' | 'websocket_rev' | 'http'
    websocket?: {
        url: string
        access_token?: string
        reconnect_interval?: number
    }
    websocket_rev?: {
        host: string
        port: number
        access_token?: string
    }
}

const logger = new Logger('app')
logger.info(`%C`, "Yoeth/0.2.0")

export class App {
    private app = new cordis.App()
    async addBot(entry: bot) {
        const connect = entry.protocol === 'websocket_rev' ? OneBotWebSocketServer : OneBotWebSocketClient
        this.app.bots.create(entry.platform, entry, OneBot, connect)
    }
    async addBotList(list: bot[]) {
        for (const entry of list) {
            if (entry.disabled) {
                continue
            }
            this.addBot(entry)
        }
    }
    addPlugin(entry: Function, options: any) {
        this.app.plugin(entry, options)
    }
    async addPluginList(list: plugin[]) {
        for (const entry of list) {
            if (entry.disabled) {
                continue
            }
            const file = entry.path.includes("://") ? entry.path : join(`file://${Deno.cwd()}`, entry.path)
            const plugin = await import(file)
            this.addPlugin(plugin, entry.config)
        }
    }
    async run() {
        await this.app.start()
    }
}