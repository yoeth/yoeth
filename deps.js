import { walk } from "https://deno.land/std@0.136.0/fs/mod.ts";
import { extname, join } from "https://deno.land/std@0.136.0/path/mod.ts";
import { serve } from "https://deno.land/std@0.136.0/http/server.ts";
import { format, inspect } from 'https://deno.land/std@0.136.0/node/util.ts';
import { rgb8 } from "https://deno.land/std@0.136.0/fmt/colors.ts";

export var std;
(function (std) {
    std.walk = walk;
    std.extname = extname;
    std.join = join;
    std.serve = serve;
    std.format = format;
    std.inspect = inspect;
    std.rgb8 = rgb8;
})(std || (std = {}));

export * as msgpack from "https://esm.sh/@msgpack/msgpack/mod.ts";
