import { serve } from "../../deps.js";

class Server {
    constructor() {
        this.listeners = {};
        this.ws = null;
    }
    listen(port, hostname, app) {
        serve((req) => {
            let socket, response;
            try {
                let res = Deno.upgradeWebSocket(req);
                socket = res.socket;
                response = res.response;
            } catch (err) {
                console.log(err);
                return new Response("request isn't trying to upgrade to websocket.");
            }
            socket.onopen = () => {
                console.log("socket open");
                this.ws = socket;
            };
            socket.onmessage = (e) => {
                let parsed;
                try {
                    parsed = JSON.parse(e.data);
                } catch (error) {
                    console.error('cannot parse message', data)
                }
                if (parsed.echo in this.listeners) {
                    this.listeners[parsed.echo](parsed);
                    delete this.listeners[parsed.echo];
                }
                app.bot_event(parsed);
            };
            socket.onerror = (e) => console.error("socket errored:", e.message);
            socket.onclose = () => console.log("socket closed");
            return response;
        }, { port: port, hostname: hostname });
    }
    request(action, params) {
        const data = { "action": action, "params": params, "echo": new Date().getTime().toString() };
        return new Promise((resolve, reject) => {
            this.listeners[data.echo] = resolve;
            setTimeout(() => {
                delete this.listeners[data.echo];
                reject(new Error('response timeout'));
            }, 1000);
            this.ws.send(JSON.stringify(data));
        })
    }
}

export { Server }

