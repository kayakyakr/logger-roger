import child_process from "child_process";
import path from "path";
import express from "express";
import compression from "compression";
import morgan from "morgan";
import { createRequestHandler } from "@remix-run/express";
import net from "net";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      SESSION_SECRET: string;
      HASURA_URL: string;
      HASURA_ADMIN_SECRET: string;
      PORT?: string;
    }
  }
}

// It's important that node timezone is the same as the db timezone. Otherwise timestamps will differ.
// And problems will follow.
process.env.TZ = "UTC";

const app = express();
const defSecret = "keyboardcat";

process.env.SESSION_SECRET = process.env.SESSION_SECRET || defSecret;
process.env.HASURA_URL =
  process.env.HASURA_URL || "http://localhost:8080/v1/graphql";
process.env.HASURA_ADMIN_SECRET = process.env.HASURA_ADMIN_SECRET || "hunter1";

if (process.env.SESSION_SECRET === defSecret) {
  console.error(`
⚠️  ⚠️  ⚠️

Using default session secret.

Did you forget to provide it?

⚠️  ⚠️  ⚠️`);
}

app.use((req, res, next) => {
  // helpful headers:
  res.set("x-fly-region", process.env.FLY_REGION ?? "unknown");
  res.set("Strict-Transport-Security", `max-age=${60 * 60 * 24 * 365 * 100}`);

  // /clean-urls/ -> /clean-urls
  if (req.path.endsWith("/") && req.path.length > 1) {
    const query = req.url.slice(req.path.length);
    const safepath = req.path.slice(0, -1).replace(/\/+/g, "/");
    res.redirect(301, safepath + query);
    return;
  }
  next();
});

// if we're not in the primary region, then we need to make sure all
// non-GET/HEAD/OPTIONS requests hit the primary region rather than read-only
// Postgres DBs.
// learn more: https://fly.io/docs/getting-started/multi-region-databases/#replay-the-request
app.all("*", function getReplayResponse(req, res, next) {
  const { method, path: pathname } = req;
  const { PRIMARY_REGION, FLY_REGION } = process.env;

  const isMethodReplayable = !["GET", "OPTIONS", "HEAD"].includes(method);
  const isReadOnlyRegion =
    FLY_REGION && PRIMARY_REGION && FLY_REGION !== PRIMARY_REGION;

  const shouldReplay = isMethodReplayable && isReadOnlyRegion;

  if (!shouldReplay) return next();

  const logInfo = {
    pathname,
    method,
    PRIMARY_REGION,
    FLY_REGION,
  };
  console.info(`Replaying:`, logInfo);
  res.set("fly-replay", `region=${PRIMARY_REGION}`);
  return res.sendStatus(409);
});

app.use(compression());

// http://expressjs.com/en/advanced/best-practice-security.html#at-a-minimum-disable-x-powered-by-header
app.disable("x-powered-by");

// Remix fingerprints its assets so we can cache forever.
app.use(
  "/build",
  express.static("public/build", { immutable: true, maxAge: "1y" })
);

// Everything else (like favicon.ico) is cached for an hour. You may want to be
// more aggressive with this caching.
app.use(express.static("public", { maxAge: "1h" }));

app.use(morgan("tiny"));

const MODE = process.env.NODE_ENV;
const BUILD_DIR = path.join(process.cwd(), "build");

app.all(
  "*",
  MODE === "production"
    ? createRequestHandler({ build: require(BUILD_DIR) })
    : (...args) => {
        purgeRequireCache();
        const requestHandler = createRequestHandler({
          build: require(BUILD_DIR),
          mode: MODE,
        });
        return requestHandler(...args);
      }
);

const port = process.env.PORT || 3000;

const loggeratorUp = () => {
  return new Promise((resolve) => {
    const client = net.connect(8080, "localhost", () => {
      console.log("Connected");
      resolve(true);
    });
    client.on("error", (err) => {
      console.log(err);
      resolve(false);
    });
  });
};

(async () => {
  // spawn curl to see if loggerator exists
  while (!(await loggeratorUp())) {
    console.log("Waiting for loggerator");
    await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }

  console.log("Loggerator started");
  // if we get a response that we like launch the server
  app.listen(port, () => {
    // require the built app so we're ready when the first request comes in
    require(BUILD_DIR);
    console.log(`✅ app ready: http://localhost:${port}`);
  });
})();

function purgeRequireCache() {
  // purge require cache on requests for "server side HMR" this won't let
  // you have in-memory objects between requests in development,
  // alternatively you can set up nodemon/pm2-dev to restart the server on
  // file changes, we prefer the DX of this though, so we've included it
  // for you by default
  for (const key in require.cache) {
    if (key.startsWith(BUILD_DIR)) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete require.cache[key];
    }
  }
}
