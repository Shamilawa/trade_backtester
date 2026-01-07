'use client';

import React, { useMemo, useState } from 'react';
import { Session, HistoryLog } from '@/types';
import { calculateEquityCurve, calculateMetrics, filterLogs } from '@/lib/analytics';
import { KeyMetrics } from './KeyMetrics';
import { EquityCurveChart, DrawdownChart } from './Charts';
import { Button } from '@/components/ui/common'; // Assuming generic button exists, or use standard
import { Filter, Calendar } from 'lucide-react';


// Check if select exists, if not I'll fall back to standard select for now to avoid complexity or check file struct.
// I see 'ui' dir in components list steps ago. Let's assume standard HTML select if unsure, but I will try to use a simple custom UI if possible or just standard for MVP.
// The user has 'ui' folder. Let's look at it next step just to be sure, but for now I will write this assuming basic UI or HTML elements to be safe and robust.

export default function AnalyticsClient({ session, initialLogs }: { session: Session, initialLogs: HistoryLog[] }) {
    const [assetFilter, setAssetFilter] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<string>('ALL'); // Placeholder for future date logic

    const filteredLogs = useMemo(() => {
        return filterLogs(initialLogs, assetFilter === 'ALL' ? null : assetFilter);
    }, [initialLogs, assetFilter]);

    const metrics = useMemo(() => calculateMetrics(filteredLogs), [filteredLogs]);
    const equityCurve = useMemo(() => calculateEquityCurve(filteredLogs, session.initialBalance), [filteredLogs, session.initialBalance]);

    return (
        <div className="flex flex-col h-full bg-trade-background text-trade-text-primary p-6 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-trade-text-muted text-sm">
                        Performance insights for session: <span className="text-trade-primary">{session.name}</span>
                    </p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 bg-trade-surface p-1 rounded-md border border-trade-border">
                    <div className="px-3 py-1 text-xs font-medium text-trade-text-secondary uppercase tracking-wider flex items-center gap-1">
                        <Filter className="w-3 h-3" /> Filter
                    </div>
                    <select
                        className="bg-trade-background border border-trade-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-trade-primary"
                        value={assetFilter}
                        onChange={(e) => setAssetFilter(e.target.value)}
                    >
                        <option value="ALL">All Symbols</option>
                        <option value="EURUSD">EURUSD</option>
                        <option value="XAUUSD">XAUUSD</option>
                    </select>
                    {/* Placeholder for Date Filter */}
                    <select
                        className="bg-trade-background border border-trade-border rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-trade-primary"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        disabled
                    >
                        <option value="ALL">All Time</option>
                        <option value="MONTH">This Month</option>
                    </select>
                </div>
            </div>

            {/* Key Metrics */}
            <KeyMetrics metrics={metrics} />

            {/* Charts Section */}
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                    <EquityCurveChart data={equityCurve} />
                </div>
                <div>
                    <DrawdownChart data={equityCurve} />
                </div>
            </div>

            <div className="text-center text-xs text-trade-text-muted pt-8">
                Generated at {new Date().toLocaleString()} • {filteredLogs.length} Records Processed
            </div>
        </div>
    );
}
