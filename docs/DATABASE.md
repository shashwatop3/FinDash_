# Database Architecture - Finance SaaS Platform

## Overview
The database layer uses **PostgreSQL** with **Drizzle ORM** for type-safe, performant database operations. The schema is designed for financial data management with proper relationships and constraints.

## 🗄️ Database Technologies

### Core Stack
- **PostgreSQL** - Primary database
- **Neon Database** - Serverless PostgreSQL provider
- **Drizzle ORM** - Type-safe SQL toolkit
- **Drizzle Kit** - Database management CLI
- **Zod** - Runtime schema validation

### Connection & Configuration
```typescript
// drizzle.config.ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "src/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

## 📊 Database Schema

### Core Tables

#### Accounts Table
```typescript
export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email'),
  userId: text('user_id').notNull(),
});
```

**Purpose**: Store user financial accounts (checking, savings, credit cards, etc.)

**Fields**:
- `id`: Unique identifier (CUID2)
- `name`: Account display name
- `email`: Associated email (optional)
- `userId`: Foreign key to user (from Clerk)

#### Categories Table
```typescript
export const categories = pgTable('category', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email'),
  userId: text('user_id').notNull(),
});
```

**Purpose**: Categorize transactions for reporting and budgeting

**Fields**:
- `id`: Unique identifier (CUID2)
- `name`: Category name (e.g., "Food", "Transportation")
- `email`: Associated email (optional)
- `userId`: Foreign key to user

#### Transactions Table
```typescript
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  amount: integer('ammount').notNull(),
  date: timestamp('date').notNull(),
  payee: text('payee').notNull(),
  notes: text('notes'),
  accountId: text('account_id').references(() => accounts.id, {
    onDelete: 'cascade',
  }).notNull(),
  categoryId: text('category_id').references(() => categories.id, {
    onDelete: "set null",
  })
});
```

**Purpose**: Store individual financial transactions

**Fields**:
- `id`: Unique identifier (CUID2)
- `amount`: Transaction amount in cents (integer for precision)
- `date`: Transaction date
- `payee`: Who the payment was to/from
- `notes`: Optional transaction notes
- `accountId`: Reference to account (CASCADE delete)
- `categoryId`: Reference to category (SET NULL on delete)

## 🔗 Relationships

### Table Relations
```typescript
// Account Relations
export const accountRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

// Category Relations
export const categoryRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

// Transaction Relations
export const transactionRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));
```

### Relationship Types
- **One-to-Many**: Account → Transactions
- **One-to-Many**: Category → Transactions
- **Many-to-One**: Transaction → Account
- **Many-to-One**: Transaction → Category (optional)

## 🔧 Database Operations

### Connection Setup
```typescript
// src/db/drizzle.ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Query Examples

#### Basic CRUD Operations
```typescript
// Create Account
const [newAccount] = await db
  .insert(accounts)
  .values({
    id: createId(),
    name: "Checking Account",
    userId: userId,
  })
  .returning();

// Read Accounts
const userAccounts = await db
  .select()
  .from(accounts)
  .where(eq(accounts.userId, userId));

// Update Account
await db
  .update(accounts)
  .set({ name: "New Account Name" })
  .where(eq(accounts.id, accountId));

// Delete Account (cascades to transactions)
await db
  .delete(accounts)
  .where(eq(accounts.id, accountId));
```

#### Complex Queries
```typescript
// Get transactions with account and category info
const transactionsWithDetails = await db
  .select({
    id: transactions.id,
    amount: transactions.amount,
    date: transactions.date,
    payee: transactions.payee,
    accountName: accounts.name,
    categoryName: categories.name,
  })
  .from(transactions)
  .innerJoin(accounts, eq(transactions.accountId, accounts.id))
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(eq(accounts.userId, userId))
  .orderBy(desc(transactions.date));

// Financial summary query
const summary = await db
  .select({
    totalIncome: sql<number>`SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END)`,
    totalExpenses: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`,
    transactionCount: sql<number>`COUNT(*)`,
  })
  .from(transactions)
  .innerJoin(accounts, eq(transactions.accountId, accounts.id))
  .where(
    and(
      eq(accounts.userId, userId),
      gte(transactions.date, startDate),
      lte(transactions.date, endDate)
    )
  );
```

#### Aggregation Queries
```typescript
// Category spending breakdown
const categorySpending = await db
  .select({
    categoryName: categories.name,
    totalSpent: sql<number>`SUM(ABS(${transactions.amount}))`,
    transactionCount: sql<number>`COUNT(*)`,
    averageAmount: sql<number>`AVG(ABS(${transactions.amount}))`,
  })
  .from(transactions)
  .innerJoin(accounts, eq(transactions.accountId, accounts.id))
  .leftJoin(categories, eq(transactions.categoryId, categories.id))
  .where(
    and(
      eq(accounts.userId, userId),
      lt(transactions.amount, 0) // Only expenses
    )
  )
  .groupBy(categories.name)
  .orderBy(desc(sql`SUM(ABS(${transactions.amount}))`));

// Monthly spending trends
const monthlyTrends = await db
  .select({
    month: sql<string>`DATE_TRUNC('month', ${transactions.date})`,
    totalIncome: sql<number>`SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END)`,
    totalExpenses: sql<number>`SUM(CASE WHEN ${transactions.amount} < 0 THEN ABS(${transactions.amount}) ELSE 0 END)`,
  })
  .from(transactions)
  .innerJoin(accounts, eq(transactions.accountId, accounts.id))
  .where(eq(accounts.userId, userId))
  .groupBy(sql`DATE_TRUNC('month', ${transactions.date})`)
  .orderBy(sql`DATE_TRUNC('month', ${transactions.date})`);
