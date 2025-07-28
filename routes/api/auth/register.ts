import * as z from "zod";
import { define } from "$utils";
import kv from "$common/database.ts";
// @deno-types="npm:@types/bcrypt"
import bcrypt from "npm:bcrypt";
import { User } from "$types";
import { userStore } from "$common/stores.ts";

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
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const newUser = new User(data.username, hashedPassword);
    await userStore.create(newUser);
    return new Response(JSON.stringify(newUser), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
