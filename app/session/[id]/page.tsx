'use client';

import React, { useEffect, use } from 'react';
import TradeTicket from '@/components/TradeTicket';
import TradeHistoryTable from '@/components/TradeHistoryTable';
import Sidebar from '@/components/Sidebar';
import { useTradeStore } from '@/store/tradeStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/common';

export default function SessionDashboard({ params }: { params: Promise<{ id: string }> }) {
    const { setActiveSession, activeSessionId, sessions } = useTradeStore();
    const router = useRouter();

    // Unwrap params using React.use() or await if in async component, but this is client component so we use the hook pattern or just unwrap it if it was passed as prop in server component. 
    // Next.js 15+ params are promises.
    const { id } = use(params);

    useEffect(() => {
        if (id) {
            setActiveSession(id);
        }
    }, [id, setActiveSession]);

    // Guard: If session doesn't exist, redirect to lobby
    // We need to wait for hydration though.
    // Simple check:
    const sessionExists = sessions.find(s => s.id === id);
    // If we are strictly client side, and sessions are in local storage (persisted), they should be available.
    // If not persisted yet, this might redirect prematurely on refresh. 
    // For now, assuming store is persistent or we accept the redirect if empty.

    // Note: On first load, sessions might be empty if Zustand persist hasn't rehydrated. 
    // We'll skip strict redirect for this demo to avoid issues, or wait for rehydration.

    if (activeSessionId !== id) {
        return (
            <div className="flex items-center justify-center h-screen bg-trade-bg text-trade-text-muted">
                Loading Session...
            </div>
        );
    }

    return (
        <main className="h-screen w-screen overflow-hidden bg-trade-bg text-trade-text flex flex-col md:flex-row">
            <Sidebar />

            {/* Main Content - Data Grid */}
            <section className="flex-1 flex flex-col h-full overflow-hidden bg-trade-bg relative">
                <div className="flex-none p-3 border-b border-trade-border bg-trade-surface flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => router.push('/')}
                            className="h-8 px-2 text-trade-text-muted hover:text-trade-text-primary"
                        >
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Lobby
                        </Button>
                        <div className="h-4 w-px bg-trade-border mx-2" />
                        <h2 className="text-sm font-semibold text-trade-text-primary">
                            {sessionExists?.name || 'Session'}
                        </h2>
                    </div>
                    <div>
                        {/* Session specific actions could go here */}
                    </div>
                </div>

                <div className="flex-1 p-3 overflow-hidden">
                    <TradeHistoryTable />
                </div>
            </section>

            {/* Sidebar - Trade Ticket */}
            <aside className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-l border-trade-border bg-trade-surface/50 backdrop-blur-md flex flex-col h-full z-10">
                <div className="p-3 border-b border-trade-border bg-trade-surface/20">
                    <h1 className="text-sm font-bold text-trade-text-primary tracking-tight uppercase">Terminal <span className="text-trade-primary">Pro</span></h1>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    <TradeTicket />
                </div>
            </aside>
        </main>
    );
}
