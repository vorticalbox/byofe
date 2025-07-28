/// <reference lib="deno.unstable" />
export default await Deno.openKv(Deno.env.get("KV_PATH"));
