// src/schema.ts
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { pgTable, integer, serial, text, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema} from 'drizzle-zod';
import { set, z } from 'zod';


export const accounts = pgTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email'),
  userId: text('user_id').notNull(),
});

export const accountRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));
export const insertAccountSchema = createInsertSchema(accounts);

export const categories = pgTable('category', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  email: text('email'),
  userId: text('user_id').notNull(),
});

export const categoryRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));
export const insertCategorySchema = createInsertSchema(categories);


export const transactions = pgTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  amount : integer('ammount').notNull(),
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

export const insertTransactionSchema = createInsertSchema(transactions, {
  date: z.coerce.date(),
});
