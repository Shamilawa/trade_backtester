'use client';

import React from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { Card, CardContent, CardHeader, CardTitle, Button } from './ui/common';
import { Trash2, History, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function TradeHistoryTable() {
    const { history, deleteLog, clearHistory } = useTradeStore();



    return (
        <Card className="w-full max-w-6xl mx-auto mt-8 border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between bg-slate-50 border-b border-slate-100 pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500" />
                    Trade History
                </CardTitle>
                <Button
                    onClick={clearHistory}
                    className="h-8 text-xs bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-red-600"
                >
                    Clear History
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="px-6 py-3 font-medium">Date</th>
                                <th className="px-6 py-3 font-medium">Asset</th>
                                <th className="px-6 py-3 font-medium">Direction</th>
                                <th className="px-6 py-3 font-medium">Lots</th>
                                <th className="px-6 py-3 font-medium">Net Profit</th>
                                <th className="px-6 py-3 font-medium text-right">Balance</th>
                                <th className="px-6 py-3 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {history.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm border-dashed border-slate-200">
                                        No trades logged yet. Click "New Trade" to start logging your positions.
                                    </td>
                                </tr>
                            ) : (
                                history.map((log) => {
                                    const isProfit = log.results.totalNetProfit >= 0;
                                    const isLong = log.input.entryPrice > log.input.stopLossPrice;

                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3 h-3 text-slate-400" />
                                                    {new Date(log.date).toLocaleString(undefined, {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-900">{log.input.asset}</td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                                                    isLong
                                                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                        : "bg-rose-50 text-rose-700 border-rose-200"
                                                )}>
                                                    {isLong ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {isLong ? 'Buy' : 'Sell'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">
                                                {log.results.initialLots}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    "font-semibold",
                                                    isProfit ? "text-green-600" : "text-red-600"
                                                )}>
                                                    {isProfit ? '+' : ''}${log.results.totalNetProfit.toFixed(2)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right font-medium text-slate-700">
                                                ${log.results.finalAccountBalance.toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => deleteLog(log.id)}
                                                    className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                                    title="Delete Log"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                }))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}
