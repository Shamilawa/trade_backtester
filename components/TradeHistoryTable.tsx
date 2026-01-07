'use client';

import React from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/common';
import { Trash2, History, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnalyticsCards from './AnalyticsCards';

import { deleteLog as deleteLogAction } from '@/app/actions';

export default function TradeHistoryTable() {
    const { history, deleteLog, activeSessionId, sessions } = useTradeStore();
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const [assetFilter, setAssetFilter] = React.useState<string>('ALL');
    const [typeFilter, setTypeFilter] = React.useState<string>('ALL');

    const [deleteId, setDeleteId] = React.useState<string | null>(null);

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (deleteId) {
            deleteLog(deleteId); // Optimistic Update
            try {
                await deleteLogAction(deleteId);
            } catch (e) {
                console.error("Failed to delete log server side", e);
            }
            setDeleteId(null);
        }
    };

    // Filter history for active session & UI filters
    const sessionHistory = history.filter(log => {
        if (log.sessionId !== activeSessionId) return false;

        // Asset Filter: Matches Asset if Trade, or hides Transfer if specific asset selected?
        // Usually Transfer (Deposit/Withdraw) is "Account Level", not Asset Level.
        // So if filtering for EURUSD, we probably don't want to see Withdrawals? Or do we?
        // Let's assume strict filtering: If EURUSD selected, only show EURUSD trades.
        if (assetFilter !== 'ALL') {
            if (log.type !== 'TRADE') return false; // Transfers have no asset
            if (log.input.asset !== assetFilter) return false;
        }

        // Type Filter
        if (typeFilter !== 'ALL') {
            if (typeFilter === 'TRADE' && log.type !== 'TRADE') return false;
            if (typeFilter === 'TRANSFER' && (log.type === 'TRADE')) return false;
            // Note: TRANSFER covers WITHDRAWAL and DEPOSIT
        }

        return true;
    });

    // Calculate Stats for Header (Based on FILTERED view or GLOBAL session view? usually Global is better for "Net P/L" context, but table shows filtered.)
    // Let's keep the Stats based on the GLOBAL session (before filters) so users always know their true P/L, 
    // OR matching the view. Matching the view is often less confusing.
    // However, "Net P/L" of just EURUSD trades is useful.
    // Let's us the filtered list for stats.

    const displayedTrades = sessionHistory.filter(log => log.type === 'TRADE');
    const totalTrades = displayedTrades.length;
    const totalProfit = displayedTrades.reduce((acc, trade) => acc + trade.results.totalNetProfit, 0);
    const winRate = totalTrades > 0
        ? (displayedTrades.filter(t => t.results.totalNetProfit > 0).length / totalTrades) * 100
        : 0;

    return (
        <div className="flex flex-col h-full bg-trade-bg">
            {/* Analytics Section */}
            <AnalyticsCards history={sessionHistory} session={activeSession} />

            <Card className="flex-1 flex flex-col border border-trade-border bg-trade-surface/20 shadow-none rounded-none md:rounded-lg overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between p-3 border-b border-trade-border bg-trade-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-trade-primary" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Trade Log</span>
                            <span className="text-xs text-trade-text-muted px-2 py-0.5 bg-trade-bg rounded-md border border-trade-border font-mono">
                                {totalTrades}
                            </span>
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2">
                            <select
                                value={assetFilter}
                                onChange={(e) => setAssetFilter(e.target.value)}
                                className="h-6 text-[10px] bg-trade-bg border border-trade-border rounded text-trade-text-secondary focus:outline-none focus:border-trade-primary cursor-pointer"
                            >
                                <option value="ALL">All Assets</option>
                                <option value="EURUSD">EURUSD</option>
                                <option value="XAUUSD">XAUUSD</option>
                            </select>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="h-6 text-[10px] bg-trade-bg border border-trade-border rounded text-trade-text-secondary focus:outline-none focus:border-trade-primary cursor-pointer"
                            >
                                <option value="ALL">All Types</option>
                                <option value="TRADE">Trades</option>
                                <option value="TRANSFER">Transfers</option>
                            </select>
                        </div>
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
                                <th className="px-4 py-2 font-medium text-right w-24">Lots</th>
                                <th className="px-4 py-2 font-medium text-right w-24">Entry</th>
                                <th className="px-4 py-2 font-medium text-right w-16">R</th>
                                <th className="px-4 py-2 font-medium text-right w-16">%</th>
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
                                                <td className="px-4 py-2 whitespace-nowrap font-mono">
                                                    <div className="flex flex-col">
                                                        <span className="text-trade-text-primary text-xs">
                                                            {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </span>
                                                        <span className="text-[10px] text-trade-text-muted opacity-70">
                                                            {new Date(log.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                                                        </span>
                                                    </div>
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

                                                {/* R Gain */}
                                                <td className="px-4 py-2 text-right font-mono font-medium">
                                                    <span className={cn(isProfit ? "text-trade-success" : "text-trade-loss")}>
                                                        {log.results.initialRiskAmount > 0
                                                            ? (log.results.totalNetProfit / log.results.initialRiskAmount).toFixed(1) + 'R'
                                                            : '-'}
                                                    </span>
                                                </td>

                                                {/* % Gain */}
                                                <td className="px-4 py-2 text-right font-mono font-medium">
                                                    <span className={cn(isProfit ? "text-trade-success" : "text-trade-loss")}>
                                                        {((log.results.totalNetProfit / log.input.accountBalance) * 100).toFixed(2)}%
                                                    </span>
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
                                                        onClick={() => handleDeleteClick(log.id)}
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
                                                <td className="px-4 py-2 whitespace-nowrap font-mono">
                                                    <div className="flex flex-col">
                                                        <span className="text-trade-text-primary text-xs">
                                                            {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </span>
                                                        <span className="text-[10px] text-trade-text-muted opacity-70">
                                                            {new Date(log.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 font-medium italic text-trade-text-secondary">
                                                    {log.type === 'WITHDRAWAL' ? 'Withdrawal' : 'Deposit'} {log.note && <span className="text-[10px] text-trade-text-muted">({log.note})</span>}
                                                </td>
                                                <td className="px-4 py-2 text-center">-</td>
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-secondary">-</td>
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
                                                        onClick={() => handleDeleteClick(log.id)}
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
            </Card >

            <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Delete Confirmation</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this log? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="default" className="bg-trade-loss hover:bg-trade-loss/90" onClick={confirmDelete}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
