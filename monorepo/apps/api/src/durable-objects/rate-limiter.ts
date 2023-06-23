import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { Bindings } from "../bindings";

export class RateLimiter {
  state: DurableObjectState;
  app: Hono<{ Bindings: Bindings }>;
  config = {
    generation: {
      type: "exclusive",
      locked: false,
    },
  };

  constructor(state: DurableObjectState) {
    this.state = state;

    const app = new Hono<{ Bindings: Bindings }>();

    // app.all("/*", async (c) => {
    //   console.log("KKKKKKKKK");
    //   console.log(c.req.path);
    //   return c.text("Hello Hono!");
    // });

    app.post("/generation", async (c) => {
      const locked = this.config.generation.locked;

      console.log(JSON.stringify(this.config, null, 2));

      if (locked) {
        throw new HTTPException(429, { message: "Too many requests" });
      } else {
        this.config.generation.locked = true;
        return c.text("Hello Hono!");
      }
    });

    app.post("/generation/unlock", async (c) => {
      this.config.generation.locked = false;
      return c.text("Hello Hono!");
    });

    this.app = app;
  }

  async fetch(request: Request) {
    console.log("KSDNFSKDJNFSKJDNFJKS");
    console.log(request.url, request.method);
    return this.app.fetch(request);
  }
}
