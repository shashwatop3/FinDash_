import { Hono } from "hono";
import { handle } from "hono/vercel";
import { cors } from "hono/cors";

import accounts from "./accounts";
import categories from "./categories";
import summary from "./summary";
import transactions from "./transactions";

export const runtime = "edge";

const app = new Hono().basePath("/api");

app.use("*", cors({
  origin: (origin) => {
    const allowedOrigins = [
      "http://localhost:3000",
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean) as string[];

    const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
    if (vercelUrl) {
      allowedOrigins.push(vercelUrl);
    }

    if (allowedOrigins.includes(origin)) {
      return origin;
    }
    
    return undefined;
  },
  credentials: true,
  allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

const routes = app
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/summary", summary)
  .route("/transactions", transactions);

export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
