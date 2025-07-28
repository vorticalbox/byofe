import { define } from "$utils";
import { userStore } from "$common/stores.ts";


export const handler = define.handlers({
  async GET(ctx) {
    const { username } = ctx.params;
    const user = await userStore.read(username);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { password: _password, ...userData } = user;
    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
