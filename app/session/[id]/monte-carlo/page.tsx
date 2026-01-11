import { notFound } from 'next/navigation';
import { getSession } from '@/app/actions';
import { getLogs } from '@/app/actions';
import MonteCarloClient from '@/components/analytics/MonteCarloClient';

export default async function MonteCarloPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getSession(id);
    if (!session) {
        notFound();
    }

    const logs = await getLogs(id);

    return (
        <MonteCarloClient session={session} initialLogs={logs} />
    );
}
