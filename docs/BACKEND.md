# Backend Architecture - Finance SaaS Platform

## Overview
The backend is built with **Hono.js**, a lightweight, fast web framework running on the Edge Runtime, providing type-safe API routes with excellent performance and developer experience.

## 🏗️ Architecture

### Core Technologies
- **Hono.js** - Fast, lightweight web framework
- **Edge Runtime** - Serverless execution environment
- **TypeScript** - Full type safety across the stack
- **Zod** - Runtime type validation
- **Clerk** - Authentication and user management
- **Drizzle ORM** - Type-safe database queries

### Project Structure
```
app/api/[[...route]]/         # Hono API routes
├── route.ts                  # Main API router
├── accounts.ts               # Account management
├── categories.ts             # Category management
├── summary.ts                # Financial summary
└── transactions.ts           # Transaction handling

features/*/api/               # Feature-specific API logic
├── accounts/api/
├── categories/api/
├── summary/api/
└── transactions/api/

lib/
├── hono.ts                   # Hono client configuration
└── utils.ts                  # Utility functions
```

## 🔧 Hono.js Configuration

### Main Router Setup
```typescript
// app/api/[[...route]]/route.ts
import { Hono } from "hono";
import { handle } from "hono/vercel";

export const runtime = "edge";

const app = new Hono().basePath("/api");

const routes = app
  .route("/accounts", accounts)
  .route("/categories", categories)
  .route("/summary", summary)
  .route("/transactions", transactions);

// Export HTTP methods
export const GET = handle(app);
export const POST = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);

export type AppType = typeof routes;
```

### Type-Safe Client
```typescript
// lib/hono.ts
import { hc } from "hono/client";
import { AppType } from "@/app/api/[[...route]]/route";

export const client = hc<AppType>(process.env.NEXT_PUBLIC_APP_URL!);
```

## 🛣️ API Routes

### Account Management
```typescript
// app/api/[[...route]]/accounts.ts
import { Hono } from "hono";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono()
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
  );

export default app;
```

### Transaction Management
```typescript
// app/api/[[...route]]/transactions.ts
const app = new Hono()
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

      const defaultTo = new Date();
      const defaultFrom = subDays(defaultTo, 30);

      const startDate = from ? parse(from, "yyyy-MM-dd", new Date()) : defaultFrom;
      const endDate = to ? parse(to, "yyyy-MM-dd", new Date()) : defaultTo;

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
  );
```

## 🔐 Authentication & Authorization

### Clerk Integration
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

### User Context
- Automatic user ID extraction
- Role-based access control
- Session validation
- Token refresh handling

## ✅ Validation & Type Safety

### Zod Schema Validation
```typescript
import { zValidator } from "@hono/zod-validator";
import { insertTransactionSchema } from "@/db/schema";

app.post(
  "/",
  zValidator("json", insertTransactionSchema),
  async (c) => {
    const values = c.req.valid("json"); // Fully typed!
    // Handle validated data
  }
);
```

### Runtime Type Checking
- Request body validation
- Query parameter validation
- Response type safety
- Error handling with proper types

## 🗄️ Database Integration

### Drizzle ORM Queries
```typescript
import { db } from "@/db/drizzle";
import { accounts, transactions, categories } from "@/db/schema";
import { eq, desc, gte, lte, and } from "drizzle-orm";

// Complex query with joins
const data = await db
  .select({
    id: transactions.id,
    amount: transactions.amount,
    account: accounts.name,
    category: categories.name,
  })
  .from(transactions)
  .innerJoin(accounts, eq(transactions.accountId, accounts.id))
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(
    and(
      eq(accounts.userId, userId),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    )
  )
  .orderBy(desc(transactions.date));
```

### Transaction Handling
```typescript
// Database transactions for data consistency
await db.transaction(async (tx) => {
  await tx.delete(transactions)
    .where(eq(transactions.accountId, accountId));
  
  await tx.delete(accounts)
    .where(eq(accounts.id, accountId));
});
```

## 📊 Business Logic

### Financial Calculations
```typescript
// Summary calculations
const calculatePeriodSummary = async (userId: string, from: Date, to: Date) => {
  const transactions = await db
    .select()
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(
      and(
        eq(accounts.userId, userId),
        gte(transactions.date, from),
        lte(transactions.date, to)
      )
    );

  const income = transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  return {
    income,
    expenses,
    remaining: income - expenses,
  };
};
```

### Data Aggregation
```typescript
// Category spending analysis
const getCategorySpending = async (userId: string) => {
  const result = await db
    .select({
      category: categories.name,
      total: sql<number>`SUM(${transactions.amount})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(accounts.userId, userId))
    .groupBy(categories.name);

  return result;
};
```

## 🚀 Performance Optimization

### Edge Runtime Benefits
- **Global Distribution**: Runs close to users
- **Fast Cold Starts**: Minimal startup time
- **Auto Scaling**: Handles traffic spikes
- **Cost Effective**: Pay per request

### Query Optimization
```typescript
// Efficient data fetching with proper indexing
const getTransactionsSummary = async (userId: string) => {
  // Single query instead of multiple round trips
  const [summary] = await db
    .select({
      totalTransactions: sql<number>`COUNT(*)`,
      totalIncome: sql<number>`SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)`,
      totalExpenses: sql<number>`SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END)`,
    })
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(accounts.userId, userId));

  return summary;
};
```

### Caching Strategy
- Browser caching with proper headers
- CDN caching for static responses
- In-memory caching for computed data
- Database query optimization

## 🔄 Data Flow

### Request Lifecycle
1. **Request received** by Hono router
2. **Authentication** via Clerk middleware
3. **Validation** with Zod schemas
4. **Database query** with Drizzle ORM
5. **Business logic** processing
6. **Response formatting** and return

### Error Handling
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

  return c.json({
    error: "Internal server error",
  }, 500);
});
```

## 📡 API Design

### RESTful Endpoints
```
GET    /api/accounts              # List accounts
POST   /api/accounts              # Create account
GET    /api/accounts/:id          # Get account
PATCH  /api/accounts/:id          # Update account
DELETE /api/accounts/:id          # Delete account

GET    /api/transactions          # List transactions
POST   /api/transactions          # Create transaction
PATCH  /api/transactions/:id      # Update transaction
DELETE /api/transactions/:id      # Delete transaction

GET    /api/summary               # Financial summary
```

### Response Format
```typescript
// Success response
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20
  }
}

// Error response
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {...}
}
```

## 🔧 Environment Configuration

### Environment Variables
```bash
# Database
DATABASE_URL=postgresql://...

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Runtime Configuration
```typescript
// Validate environment variables
const env = z.object({
  DATABASE_URL: z.string().url(),
  CLERK_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_APP_URL: z.string().url(),
}).parse(process.env);
```

## 🧪 Testing

### API Testing
```typescript
// Example test with Hono
import { testClient } from 'hono/testing';
import app from './route';

test('GET /accounts returns user accounts', async () => {
  const res = await testClient(app).accounts.$get();
  expect(res.status).toBe(200);
  
  const data = await res.json();
  expect(data.data).toBeInstanceOf(Array);
});
```

### Integration Testing
- Database transaction rollback
- Mock authentication
- API endpoint testing
- Error scenario testing

## 📚 Additional Resources

- [Hono.js Documentation](https://hono.dev/)
- [Clerk Authentication](https://clerk.com/docs)
- [Zod Validation](https://zod.dev/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Edge Runtime](https://edge-runtime.vercel.app/)
