'use client';

import React, { useMemo, useState } from 'react';
import { Session, HistoryLog, TradeLog } from '@/types';
import { calculateEquityCurve, calculateMetrics, filterLogs } from '@/lib/analytics';
import { KeyMetrics } from './KeyMetrics';
import { EquityCurveChart, DrawdownChart, WinLossDistributionChart } from './Charts';
import { AnalyticsHeader } from './AnalyticsHeader';

export default function AnalyticsClient({ session, initialLogs }: { session: Session, initialLogs: HistoryLog[] }) {
    const [assetFilter, setAssetFilter] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<string>('ALL');

    const filteredLogs = useMemo(() => {
        return filterLogs(initialLogs, assetFilter === 'ALL' ? null : assetFilter);
    }, [initialLogs, assetFilter]);

    const metrics = useMemo(() => calculateMetrics(filteredLogs), [filteredLogs]);
    const equityCurve = useMemo(() => calculateEquityCurve(filteredLogs, session.initialBalance), [filteredLogs, session.initialBalance]);

    const winLossDistribution = useMemo(() => {
        const trades = filteredLogs.filter(l => l.type === 'TRADE') as TradeLog[];
        if (trades.length === 0) return [];

        const bins = [
            { label: '< -500', min: -Infinity, max: -500, count: 0, fill: '#881337' },
            { label: '-500:-100', min: -500, max: -100, count: 0, fill: '#be123c' },
            { label: '-100:0', min: -100, max: 0, count: 0, fill: '#f43f5e' },
            { label: '0:100', min: 0, max: 100, count: 0, fill: '#10b981' },
            { label: '100:500', min: 100, max: 500, count: 0, fill: '#059669' },
            { label: '> 500', min: 500, max: Infinity, count: 0, fill: '#047857' },
        ];

        trades.forEach(t => {
            const p = t.results.totalNetProfit;
            const bin = bins.find(b => p >= b.min && p < b.max);
            if (bin) bin.count++;
        });

        return bins.map(b => ({ range: b.label, count: b.count, fill: b.fill }));
    }, [filteredLogs]);

    return (
        <div className="flex flex-col h-full bg-trade-bg">
            {/* Main Container - matching Trade Table wrapper style */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">

                {/* Header & Controls */}
                <AnalyticsHeader
                    sessionName={session.name}
                    assetFilter={assetFilter}
                    setAssetFilter={setAssetFilter}
                    dateRange={dateRange}
                    setDateRange={setDateRange}
                    tradeCount={filteredLogs.length}
                />

                {/* Key Metrics - Grid Strip */}
                <KeyMetrics metrics={metrics} />

                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <EquityCurveChart data={equityCurve} />
                    </div>
                    <div>
                        <DrawdownChart data={equityCurve} />
                    </div>
                    <div>
                        <WinLossDistributionChart data={winLossDistribution} />
                    </div>
                </div>

                <div className="text-center text-[10px] text-trade-text-muted/50 font-mono py-4 border-t border-trade-border">
                    ANALYTICS MODULE // {new Date().toISOString()} // {session.id}
                </div>
            </div>
        </div>
    );
}
