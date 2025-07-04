# Hono Routing Architecture - Finance SaaS Platform

## Overview
The routing system is built with **Hono.js**, providing fast, type-safe API routes that run on the Edge Runtime. This architecture ensures excellent performance, type safety, and developer experience.

## 🏗️ Routing Architecture

### Core Concepts
- **Edge Runtime**: Serverless execution environment
- **Type Safety**: End-to-end TypeScript types
- **Middleware System**: Authentication, validation, error handling
- **Catch-all Routes**: Single API entry point
- **Client Generation**: Auto-generated type-safe client

## 🛣️ Route Structure

### Main Router Configuration
```typescript
// app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";

// Import route modules
import accounts from "./accounts";
import categories from "./categories";
import summary from "./summary";
import transactions from "./transactions";

export const runtime = "edge";

// Create base app with API prefix
const app = new Hono().basePath("/api");

// Register route modules
const routes = app
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/summary", summary)
  .route("/transactions", transactions);

// Export HTTP methods for Next.js
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

// Export types for client generation
export type AppType = typeof routes;
```

### Route Modules

#### Accounts Router
```typescript
// app/api/[[...route]]/accounts.ts
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/src/db/drizzle";
import { accounts, insertAccountSchema } from "@/src/db/schema";

const app = new Hono()
  // GET /api/accounts - List user accounts
  .get("/", clerkMiddleware(), async (c) => {
    const auth = getAuth(c);
    
    if (!auth?.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const data = await db
      .select({
        id: accounts.id,
        name: accounts.name,
      })
      .from(accounts)
      .where(eq(accounts.userId, auth.userId));

    return c.json({ data });
  })
  
  // POST /api/accounts - Create new account
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertAccountSchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const [data] = await db
        .insert(accounts)
        .values({
          id: createId(),
          userId: auth.userId,
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  )
  
  // GET /api/accounts/:id - Get specific account
  .get(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .select({
          id: accounts.id,
          name: accounts.name,
        })
        .from(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)));

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  
  // PATCH /api/accounts/:id - Update account
  .patch(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    zValidator("json", insertAccountSchema.pick({ name: true })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .update(accounts)
        .set(values)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  
  // DELETE /api/accounts/:id - Delete account
  .delete(
    "/:id",
    clerkMiddleware(),
    zValidator("param", z.object({ id: z.string().optional() })),
    async (c) => {
      const auth = getAuth(c);
      const { id } = c.req.valid("param");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      if (!id) {
        return c.json({ error: "Missing id" }, 400);
      }

      const [data] = await db
        .delete(accounts)
        .where(and(eq(accounts.userId, auth.userId), eq(accounts.id, id)))
        .returning();

      if (!data) {
        return c.json({ error: "Not found" }, 404);
      }

      return c.json({ data });
    }
  )
  
  // DELETE /api/accounts/bulk-delete - Bulk delete accounts
  .delete(
    "/bulk-delete",
    clerkMiddleware(),
    zValidator("json", z.object({ ids: z.array(z.string()) })),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const data = await db
        .delete(accounts)
        .where(
          and(
            eq(accounts.userId, auth.userId),
            inArray(accounts.id, values.ids)
          )
        )
        .returning({ id: accounts.id });

      return c.json({ data });
    }
  );

export default app;
```

#### Transactions Router
```typescript
// app/api/[[...route]]/transactions.ts
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { parse, subDays } from "date-fns";
import { z } from "zod";

const app = new Hono()
  // GET /api/transactions - List transactions with filtering
  .get(
    "/",
    clerkMiddleware(),
    zValidator("query", z.object({
      from: z.string().optional(),
      to: z.string().optional(),
      accountId: z.string().optional(),
    })),
    async (c) => {
      const auth = getAuth(c);
      const { from, to, accountId } = c.req.valid("query");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Date range handling
      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30);

      const startDate = from 
        ? parse(from, "yyyy-MM-dd", new Date()) 
        : defaultFrom;
      const endDate = to 
        ? parse(to, "yyyy-MM-dd", new Date()) 
        : defaultTo;

      const data = await db
        .select({
          id: transactions.id,
          date: transactions.date,
          category: categories.name,
          categoryId: transactions.categoryId,
          payee: transactions.payee,
          amount: transactions.amount,
          notes: transactions.notes,
          account: accounts.name,
          accountId: transactions.accountId,
        })
        .from(transactions)
        .innerJoin(accounts, eq(transactions.accountId, accounts.id))
        .leftJoin(categories, eq(transactions.categoryId, categories.id))
        .where(
          and(
            accountId ? eq(transactions.accountId, accountId) : undefined,
            eq(accounts.userId, auth.userId),
            gte(transactions.date, startDate),
            lte(transactions.date, endDate),
          ),
        )
        .orderBy(desc(transactions.date));

      return c.json({ data });
    }
  )
  
  // POST /api/transactions - Create transaction
  .post(
    "/",
    clerkMiddleware(),
    zValidator("json", insertTransactionSchema.omit({ id: true })),
    async (c) => {
      const auth = getAuth(c);
      const values = c.req.valid("json");

      if (!auth?.userId) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      // Verify account belongs to user
      const [account] = await db
        .select()
        .from(accounts)
        .where(
          and(
            eq(accounts.userId, auth.userId),
            eq(accounts.id, values.accountId)
          )
        );

      if (!account) {
        return c.json({ error: "Invalid account" }, 400);
      }

      const [data] = await db
        .insert(transactions)
        .values({
          id: createId(),
          ...values,
        })
        .returning();

      return c.json({ data });
    }
  );

export default app;
```

