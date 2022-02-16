import { serve } from "https://deno.land/std@0.125.0/http/server.ts";
import { App } from "./core.js"

let app = null

function handler(req) {
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
        console.log("socket opened")
        if(app===null){
            app = new App(socket);
        }
    };
    socket.onmessage = (e) => {
        app.bot_event(JSON.parse(e.data));
    };
    socket.onerror = (e) => console.log("socket errored:", e.message);
    socket.onclose = () => console.log("socket closed");
    return response;
}
serve(handler, { port: 8844, hostname: "127.0.0.1" });