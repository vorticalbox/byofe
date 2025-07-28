import * as z from "zod";
import bcrypt from "bcryptjs";

import { define } from "$utils";
import { Session } from "$types";
import { sessionStore, userStore } from "$common/stores.ts";

const LoginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

function generateSessionToken() {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  return (
    "byofe_" +
    Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export const handler = define.handlers({
  async POST(ctx) {
    const body = await ctx.req.json();
    const data = LoginSchema.parse(body);
    const user = await userStore.read(data.username);
    if (!user) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }
    const isValidPassword = await bcrypt.compare(data.password, user.password);
    if (!isValidPassword) {
      return new Response(JSON.stringify({ error: "Invalid password" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const sessionToken = generateSessionToken();
    const session = new Session(sessionToken, user.username, 3600);
    // find the user
    const existingSession = await sessionStore.read(user.username);
    const keys = [];
    if (existingSession) {
      // if session exists, remove it
      keys.push(existingSession.token);
      keys.push(existingSession.username);
    }
    await sessionStore.delete(keys);
    await sessionStore.create(session);
    return new Response(JSON.stringify(session), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  },
});