## 🔧 Middleware System

### Authentication Middleware
```typescript
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";

// Apply to all routes
app.use("*", clerkMiddleware());

// Get user in route handler
const auth = getAuth(c);
if (!auth?.userId) {
  return c.json({ error: "Unauthorized" }, 401);
}
```

### Validation Middleware
```typescript
import { zValidator } from "@hono/zod-validator";

// Body validation
.post(
  "/",
  zValidator("json", schema),
  async (c) => {
    const values = c.req.valid("json"); // Fully typed!
  }
)

// Query parameter validation
.get(
  "/",
  zValidator("query", z.object({
    page: z.string().optional(),
    limit: z.string().optional(),
  })),
  async (c) => {
    const { page, limit } = c.req.valid("query");
  }
)

// Path parameter validation
.get(
  "/:id",
  zValidator("param", z.object({
    id: z.string().min(1),
  })),
  async (c) => {
    const { id } = c.req.valid("param");
  }
)
```

### Error Handling Middleware
```typescript
// Global error handler
app.onError((err, c) => {
  console.error('API Error:', err);
  
  if (err instanceof ZodError) {
    return c.json({
      error: "Validation failed",
      details: err.errors,
    }, 400);
  }

  if (err.message.includes('Unauthorized')) {
    return c.json({
      error: "Unauthorized access",
    }, 401);
  }

  return c.json({
    error: "Internal server error",
  }, 500);
});

// Not found handler
app.notFound((c) => {
  return c.json({
    error: "Route not found",
  }, 404);
});
```

## 🔗 Type-Safe Client

### Client Generation
```typescript
// lib/hono.ts
import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);
```

### Client Usage
```typescript
// In React components
import { client } from "@/lib/hono";

// GET request
const { data: accounts } = await client.api.accounts.$get();

// POST request
const newAccount = await client.api.accounts.$post({
  json: { name: "New Account" }
});

// PATCH request
const updatedAccount = await client.api.accounts[":id"].$patch({
  param: { id: accountId },
  json: { name: "Updated Name" }
});

// DELETE request
await client.api.accounts[":id"].$delete({
  param: { id: accountId }
});
```

### React Query Integration
```typescript
// hooks/use-get-accounts.ts
import { useQuery } from "@tanstack/react-query";
import { client } from "@/lib/hono";

export const useGetAccounts = () => {
  const query = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const response = await client.api.accounts.$get();
      
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }

      const { data } = await response.json();
      return data;
    },
  });

  return query;
};
```

## 🔍 Route Patterns

### RESTful Resource Routes
```typescript
const app = new Hono()
  .get("/", listHandler)           // GET /api/resource
  .post("/", createHandler)        // POST /api/resource
  .get("/:id", getHandler)         // GET /api/resource/:id
  .patch("/:id", updateHandler)    // PATCH /api/resource/:id
  .delete("/:id", deleteHandler);  // DELETE /api/resource/:id
```

### Bulk Operations
```typescript
.delete(
  "/bulk-delete",
  zValidator("json", z.object({
    ids: z.array(z.string())
  })),
  async (c) => {
    const { ids } = c.req.valid("json");
    // Bulk delete logic
  }
)

.patch(
  "/bulk-update",
  zValidator("json", z.object({
    ids: z.array(z.string()),
    updates: z.object({...})
  })),
  async (c) => {
    // Bulk update logic
  }
)
```

### Nested Resources
```typescript
// Transactions for specific account
.get(
  "/accounts/:accountId/transactions",
  async (c) => {
    const accountId = c.req.param("accountId");
    // Get transactions for account
  }
)

// Categories with transaction counts
.get(
  "/categories/with-counts",
  async (c) => {
    // Complex aggregation query
  }
)
```

