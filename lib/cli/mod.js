import { Command } from 'https://deno.land/x/cliffy@v0.20.1/command/mod.ts';
import { UpgradeCommand, DenoLandProvider } from "https://deno.land/x/cliffy@v0.20.1/command/upgrade/mod.ts";

import { App } from "../core/app.js";

if (import.meta.main) {
    const start = new Command()
        .description('运行项目')
        .option('--hostname <hostname:string>', '指定服务的本地域名')
        .option('--port <port:number>', '指定服务的本地端口')
        .action((options) => {
            const hostname = options.hostname || "127.0.0.1";
            const port = options.port || "8844";
            new App().start({ port: port, hostname: hostname });
        });

    const upgrade = new UpgradeCommand({
        main: "cliffy.ts",
        args: ["--allow-net", "--unstable"],
        provider: new DenoLandProvider(),
    });

    await new Command().name('yoeth').command('start', start).command('upgrade', upgrade).parse(Deno.args);
}