```

## ✅ Data Validation

### Zod Schemas
```typescript
// Insert validation schemas
export const insertAccountSchema = createInsertSchema(accounts);
export const insertCategorySchema = createInsertSchema(categories);
export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(), // Convert string to Date
});

// Usage in API routes
app.post(
  "/transactions",
  zValidator("json", insertTransactionSchema),
  async (c) => {
    const values = c.req.valid("json"); // Fully typed and validated
    // Process transaction...
  }
);
```

### Data Constraints
- **Primary Keys**: All tables use CUID2 for unique, sortable IDs
- **Foreign Keys**: Proper referential integrity
- **Not Null**: Required fields enforced at DB level
- **Cascade Rules**: Account deletion removes transactions
- **Set Null**: Category deletion preserves transactions

## 🔄 Database Migrations

### Migration Management
```bash
# Generate migration files
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio
npm run db:studio
```

### Migration Files
```sql
-- Example migration: 0000_hesitant_slapstick.sql
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "user_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "category" (
  "id" text PRIMARY KEY NOT NULL,
  "name" text NOT NULL,
  "email" text,
  "user_id" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" text PRIMARY KEY NOT NULL,
  "ammount" integer NOT NULL,
  "date" timestamp NOT NULL,
  "payee" text NOT NULL,
  "notes" text,
  "account_id" text NOT NULL,
  "category_id" text
);

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" 
FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE cascade ON UPDATE no action;

ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_category_id_fk" 
FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE set null ON UPDATE no action;
```

## 🎯 Performance Optimization

### Indexing Strategy
```sql
-- Recommended indexes for performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_categories_user_id ON category(user_id);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_user_date ON transactions(account_id, date);
```

### Query Optimization
- **Select only needed columns** instead of `SELECT *`
- **Use proper JOINs** for related data
- **Filter early** with WHERE clauses
- **Use LIMIT** for pagination
- **Aggregate in database** rather than application

### Connection Pooling
```typescript
// Neon automatically handles connection pooling
const sql = neon(process.env.DATABASE_URL!, {
  // Connection options
  fetchConnectionCache: true,
});
```

## 💾 Data Management

### Backup Strategy
- **Automated backups** via Neon Database
- **Point-in-time recovery** capability
- **Cross-region replication** for disaster recovery

### Data Seeding
```typescript
// scripts/seed.ts
import { db } from "@/src/db/drizzle";
import { accounts, categories, transactions } from "@/src/db/schema";

const seedData = async () => {
  // Seed default categories
  await db.insert(categories).values([
    { id: createId(), name: "Food & Dining", userId: "user_123" },
    { id: createId(), name: "Transportation", userId: "user_123" },
    { id: createId(), name: "Shopping", userId: "user_123" },
  ]);

  // Seed sample account
  const [account] = await db.insert(accounts).values({
    id: createId(),
    name: "Checking Account",
    userId: "user_123",
  }).returning();

  // Seed sample transactions
  await db.insert(transactions).values([
    {
      id: createId(),
      amount: -2500, // $25.00 expense
      date: new Date(),
      payee: "Coffee Shop",
      accountId: account.id,
    },
  ]);
};
```

## 🔐 Security Considerations

### Data Protection
- **Row Level Security**: User data isolation by userId
- **Input Validation**: Zod schemas prevent malicious data
- **SQL Injection Prevention**: Drizzle ORM parameterized queries
- **Sensitive Data**: No PII stored beyond necessary

### Access Control
```typescript
// Ensure users can only access their data
const getUserTransactions = async (userId: string) => {
  return await db
    .select()
    .from(transactions)
    .innerJoin(accounts, eq(transactions.accountId, accounts.id))
    .where(eq(accounts.userId, userId)); // Critical: filter by userId
};
```

## 🧪 Testing

### Database Testing
```typescript
// Test database operations
import { beforeEach, afterEach, test, expect } from 'vitest';
import { db } from '@/src/db/drizzle';

beforeEach(async () => {
  // Start transaction for test isolation
  await db.execute('BEGIN');
});

afterEach(async () => {
  // Rollback transaction after each test
  await db.execute('ROLLBACK');
});

test('creates account successfully', async () => {
  const [account] = await db
    .insert(accounts)
    .values({
      id: createId(),
      name: "Test Account",
      userId: "test_user",
    })
    .returning();

  expect(account.name).toBe("Test Account");
});
```

## 📊 Monitoring & Analytics

### Database Metrics
- **Query performance** monitoring
- **Connection pool** utilization
- **Storage usage** tracking
- **Error rate** monitoring

### Query Analysis
```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT * FROM transactions 
WHERE account_id IN (
  SELECT id FROM accounts WHERE user_id = 'user_123'
) 
ORDER BY date DESC LIMIT 100;
```

## 🚀 Scaling Considerations

### Current Limits
- **Neon Free Tier**: 512 MB storage, 1 compute unit
- **Connection Limits**: Serverless auto-scaling
- **Query Optimization**: Indexes and efficient queries

### Growth Planning
- **Read Replicas**: For analytics workloads
- **Partitioning**: For large transaction tables
- **Caching Layer**: Redis for frequently accessed data
- **Data Archiving**: Move old transactions to cold storage

## 📚 Additional Resources

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Database Guide](https://neon.tech/docs)
- [Database Design Best Practices](https://www.postgresql.org/docs/current/ddl-constraints.html)
