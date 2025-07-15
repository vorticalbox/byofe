import { define } from "$utils";
import kv from "$common/database.ts";
import { Session } from "$types";

export default define.middleware(
  async (ctx) => {
    if (ctx.url.pathname.startsWith("/api/auth")) {
      return ctx.next();
    }
    const accessToken = ctx.req.headers.get("x-access-token");
    console.log("Access Token:", accessToken);
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const session = await kv.get<Session>(["sessions", accessToken]);
    if (!session.value) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    ctx.state.session = session.value;
    return ctx.next();
  },
);
