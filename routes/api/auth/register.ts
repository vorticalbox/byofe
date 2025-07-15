import * as z from "zod";
import { define } from "$utils";
import kv from "$common/database.ts";
// @deno-types="npm:@types/bcrypt"
import bcrypt from "npm:bcrypt";
import { User } from "$types";

const RegisterSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json();
    const data = RegisterSchema.parse(body);
    const user = await kv.get(["users", data.username]);
    if (user.value) {
      return new Response(JSON.stringify({ error: "User already exists" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    // deno-lint-ignore no-unused-vars
    const { password, ...userData } = data;
    await kv.set(
      ["users", data.username],
      new User(data.username, await bcrypt.hash(data.password, 12)),
    );
    return new Response(JSON.stringify(userData), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
