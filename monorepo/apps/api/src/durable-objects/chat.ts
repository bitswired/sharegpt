import { Hono } from "hono";
import { Bindings } from "../bindings";

async function handleErrors(request: Request, func: () => Promise<any>) {
  try {
    const res = await func();
    console.log(res.status);
    console.log(res.statusText);
    return res;
  } catch (err: any) {
    console.log(err);
    if (request.headers.get("Upgrade") == "websocket") {
      // Annoyingly, if we return an HTTP error in response to a WebSocket request, Chrome devtools
      // won't show us the response body! So... let's send a WebSocket response with an error
      // frame instead.
      let pair = new WebSocketPair();
      pair[1].accept();
      pair[1].send(JSON.stringify({ error: err.stack }));
      pair[1].close(1011, "Uncaught exception during session setup");
      return new Response(null, { status: 101, webSocket: pair[0] });
    } else {
      return new Response(err.stack, { status: 500 });
    }
  }
}

export class ChatRoom {
  state: DurableObjectState;
  sessions: {
    name: string;
    webSocket: WebSocket;
    blockedMessages: string[];
    quit: boolean;
  }[];
  lastTimestamp: number;
  app = new Hono<{ Bindings: Bindings }>();
  ownerName: string = "";
  ownerJoined: boolean = false;

  constructor(state: DurableObjectState) {
    this.state = state;

    // // `env` is our environment bindings (discussed earlier).
    // this.env = env;

    // We will put the WebSocket objects for each client, along with some metadata, into
    // `sessions`.
    this.sessions = [];

    // We keep track of the last-seen message's timestamp just so that we can assign monotonically
    // increasing timestamps even if multiple messages arrive simultaneously (see below). There's
    // no need to store this to disk since we assume if the object is destroyed and recreated, much
    // more than a millisecond will have gone by.
    this.lastTimestamp = 0;
  }

  // The system will call fetch() whenever an HTTP request is sent to this Object. Such requests
  // can only be sent from other Worker code, such as the code above; these requests don't come
  // directly from the internet. In the future, we will support other formats than HTTP for these
  // communications, but we started with HTTP for its familiarity.
  async fetch(request: Request) {
    return await handleErrors(request, async () => {
      let url = new URL(request.url);

      switch (url.pathname) {
        case "/create": {
          const x: any = await request.json();
          this.ownerName = x.ownerName;
          return new Response(null, { status: 200 });
        }
        case "/websocket": {
          const name = url.searchParams.get("name");
          if (!name) {
            throw new Error("Name is required");
          }

          if (!this.ownerJoined && this.ownerName !== name) {
            throw new Error("Only the owner can join first");
          }

          // The request is to `/api/room/<name>/websocket`. A client is trying to establish a new
          // WebSocket session.
          if (request.headers.get("Upgrade") != "websocket") {
            return new Response("expected websocket", { status: 400 });
          }

          // Get the client's IP address for use with the rate limiter.
          let ip = request.headers.get("CF-Connecting-IP");

          // To accept the WebSocket request, we create a WebSocketPair (which is like a socketpair,
          // i.e. two WebSockets that talk to each other), we return one end of the pair in the
          // response, and we operate on the other end. Note that this API is not part of the
          // Fetch API standard; unfortunately, the Fetch API / Service Workers specs do not define
          // any way to act as a WebSocket server today.
          let pair = new WebSocketPair();

          // We're going to take pair[1] as our end, and return pair[0] to the client.
          await this.handleSession(pair[1], ip, name);

          // Now we return the other end of the pair to the client.
          return new Response(null, { status: 101, webSocket: pair[0] });
        }

        default:
          return new Response("Not found", { status: 404 });
      }
    });
  }

