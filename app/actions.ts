'use server';

import { db } from '@/lib/db';
import { sessions, logs } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Session, TradeLog, TransferLog, HistoryLog } from '@/types';
import { revalidatePath } from 'next/cache';

export async function createSession(name: string, initialBalance: number): Promise<string> {
    const id = crypto.randomUUID();

    await db.insert(sessions).values({
        id,
        name,
        initialBalance,
        currency: 'USD',
    });

    revalidatePath('/');
    return id;
}

export async function getSession(id: string): Promise<Session | undefined> {
    const result = await db.select().from(sessions).where(eq(sessions.id, id));

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
    const result = await db.select().from(sessions).orderBy(desc(sessions.createdAt)).limit(10);
    return result.map(row => ({
        id: row.id,
        name: row.name,
        initialBalance: row.initialBalance,
        currency: row.currency,
        createdAt: row.createdAt.toISOString(),
    }));
}

export async function saveLog(sessionId: string, log: TradeLog | TransferLog) {
    await db.insert(logs).values({
        id: log.id,
        sessionId: sessionId,
        type: log.type,
        data: log, // Storing the whole object as JSON
    });
}

export async function getLogs(sessionId: string): Promise<HistoryLog[]> {
    const result = await db
        .select()
        .from(logs)
        .where(eq(logs.sessionId, sessionId))
        .orderBy(desc(logs.createdAt));

    return result.map((row) => row.data as HistoryLog);
}

export async function deleteSession(id: string) {
    await db.delete(sessions).where(eq(sessions.id, id));
    revalidatePath('/');
}

export async function deleteLog(id: string) {
    await db.delete(logs).where(eq(logs.id, id));
}
