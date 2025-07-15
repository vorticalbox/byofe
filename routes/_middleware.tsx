import * as z from "zod";
import { define } from "$utils";

export default define.middleware(async (ctx) => {
  try {
    const resp = await ctx.next();
    return resp;
  } catch (error) {
    if (ctx.config.mode === "development") {
      console.error(error);
    }
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify(error.issues), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }
  return new Response(JSON.stringify({ error: "Internal Server Error" }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
});
