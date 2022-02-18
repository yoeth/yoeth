import { serve } from "../../deps.js";
import { App } from "./app.js"

class Server {
    constructor() {
        this.app = null;
    }
    listen({ port: port, hostname: hostname }) {
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
                this.app = new App(socket);
            };
            socket.onmessage = (e) => {
                this.app.bot_event(JSON.parse(e.data));
            };
            socket.onerror = (e) => console.error("socket errored:", e.message);
            socket.onclose = () => console.log("socket closed");
            return response;
        }, { port: port, hostname: hostname });
    }
}

export { Server }
