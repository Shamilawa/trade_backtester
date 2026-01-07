'use client';

import React, { useEffect, useState } from 'react';
import TradeTicket from '@/components/TradeTicket';
import TradeHistoryTable from '@/components/TradeHistoryTable';
import Sidebar from '@/components/Sidebar';
import { useTradeStore } from '@/store/tradeStore';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/common';
import WithdrawalModal from '@/components/WithdrawalModal';
import { Session, HistoryLog } from '@/types';

interface SessionClientProps {
    session: Session;
    initialLogs: HistoryLog[];
}

export default function SessionClient({ session, initialLogs }: SessionClientProps) {
    const { initializeSession, activeSessionId } = useTradeStore();
    const router = useRouter();
    const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

    // Initialize store with server data
    useEffect(() => {
        if (session) {
            initializeSession(session, initialLogs);
        }
    }, [session, initialLogs, initializeSession]);

    // If for some reason initialization failed or id doesn't match, show loading
    // ideally initializeSession sets activeSessionId immediately.
    if (activeSessionId !== session.id) {
        return (
            <div className="flex items-center justify-center h-screen bg-trade-bg text-trade-text-muted">
                Initializing Session...
            </div>
        );
    }

    return (
        <main className="h-screen w-screen overflow-hidden bg-trade-bg text-trade-text flex flex-col md:flex-row">
            <Sidebar />

            {/* Main Content - Data Grid */}
            <section className="flex-1 flex flex-col h-full overflow-hidden bg-trade-bg relative">
                <div className="flex-none h-[50px] p-3 border-b border-trade-border bg-trade-surface flex items-center justify-between">
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
                            {session.name}
                        </h2>
                    </div>
                    <div>
                        <div>
                            <Button
                                variant="outline"
                                className="h-8 text-xs gap-2"
                                onClick={() => setIsWithdrawModalOpen(true)}
                            >
                                Withdraw
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-3 overflow-hidden">
                    <TradeHistoryTable />
                </div>
            </section>

            {/* Sidebar - Trade Ticket */}
            <aside className="w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-l border-trade-border bg-trade-surface/50 backdrop-blur-md flex flex-col h-full z-10">
                <div className="p-3 border-b border-trade-border bg-trade-surface/20 h-[50px]">
                    <h1 className="text-sm font-bold text-trade-text-primary tracking-tight uppercase">Terminal <span className="text-trade-primary">Pro</span></h1>
                </div>
                <div className="flex-1 overflow-y-auto p-3">
                    <TradeTicket />
                </div>
            </aside>
            <WithdrawalModal open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen} />
        </main>
    );
}
