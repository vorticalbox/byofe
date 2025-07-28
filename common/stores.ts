import { Session, User } from "$types";
import PathStore from "./pathStore.ts";
import kv from "./database.ts";

export const sessionStore = new PathStore<Session>(kv, "sessions", [
  "username",
  "token",
]);

export const userStore = new PathStore<User>(kv, "users", ["username"]);