## 📊 Advanced Routing Features

### Query Parameters
```typescript
.get(
  "/",
  zValidator("query", z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().optional(),
    sortBy: z.enum(["date", "amount", "payee"]).default("date"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    from: z.string().optional(),
    to: z.string().optional(),
  })),
  async (c) => {
    const {
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      from,
      to
    } = c.req.valid("query");

    // Implement pagination, filtering, sorting
    const offset = (page - 1) * limit;
    
    const data = await db
      .select()
      .from(transactions)
      .where(
        and(
          search ? sql`payee ILIKE ${'%' + search + '%'}` : undefined,
          from ? gte(transactions.date, new Date(from)) : undefined,
          to ? lte(transactions.date, new Date(to)) : undefined,
        )
      )
      .orderBy(
        sortOrder === "asc" 
          ? asc(transactions[sortBy])
          : desc(transactions[sortBy])
      )
      .limit(limit)
      .offset(offset);

    return c.json({ data, page, limit, total: data.length });
  }
)
```

### File Upload Handling
```typescript
.post(
  "/upload",
  async (c) => {
    const body = await c.req.parseBody();
    const file = body['file'] as File;

    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }

    // Process file (CSV import, etc.)
    const text = await file.text();
    const rows = parseCSV(text);
    
    // Validate and import data
    const results = await processImportData(rows);

    return c.json({ data: results });
  }
)
```

### Conditional Routes
```typescript
// Development-only routes
if (process.env.NODE_ENV === "development") {
  app.get("/debug/database", async (c) => {
    const stats = await getDatabaseStats();
    return c.json(stats);
  });
}

// Admin-only routes
.get(
  "/admin/users",
  clerkMiddleware(),
  async (c) => {
    const auth = getAuth(c);
    
    // Check if user is admin
    if (!auth?.sessionClaims?.metadata?.role === "admin") {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Admin functionality
  }
)
```

## 🚀 Performance Optimization

### Response Caching
```typescript
.get("/", async (c) => {
  // Set cache headers
  c.header("Cache-Control", "public, max-age=300"); // 5 minutes
  
  const data = await expensiveQuery();
  return c.json({ data });
})
```

### Streaming Responses
```typescript
.get("/export", async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      // Stream large dataset
      streamLargeDataset(controller);
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": "attachment; filename=export.json"
    }
  });
})
```

### Request Deduplication
```typescript
const requestCache = new Map();

.get("/:id", async (c) => {
  const id = c.req.param("id");
  const cacheKey = `account:${id}`;

  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  const promise = getAccountById(id);
  requestCache.set(cacheKey, promise);

  // Clear cache after 1 minute
  setTimeout(() => {
    requestCache.delete(cacheKey);
  }, 60000);

  return promise;
})
```

## 🧪 Testing Routes

### Unit Testing
```typescript
// tests/routes/accounts.test.ts
import { testClient } from 'hono/testing';
import app from '@/app/api/[[...route]]/accounts';

describe('Accounts API', () => {
  test('GET /accounts returns user accounts', async () => {
    const res = await testClient(app).api.accounts.$get();
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.data).toBeInstanceOf(Array);
  });

  test('POST /accounts creates new account', async () => {
    const res = await testClient(app).api.accounts.$post({
      json: { name: "Test Account" }
    });
    
    expect(res.status).toBe(200);
    
    const data = await res.json();
    expect(data.data.name).toBe("Test Account");
  });
});
```

### Integration Testing
```typescript
// tests/integration/api.test.ts
describe('API Integration', () => {
  test('complete transaction flow', async () => {
    // Create account
    const account = await client.api.accounts.$post({
      json: { name: "Test Account" }
    });

    // Create category
    const category = await client.api.categories.$post({
      json: { name: "Test Category" }
    });

    // Create transaction
    const transaction = await client.api.transactions.$post({
      json: {
        amount: -1000,
        date: new Date(),
        payee: "Test Payee",
        accountId: account.data.id,
        categoryId: category.data.id,
      }
    });

    expect(transaction.status).toBe(200);
  });
});
```

## 📚 Additional Resources

- [Hono.js Documentation](https://hono.dev/)
- [Hono Routing Guide](https://hono.dev/api/routing)
- [Hono Middleware](https://hono.dev/middleware/builtin/basic-auth)
- [TypeScript Client](https://hono.dev/guides/rpc)
- [Edge Runtime](https://edge-runtime.vercel.app/)
