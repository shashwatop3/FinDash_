import { clerkMiddleware } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

import { db } from "@/src/db/drizzle";
import { categories, insertCategorySchema } from "@/src/db/schema";

const app = new Hono()
  .get("/", clerkMiddleware(), async (ctx) => {
    const user = auth();

    if (!user?.userId) {
      return ctx.json({ error: "Unauthorized." }, 401);
    }

    const data = await db
      .select({
        id: categories.id,
        name: categories.name,
      })
      .from(categories)
      .where(eq(categories.userId, user.userId));

    return ctx.json({ data });
  })
  .get(
    "/:id",
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    clerkMiddleware(),
    async (ctx) => {
      const user = auth();
      const { id } = ctx.req.valid("param");

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!user?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .select({
          id: categories.id,
          name: categories.name,
        })
        .from(categories)
        .where(and(eq(categories.userId, user.userId), eq(categories.id, id)));

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  )
  .post(
    "/",
    clerkMiddleware(),
    zValidator(
      "json",
      insertCategorySchema.pick({
        name: true,
      })
    ),
    async (ctx) => {
      const user = auth();
      const values = ctx.req.valid("json");

      if (!user?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .insert(categories)
        .values({
          id: createId(),
          userId: user.userId,
          ...values,
        })
        .returning();

      return ctx.json({ data });
    }
  )
  .post(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator(
      "json",
      z.object({
        ids: z.array(z.string()),
      })
    ),
    async (ctx) => {
      const user = auth();
      const values = ctx.req.valid("json");

      if (!user?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const data = await db
        .delete(categories)
        .where(
          and(
            eq(categories.userId, user.userId),
            inArray(categories.id, values.ids)
          )
        )
        .returning({
          id: categories.id,
        });

      return ctx.json({ data });
    }
  )
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    zValidator(
      "json",
      insertCategorySchema.pick({
        name: true,
      })
    ),
    async (ctx) => {
      const user = auth();
      const { id } = ctx.req.valid("param");
      const values = ctx.req.valid("json");

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!user?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .update(categories)
        .set(values)
        .where(and(eq(categories.userId, user.userId), eq(categories.id, id)))
        .returning();

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  )
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator(
      "param",
      z.object({
        id: z.string().optional(),
      })
    ),
    async (ctx) => {
      const user = auth();
      const { id } = ctx.req.valid("param");

      if (!id) {
        return ctx.json({ error: "Missing id." }, 400);
      }

      if (!user?.userId) {
        return ctx.json({ error: "Unauthorized." }, 401);
      }

      const [data] = await db
        .delete(categories)
        .where(and(eq(categories.userId, user.userId), eq(categories.id, id)))
        .returning({
          id: categories.id,
        });

      if (!data) {
        return ctx.json({ error: "Not found." }, 404);
      }

      return ctx.json({ data });
    }
  );

export default app;
