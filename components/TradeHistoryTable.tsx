'use client';

import React from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui/common';
import { Trash2, History, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TradeHistoryTable() {
    const { history, deleteLog, clearHistory, activeSessionId } = useTradeStore();

    // Filter history for active session
    const sessionHistory = history.filter(log => log.sessionId === activeSessionId);

    // Calculate Stats for Header
    const tradesOnly = sessionHistory.filter(log => log.type === 'TRADE');
    const totalTrades = tradesOnly.length;
    const totalProfit = tradesOnly.reduce((acc, trade) => acc + trade.results.totalNetProfit, 0);
    const winRate = totalTrades > 0
        ? (tradesOnly.filter(t => t.results.totalNetProfit > 0).length / totalTrades) * 100
        : 0;

    return (
        <div className="flex flex-col h-full bg-trade-bg">
            {/* Stats Header (Optional if not in main layout) */}
            {/* <div className="grid grid-cols-4 gap-4 mb-4">
                <Card className="p-3 bg-trade-surface border-trade-border">
                    <div className="text-[10px] uppercase text-trade-text-muted">Net P/L</div>
                    <div className={cn("text-xl font-mono font-bold", totalProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                        ${totalProfit.toFixed(2)}
                    </div>
                </Card>
             </div> */}

            <Card className="flex-1 flex flex-col border border-trade-border bg-trade-surface/20 shadow-none rounded-none md:rounded-lg overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between p-3 border-b border-trade-border bg-trade-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-2">
                        <History className="w-4 h-4 text-trade-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Trade Log</span>
                        <span className="text-xs text-trade-text-muted px-2 py-0.5 bg-trade-bg rounded-md border border-trade-border font-mono">
                            {totalTrades}
                        </span>
                    </div>

                    {sessionHistory.length > 0 && (
                        <div className="flex items-center gap-4">
                            <div className="hidden md:flex items-center gap-4 text-xs">
                                <div>
                                    <span className="text-trade-text-muted mr-1">Net P/L:</span>
                                    <span className={cn("font-mono font-medium", totalProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                                        ${totalProfit.toFixed(2)}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-trade-text-muted mr-1">Win Rate:</span>
                                    <span className="font-mono text-trade-text-primary">{winRate.toFixed(1)}%</span>
                                </div>
                            </div>
                            <Button
                                onClick={clearHistory}
                                className="h-6 text-[10px] bg-transparent border border-trade-border text-trade-text-muted hover:text-trade-loss hover:border-trade-loss hover:bg-trade-loss/10 px-2"
                            >
                                Clear
                            </Button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 z-10 bg-trade-surface border-b border-trade-border text-xs text-trade-text-secondary uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-2 font-medium w-32">Time</th>
                                <th className="px-4 py-2 font-medium w-24">Asset</th>
                                <th className="px-4 py-2 font-medium w-20 text-center">Side</th>
                                <th className="px-4 py-2 font-medium text-right w-24">Vol</th>
                                <th className="px-4 py-2 font-medium text-right w-24">Entry</th>
                                <th className="px-4 py-2 font-medium text-right w-24">Net P/L</th>
                                <th className="px-4 py-2 font-medium text-right w-32">Balance</th>
                                <th className="px-4 py-2 font-medium w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-trade-border bg-trade-bg/50">
                            {sessionHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-2 text-trade-text-muted">
                                            <History className="w-8 h-8 opacity-20" />
                                            <p className="text-sm">No trades executed.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                sessionHistory.map((log) => {
                                    if (log.type === 'TRADE') {
                                        const isProfit = log.results.totalNetProfit >= 0;
                                        const isLong = log.input.entryPrice > log.input.stopLossPrice;

                                        return (
                                            <tr key={log.id} className="group hover:bg-trade-surface-hover/50 transition-colors text-xs text-trade-text-primary">
                                                {/* Time */}
                                                <td className="px-4 py-2 whitespace-nowrap text-trade-text-muted font-mono">
                                                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    <span className="text-[10px] ml-1 opacity-50">
                                                        {new Date(log.date).getDate()}
                                                    </span>
                                                </td>

                                                {/* Asset */}
                                                <td className="px-4 py-2 font-semibold tracking-wide">
                                                    {log.input.asset}
                                                </td>

                                                {/* Side */}
                                                <td className="px-4 py-2 text-center">
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[2px] font-medium uppercase text-[10px] border",
                                                        isLong
                                                            ? "bg-trade-success/10 text-trade-success border-trade-success/20"
                                                            : "bg-trade-loss/10 text-trade-loss border-trade-loss/20"
                                                    )}>
                                                        {isLong ? 'Buy' : 'Sell'}
                                                    </span>
                                                </td>

                                                {/* Volume */}
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-secondary">
                                                    {log.results.initialLots}
                                                </td>

                                                {/* Entry Price */}
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-secondary">
                                                    {log.input.entryPrice}
                                                </td>

                                                {/* Net P/L */}
                                                <td className="px-4 py-2 text-right font-mono font-medium">
                                                    <span className={cn(
                                                        isProfit ? "text-trade-success" : "text-trade-loss"
                                                    )}>
                                                        {isProfit ? '+' : ''}{log.results.totalNetProfit.toFixed(2)}
                                                    </span>
                                                </td>

                                                {/* Balance */}
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-muted">
                                                    {log.results.finalAccountBalance.toFixed(2)}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        onClick={() => deleteLog(log.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-trade-text-muted hover:text-trade-loss transition-opacity p-1"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    } else {
                                        // Transfer Log (Withdrawal/Deposit)
                                        const isWithdrawal = log.type === 'WITHDRAWAL';
                                        return (
                                            <tr key={log.id} className="group hover:bg-trade-surface-hover/50 transition-colors text-xs text-trade-text-primary">
                                                <td className="px-4 py-2 whitespace-nowrap text-trade-text-muted font-mono">
                                                    {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                    <span className="text-[10px] ml-1 opacity-50">
                                                        {new Date(log.date).getDate()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 font-medium italic text-trade-text-secondary">
                                                    {log.type === 'WITHDRAWAL' ? 'Withdrawal' : 'Deposit'} {log.note && <span className="text-[10px] text-trade-text-muted">({log.note})</span>}
                                                </td>
                                                <td className="px-4 py-2 text-center">-</td>
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-right font-mono font-medium">
                                                    <span className={cn(isWithdrawal ? "text-trade-loss" : "text-trade-success")}>
                                                        {isWithdrawal ? '-' : '+'}{log.amount.toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-muted">
                                                    {log.newBalance.toFixed(2)}
                                                </td>
                                                <td className="px-4 py-2 text-right">
                                                    <button
                                                        onClick={() => deleteLog(log.id)}
                                                        className="opacity-0 group-hover:opacity-100 text-trade-text-muted hover:text-trade-loss transition-opacity p-1"
                                                        title="Delete Log"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    }
                                }))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
