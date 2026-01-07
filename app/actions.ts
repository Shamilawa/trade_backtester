
'use server';

import { sql } from '@vercel/postgres';
import { db } from '@vercel/postgres';
import { drizzle } from 'drizzle-orm/vercel-postgres';
import { sessions, logs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Session, TradeLog, TransferLog, HistoryLog } from '@/types';

// Create a drizzle instance
const drizzleDb = drizzle(sql);

export async function createSession(name: string, initialBalance: number): Promise<string> {
    const id = crypto.randomUUID();

    await drizzleDb.insert(sessions).values({
        id,
        name,
        initialBalance,
        currency: 'USD',
    });

    return id;
}

export async function getSession(id: string): Promise<Session | undefined> {
    const result = await drizzleDb.select().from(sessions).where(eq(sessions.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
        id: row.id,
        name: row.name,
        initialBalance: row.initialBalance,
        currency: row.currency,
        createdAt: row.createdAt.toISOString(),
    };
}

export async function getRecentSessions(): Promise<Session[]> {
    const result = await drizzleDb.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(10);
    return result.map(row => ({
        id: row.id,
        name: row.name,
        initialBalance: row.initialBalance,
        currency: row.currency,
        createdAt: row.createdAt.toISOString(),
    }));
}

export async function saveLog(sessionId: string, log: TradeLog | TransferLog) {
    await drizzleDb.insert(logs).values({
        id: log.id,
        sessionId: sessionId,
        type: log.type,
        data: log, // Storing the whole object as JSON
    });
}

export async function getLogs(sessionId: string): Promise<HistoryLog[]> {
    const result = await drizzleDb
        .select()
        .from(logs)
        .where(eq(logs.sessionId, sessionId))
        .orderBy(desc(logs.createdAt));

    return result.map((row) => row.data as HistoryLog);
}

export async function deleteSession(id: string) {
    await drizzleDb.delete(sessions).where(eq(sessions.id, id));
}

export async function deleteLog(id: string) {
    await drizzleDb.delete(logs).where(eq(logs.id, id));
}