  // handleSession() implements our WebSocket-based chat protocol.
  async handleSession(webSocket: WebSocket, ip: string, name: string) {
    // Accept our end of the WebSocket. This tells the runtime that we'll be terminating the
    // WebSocket in JavaScript, not sending it elsewhere.

    webSocket.accept();
    console.log("DSFSDFSD", name, this.ownerName);
    if (name === this.ownerName) {
      this.ownerJoined = true;
      console.log("YEAHH");
    }

    // Set up our rate limiter client.
    // let limiterId = this.env.limiters.idFromName(ip);
    // let limiter = new RateLimiterClient(
    //   () => this.env.limiters.get(limiterId),
    //   (err) => webSocket.close(1011, err.stack)
    // );

    // Create our session and add it to the sessions list.
    // We don't send any messages to the client until it has sent us the initial user info
    // message. Until then, we will queue messages in `session.blockedMessages`.
    let session = {
      name,
      webSocket,
      blockedMessages: [] as string[],
      quit: false,
    };
    this.sessions.push(session);

    // Queue "join" messages for all online users, to populate the client's roster.
    this.sessions.forEach((otherSession) => {
      if (otherSession.name) {
        session.blockedMessages.push(
          JSON.stringify({ joined: otherSession.name })
        );
      }
    });

    // Load the last 100 messages from the chat history stored on disk, and send them to the
    // client.
    let storage = await this.state.storage.list({ reverse: true, limit: 100 });
    let backlog = [...storage.values()];
    backlog.reverse();
    backlog.forEach((value) => {
      session.blockedMessages.push(value);
    });

    // Send the queued messages to the client and join messages to other clients.
    session.blockedMessages.forEach((queued) => {
      webSocket.send(queued);
    });
    delete session.blockedMessages;
    this.broadcast({ joined: session.name });

    // Set event handlers to receive messages.
    let receivedUserInfo = false;
    webSocket.addEventListener("message", async (msg) => {
      try {
        if (session.quit) {
          // Whoops, when trying to send to this WebSocket in the past, it threw an exception and
          // we marked it broken. But somehow we got another message? I guess try sending a
          // close(), which might throw, in which case we'll try to send an error, which will also
          // throw, and whatever, at least we won't accept the message. (This probably can't
          // actually happen. This is defensive coding.)
          webSocket.close(1011, "WebSocket broken.");
          // Remove session
          this.sessions = this.sessions.filter((s) => s.name !== session.name);
          return;
        }

        // Check if the user is over their rate limit and reject the message if so.
        // if (!limiter.checkLimit()) {
        //   webSocket.send(
        //     JSON.stringify({
        //       error: "Your IP is being rate-limited, please try again later.",
        //     })
        //   );
        //   return;
        // }

        // I guess we'll use JSON.
        let data = JSON.parse(msg.data);

        // Construct sanitized message for storage and broadcast.
        data = { name: session.name, message: data.message };

        // Block people from sending overly long messages. This is also enforced on the client,
        // so to trigger this the user must be bypassing the client code.
        // if (data.message.length > 256) {
        //   webSocket.send(JSON.stringify({ error: "Message too long." }));
        //   return;
        // }

        // Add timestamp. Here's where this.lastTimestamp comes in -- if we receive a bunch of
        // messages at the same time (or if the clock somehow goes backwards????), we'll assign
        // them sequential timestamps, so at least the ordering is maintained.
        data.timestamp = Math.max(Date.now(), this.lastTimestamp + 1);
        this.lastTimestamp = data.timestamp;

        // Broadcast the message to all other WebSockets.
        let dataStr = JSON.stringify(data);
        this.broadcast(dataStr);

        // Save message.
        let key = new Date(data.timestamp).toISOString();
        await this.state.storage.put(key, dataStr);
      } catch (err) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({ error: err.stack }));
      }
    });

    // On "close" and "error" events, remove the WebSocket from the sessions list and broadcast
    // a quit message.
    let closeOrErrorHandler = (evt) => {
      if (session.name === this.ownerName) {
        this.ownerJoined = false;
        this.broadcast({ quit: session.name });
        this.broadcast({ end: true });
        this.sessions = [];
      } else {
        session.quit = true;
        this.sessions = this.sessions.filter((member) => member !== session);
        if (session.name) {
          this.broadcast({ quit: session.name });
        }
      }
    };
    webSocket.addEventListener("close", closeOrErrorHandler);
    webSocket.addEventListener("error", closeOrErrorHandler);
  }

  // broadcast() broadcasts a message to all clients.
  broadcast(message: any) {
    // Apply JSON if we weren't given a string to start with.
    if (typeof message !== "string") {
      message = JSON.stringify(message);
    }

    // Iterate over all the sessions sending them messages.
    let quitters: typeof this.sessions = [];
    this.sessions = this.sessions.filter((session) => {
      try {
        session.webSocket.send(message);
        return true;
      } catch (err) {
        // Whoops, this connection is dead. Remove it from the list and arrange to notify
        // everyone below.
        session.quit = true;
        quitters.push(session);
        return false;
      }
    });

    quitters.forEach((quitter) => {
      if (quitter.name) {
        this.broadcast({ quit: quitter.name });
      }
    });
  }
}
