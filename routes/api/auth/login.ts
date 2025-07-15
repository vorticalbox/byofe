import * as z from "zod";
// @deno-types="npm:@types/bcrypt"
import bcrypt from "npm:bcrypt";

import kv from "$common/database.ts";
import { define } from "$utils";
import { Session, User } from "$types";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

function generateSessionToken() {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  return "byofe_" + Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json();
    const data = LoginSchema.parse(body);
    const user = await kv.get<User>(["users", data.username]);
    if (!user.value) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const isValidPassword = await bcrypt.compare(
      data.password,
      user.value.password,
    );
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const sessionToken = generateSessionToken();
    const session = new Session(
      sessionToken,
      user.value.username,
      3600,
    );
    const oldSession = await kv.get<string>(["sessions", user.value.username]);
    const transactions = kv.atomic()
      .delete(["sessions", user.value.username])
      .set(["sessions", sessionToken], session)
      .set(["sessions", user.value.username], sessionToken);
    if (oldSession.value) {
      transactions.delete(["sessions", oldSession.value]);
    }
    await transactions.commit();
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
