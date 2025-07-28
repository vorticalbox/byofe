import { define } from "$utils";
import { sessionStore } from "$common/stores.ts";

export default define.middleware(async (ctx) => {
  if (ctx.url.pathname.startsWith("/api/auth")) {
    return ctx.next();
  }
  const accessToken = ctx.req.headers.get("x-access-token");
  if (!accessToken) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const session = await sessionStore.read(accessToken);
  if (!session) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  ctx.state.session = session;
  return ctx.next();
});
