'use client';

import React from 'react';
import { AreaChart, Filter, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/common';

interface AnalyticsHeaderProps {
    sessionName: string;
    assetFilter: string;
    setAssetFilter: (asset: string) => void;
    dateRange: string;
    setDateRange: (range: string) => void;
    tradeCount: number;
}

export function AnalyticsHeader({
    sessionName,
    assetFilter,
    setAssetFilter,
    dateRange,
    setDateRange,
    tradeCount
}: AnalyticsHeaderProps) {
    return (
        <Card className="flex flex-col md:flex-row items-center justify-between p-3 border-b border-trade-border bg-trade-surface/50 backdrop-blur-md rounded-none md:rounded-t-lg">
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <AreaChart className="w-4 h-4 text-trade-primary" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Analytics</span>
                    <span className="text-xs text-trade-text-muted px-2 py-0.5 bg-trade-bg rounded-md border border-trade-border font-mono">
                        {sessionName}
                    </span>
                    <span className="text-xs text-trade-text-muted px-2 py-0.5 bg-trade-bg rounded-md border border-trade-border font-mono">
                        {tradeCount} Trades
                    </span>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
                <select
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    className="h-6 text-[10px] bg-trade-bg border border-trade-border rounded text-trade-text-secondary focus:outline-none focus:border-trade-primary cursor-pointer px-2"
                >
                    <option value="ALL">All Assets</option>
                    <option value="EURUSD">EURUSD</option>
                    <option value="XAUUSD">XAUUSD</option>
                </select>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="h-6 text-[10px] bg-trade-bg border border-trade-border rounded text-trade-text-secondary focus:outline-none focus:border-trade-primary cursor-pointer px-2"
                    disabled
                >
                    <option value="ALL">All Time</option>
                    <option value="MONTH">This Month</option>
                </select>
            </div>
        </Card>
    );
}
