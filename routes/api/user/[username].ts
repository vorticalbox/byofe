import { define } from "$utils";
import kv from "$common/database.ts";
import { User } from "$types";

export const handler = define.handlers({
  async GET(ctx) {
    const { username } = ctx.params;
    const user = await kv.get<User>(["users", username]);
    if (!user.value) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const { password: _password, ...userData } = user.value;
    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
