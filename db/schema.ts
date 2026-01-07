
import { sql } from '@vercel/postgres';
import { pgTable, text, serial, timestamp, doublePrecision, jsonb } from 'drizzle-orm/pg-core';

export const sessions = pgTable('sessions', {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    initialBalance: doublePrecision('initial_balance').notNull(),
    currency: text('currency').notNull().default('USD'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const logs = pgTable('logs', {
    id: text('id').primaryKey(),
    sessionId: text('session_id').references(() => sessions.id, { onDelete: 'cascade' }).notNull(),
    type: text('type').notNull(), // 'TRADE' | 'WITHDRAWAL' | 'DEPOSIT'
    data: jsonb('data').notNull(), // Stores the full TradeLog or TransferLog object
    createdAt: timestamp('created_at').defaultNow().notNull(),
});
