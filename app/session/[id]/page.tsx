
import { getSession, getLogs } from '@/app/actions';
import SessionClient from '@/components/SessionClient';
import { notFound } from 'next/navigation';

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession(id);
    const logs = await getLogs(id);

    if (!session) {
        notFound();
    }

    return <SessionClient session={session} initialLogs={logs} />;
}
