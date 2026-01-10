'use client';

import React from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { TradeLog } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/common';
import { Trash2, History, TrendingUp, TrendingDown, Clock, ArrowUpRight, ArrowDownRight, Image as ImageIcon, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnalyticsCards from './AnalyticsCards';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import EditTradeModal from './EditTradeModal';

import { deleteLog as deleteLogAction } from '@/app/actions';

export default function TradeHistoryTable() {
    const { history, deleteLog, activeSessionId, sessions } = useTradeStore();
    const activeSession = sessions.find(s => s.id === activeSessionId);
    const [assetFilter, setAssetFilter] = React.useState<string>('ALL');
    const [typeFilter, setTypeFilter] = React.useState<string>('ALL');

    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [expandedRows, setExpandedRows] = React.useState<Set<string>>(new Set());

    const toggleRow = (id: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

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

        // Asset Filter
        if (assetFilter !== 'ALL') {
            if (log.type !== 'TRADE') return false; // Transfers have no asset
            if (log.input.asset !== assetFilter) return false;
        }

        // Type Filter
        if (typeFilter !== 'ALL') {
            if (typeFilter === 'TRADE' && log.type !== 'TRADE') return false;
            if (typeFilter === 'TRANSFER' && (log.type === 'TRADE')) return false;
        }

        return true;
    });

    const displayedTrades = sessionHistory.filter(log => log.type === 'TRADE');
    const totalTrades = displayedTrades.length;
    const totalProfit = displayedTrades.reduce((acc, trade) => acc + trade.results.totalNetProfit, 0);
    const winRate = totalTrades > 0
        ? (displayedTrades.filter(t => t.results.totalNetProfit > 0).length / totalTrades) * 100
        : 0;

    const [editTrade, setEditTrade] = React.useState<TradeLog | null>(null);

    return (
        <div className="flex flex-col h-full bg-trade-bg">
            {/* Analytics Section */}
            <AnalyticsCards history={sessionHistory} session={activeSession} />

            <Card className="flex-1 flex flex-col border border-trade-border bg-trade-surface/20 shadow-none rounded-none md:rounded-[6px] overflow-hidden backdrop-blur-sm">
                <div className="flex items-center justify-between p-3 border-b border-trade-border bg-trade-surface/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <History className="w-4 h-4 text-trade-primary" />
                            <span className="text-[10px] uppercase font-bold tracking-wider text-trade-text-secondary">Trade Log</span>
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
                                        ${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-trade-surface border-b border-trade-border text-xs text-trade-text-secondary uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-2 w-8"></th>
                                <th className="px-4 py-2 font-medium w-32">Date</th>
                                <th className="px-4 py-2 font-medium w-24">Asset</th>
                                <th className="px-4 py-2 font-medium w-20 text-center">Side</th>
                                <th className="px-4 py-2 font-medium text-center w-24">Lots</th>
                                <th className="px-4 py-2 font-medium text-center w-24">Entry</th>
                                <th className="px-4 py-2 font-medium text-center w-16">R Gain</th>
                                <th className="px-4 py-2 font-medium text-center w-16">% Gain</th>
                                <th className="px-4 py-2 font-medium text-center w-16">Comm</th>
                                <th className="px-4 py-2 font-medium text-center w-24">Net P/L</th>
                                <th className="px-4 py-2 font-medium text-right w-32">Balance</th>
                                <th className="px-4 py-2 font-medium w-16 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-trade-border bg-trade-bg/50">
                            {sessionHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={12} className="px-6 py-12 text-center">
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
                                        const isExpanded = expandedRows.has(log.id);

                                        return (
                                            <React.Fragment key={log.id}>
                                                {/* Main Row */}
                                                <tr
                                                    className={cn(
                                                        "group hover:bg-trade-surface-hover/50 transition-colors text-xs text-trade-text-primary cursor-pointer",
                                                        isExpanded && "bg-trade-surface-hover/30"
                                                    )}
                                                    onClick={() => toggleRow(log.id)}
                                                >
                                                    <td className="px-4 py-2 text-center">
                                                        <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-transparent">
                                                            {isExpanded ? <ArrowDownRight size={14} className="text-trade-primary" /> : <ArrowUpRight size={14} className="text-trade-text-muted" />}
                                                        </Button>
                                                    </td>
                                                    <td className="px-4 py-2 whitespace-nowrap font-mono">
                                                        <div className="flex flex-col">
                                                            <span className="text-trade-text-primary text-xs font-semibold">
                                                                {new Date(log.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                                                            </span>
                                                            <span className="text-[10px] text-trade-text-muted font-mono">
                                                                {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2 font-semibold tracking-wide">
                                                        {log.input.asset}
                                                    </td>
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
                                                    <td className="px-4 py-2 text-center font-mono text-trade-text-secondary">
                                                        {log.results.initialLots}
                                                    </td>
                                                    <td className="px-4 py-2 text-center font-mono text-trade-text-secondary">
                                                        {log.input.entryPrice}
                                                    </td>
                                                    <td className="px-4 py-2 text-center font-mono font-medium">
                                                        <span className={cn(isProfit ? "text-trade-success" : "text-trade-loss")}>
                                                            {log.results.initialRiskAmount > 0
                                                                ? (log.results.totalNetProfit / log.results.initialRiskAmount).toFixed(1) + 'R'
                                                                : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center font-mono font-medium">
                                                        <span className={cn(isProfit ? "text-trade-success" : "text-trade-loss")}>
                                                            {((log.results.totalNetProfit / log.input.accountBalance) * 100).toFixed(2)}%
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center font-mono font-medium">
                                                        <span className='text-trade-loss'>
                                                            ${log.results.exits.reduce((acc, e) => acc + e.commission, 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-center font-mono font-medium">
                                                        <span className={cn(
                                                            isProfit ? "text-trade-success" : "text-trade-loss"
                                                        )}>
                                                            ${isProfit ? '+' : ''}{log.results.totalNetProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-right font-mono text-trade-text-muted">
                                                        ${log.results.finalAccountBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => setEditTrade(log)}
                                                                className="text-trade-text-muted hover:text-trade-primary transition-colors p-1"
                                                                title="Edit Log"
                                                            >
                                                                <Pencil size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(log.id)}
                                                                className="text-trade-text-muted hover:text-trade-loss transition-colors p-1"
                                                                title="Delete Log"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {/* Expanded Details Row */}
                                                {isExpanded && (
                                                    <tr className="bg-trade-surface/10 border-b border-trade-border/50">
                                                        <td colSpan={12} className="p-0">
                                                            <div className="p-4 bg-trade-bg/30 inner-shadow">
                                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                                                    {/* Breakdown Table */}
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="text-[10px] uppercase font-bold text-trade-text-muted mb-2 tracking-wider flex items-center gap-2">
                                                                            <ArrowDownRight size={12} /> Partial Exit Breakdown
                                                                        </div>
                                                                        <div className="overflow-x-auto border border-trade-border/30 rounded-md bg-trade-surface/20 flex-1">
                                                                            <table className="w-full text-left text-xs h-full">
                                                                                <thead className="text-trade-text-muted border-b border-trade-border/30 bg-trade-surface/30 sticky top-0">
                                                                                    <tr>
                                                                                        <th className="py-2 px-3 font-medium w-16">Exit #</th>
                                                                                        <th className="py-2 px-3 font-medium">Lots</th>
                                                                                        <th className="py-2 px-3 font-medium">Pips</th>
                                                                                        <th className="py-2 px-3 font-medium">Gross</th>
                                                                                        <th className="py-2 px-3 font-medium">Comm</th>
                                                                                        <th className="py-2 px-3 font-medium">Net P&L</th>
                                                                                        <th className="py-2 px-3 font-medium text-center">R</th>
                                                                                        <th className="py-2 px-3 font-medium text-center">%</th>
                                                                                    </tr>
                                                                                </thead>
                                                                                <tbody className="divide-y divide-trade-border/10">
                                                                                    {log.results.exits.map((exit, i) => (
                                                                                        <tr key={exit.exitId} className="hover:bg-trade-surface-hover/20 font-mono text-[11px]">
                                                                                            <td className="py-1.5 px-3 text-trade-text-secondary">#{i + 1}</td>
                                                                                            <td className="py-1.5 px-3 text-trade-text-secondary">{exit.lotsClosed.toFixed(2)}</td>
                                                                                            <td className="py-1.5 px-3 text-trade-text-secondary">{exit.pipsCaptured.toFixed(1)}</td>
                                                                                            <td className={cn("py-1.5 px-3", exit.grossProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                                                                                                ${exit.grossProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                            </td>
                                                                                            <td className="py-1.5 px-3 text-trade-loss">-${exit.commission.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                                            <td className={cn("py-1.5 px-3 font-medium", exit.netProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                                                                                                ${exit.netProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                                            </td>
                                                                                            <td className={cn("py-1.5 px-3 text-center", exit.netProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                                                                                                {log.results.initialRiskAmount > 0
                                                                                                    ? (exit.netProfit / log.results.initialRiskAmount).toFixed(1) + 'R'
                                                                                                    : '-'}
                                                                                            </td>
                                                                                            <td className={cn("py-1.5 px-3 text-center", exit.netProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                                                                                                {((exit.netProfit / log.input.accountBalance) * 100).toFixed(2)}%
                                                                                            </td>
                                                                                        </tr>
                                                                                    ))}
                                                                                </tbody>
                                                                            </table>
                                                                        </div>
                                                                    </div>

                                                                    {/* Image Placeholders */}
                                                                    <div className="flex flex-col h-full">
                                                                        <div className="text-[10px] uppercase font-bold text-trade-text-muted mb-2 tracking-wider flex items-center gap-2">
                                                                            <ImageIcon size={12} /> Screenshots
                                                                        </div>
                                                                        <div className="grid grid-cols-2 gap-4 flex-1">
                                                                            {/* Entry Image Placeholder */}
                                                                            <ImageUploadPlaceholder
                                                                                tradeId={log.id}
                                                                                type="entry"
                                                                                imageUrl={log.entryImage}
                                                                            />

                                                                            {/* Exit Image Placeholder */}
                                                                            <ImageUploadPlaceholder
                                                                                tradeId={log.id}
                                                                                type="exit"
                                                                                imageUrl={log.exitImage}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    } else {
                                        // Transfer Log (Withdrawal/Deposit)
                                        const isWithdrawal = log.type === 'WITHDRAWAL';
                                        return (
                                            <tr key={log.id} className="group hover:bg-trade-surface-hover/50 transition-colors text-xs text-trade-text-primary">
                                                <td className="px-4 py-2"></td>
                                                <td className="px-4 py-2 whitespace-nowrap font-mono">
                                                    <div className="flex flex-col">
                                                        <span className="text-trade-text-primary text-xs font-semibold">
                                                            {new Date(log.date).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                                                        </span>
                                                        <span className="text-[10px] text-trade-text-muted font-mono">
                                                            {new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2 font-medium italic text-trade-text-secondary">
                                                    {log.type === 'WITHDRAWAL' ? 'Withdrawal' : 'Deposit'} {log.note && <span className="text-[10px] text-trade-text-muted">({log.note})</span>}
                                                </td>
                                                <td className="px-4 py-2 text-center">-</td>
                                                <td className="px-4 py-2 text-center font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-center font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-center font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-center font-mono text-trade-text-secondary">-</td>
                                                <td className="px-4 py-2 text-center font-mono font-medium">
                                                    <span className={cn(isWithdrawal ? "text-trade-loss" : "text-trade-success")}>
                                                        {isWithdrawal ? '-' : '+'}{log.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-right font-mono text-trade-text-muted">
                                                    {log.newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

            <EditTradeModal
                isOpen={!!editTrade}
                onClose={() => setEditTrade(null)}
                trade={editTrade}
            />
        </div >
    );
}

const ImageUploadPlaceholder = ({ tradeId, type, imageUrl }: { tradeId: string, type: 'entry' | 'exit', imageUrl?: string }) => {
    const { uploadTradeImage } = useTradeStore();
    const [isUploading, setIsUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await uploadTradeImage(tradeId, type, file);
        } catch (error) {
            console.error("Upload failed", error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleClick = () => {
        if (!imageUrl && !isUploading) {
            fileInputRef.current?.click();
        } else if (imageUrl) {
            window.open(imageUrl, '_blank');
        }
    };

    return (
        <div
            onClick={handleClick}
            className={cn(
                "border-2 border-dashed border-trade-border/40 rounded-lg flex flex-col items-center justify-center p-4 bg-trade-surface/10 hover:bg-trade-surface/30 hover:border-trade-primary/30 transition-all cursor-pointer group h-full relative overflow-hidden",
                imageUrl && "border-solid border-trade-border/60 p-0"
            )}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
            />

            {imageUrl ? (
                <div className="w-full h-full relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={`${type} screenshot`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-medium flex items-center gap-2">
                            <ArrowUpRight size={14} /> View
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    {isUploading ? (
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="h-8 w-8 rounded-full border-2 border-trade-primary border-t-transparent animate-spin mb-2" />
                            <span className="text-xs text-trade-text-muted">Uploading...</span>
                        </div>
                    ) : (
                        <>
                            <div className="h-10 w-10 rounded-full bg-trade-bg/50 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <ImageIcon className="w-5 h-5 text-trade-text-muted group-hover:text-trade-primary transition-colors" />
                            </div>
                            <span className="text-xs font-medium text-trade-text-muted group-hover:text-trade-primary transition-colors capitalize">Add {type} Screenshot</span>
                        </>
                    )}
                </>
            )}
        </div>
    );
};
