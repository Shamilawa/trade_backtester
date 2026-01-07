'use client';

import React from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { Card, CardHeader, CardTitle, CardContent } from './ui/common';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Clock, MoveRight, ArrowRight, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import CreateSessionModal from './CreateSessionModal';

export default function SessionList() {
    const { sessions, history, deleteSession } = useTradeStore();
    const router = useRouter();

    const handleSelect = (id: string) => {
        router.push(`/session/${id}`);
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-trade-text-primary tracking-tight mb-2">My Sessions</h1>
                    <p className="text-trade-text-muted">Manage your backtesting workspaces.</p>
                </div>
                <CreateSessionModal />
            </div>

            {sessions.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-trade-border rounded-xl bg-trade-surface/30">
                    <div className="mb-4 text-trade-text-muted opacity-50">
                        <TrendingUp className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-trade-text-primary mb-2">No Sessions Found</h3>
                    <p className="text-trade-text-muted max-w-sm mx-auto mb-6">
                        Get started by creating a new session to track your trades independently.
                    </p>
                    <CreateSessionModal />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sessions.map(session => {
                        // Calculate stats on the fly for the card
                        const sessionTrades = history.filter(t => t.sessionId === session.id);
                        const totalProfit = sessionTrades.reduce((acc, t) => acc + t.results.totalNetProfit, 0);
                        const winRate = sessionTrades.length > 0
                            ? (sessionTrades.filter(t => t.results.totalNetProfit > 0).length / sessionTrades.length) * 100
                            : 0;
                        const tradeCount = sessionTrades.length;
                        const currentBalance = session.initialBalance + totalProfit;

                        return (
                            <div
                                key={session.id}
                                onClick={() => handleSelect(session.id)}
                                className="group relative bg-trade-surface border border-trade-border rounded-xl p-0 hover:border-trade-primary/50 transition-all cursor-pointer hover:shadow-xl hover:shadow-black/20 overflow-hidden"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-trade-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-semibold text-lg text-trade-text-primary group-hover:text-trade-primary transition-colors">
                                                {session.name}
                                            </h3>
                                            <div className="text-xs text-trade-text-muted flex items-center mt-1">
                                                <Clock className="w-3 h-3 mr-1" />
                                                {new Date(session.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteSession(session.id); }}
                                            className="text-trade-text-muted hover:text-trade-loss p-1 rounded hover:bg-trade-loss/10 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 pt-2">
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase text-trade-text-muted font-medium">Net Profit</div>
                                            <div className={cn(
                                                "text-lg font-mono font-bold",
                                                totalProfit >= 0 ? "text-trade-success" : "text-trade-loss"
                                            )}>
                                                {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(0)}
                                            </div>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <div className="text-[10px] uppercase text-trade-text-muted font-medium">Balance</div>
                                            <div className="text-lg font-mono font-bold text-trade-text-primary">
                                                ${currentBalance.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-trade-border text-xs">
                                        <div className="flex items-center gap-3">
                                            <span className="px-2 py-0.5 rounded bg-trade-bg border border-trade-border text-trade-text-secondary">
                                                {tradeCount} Trades
                                            </span>
                                            <span className="text-trade-text-muted">
                                                Win Rate: <span className="text-trade-text-primary font-mono">{winRate.toFixed(0)}%</span>
                                            </span>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-trade-text-muted group-hover:text-trade-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
