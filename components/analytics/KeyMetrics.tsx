import React from 'react';
import { AnalyticsMetrics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/common';

interface KeyMetricsProps {
    metrics: AnalyticsMetrics;
}

export function KeyMetrics({ metrics }: KeyMetricsProps) {
    const isProfitable = metrics.netProfit >= 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-px bg-trade-border border border-trade-border">
            {/* Net Profit */}
            <MetricBox
                label="Net Profit"
                value={`$${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                valueClassName={isProfitable ? "text-trade-success" : "text-trade-loss"}
                colSpan={2}
            />
            {/* Win Rate */}
            <MetricBox
                label="Win Rate"
                value={`${metrics.winRate.toFixed(1)}%`}
                subValue={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
            />
            {/* Profit Factor */}
            <MetricBox
                label="Profit Factor"
                value={metrics.profitFactor.toFixed(2)}
            />
            {/* Drawdown */}
            <MetricBox
                label="Max Drawdown"
                value={`$${metrics.maxDrawdown.toFixed(2)}`}
                valueClassName="text-trade-loss"
            />
            {/* Expectancy */}
            <MetricBox
                label="Expectancy"
                value={`$${metrics.expectancy.toFixed(2)}`}
            />
        </div>
    );
}

function MetricBox({
    label,
    value,
    subValue,
    valueClassName,
    colSpan = 1
}: {
    label: string,
    value: string,
    subValue?: string,
    valueClassName?: string,
    colSpan?: number
}) {
    return (
        <div className={cn(
            "bg-trade-surface p-4 flex flex-col justify-center",
            colSpan === 2 ? "col-span-2" : "col-span-1"
        )}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-trade-text-muted mb-1">{label}</span>
            <div className={cn("text-xl font-mono font-medium tracking-tight", valueClassName || "text-trade-text-primary")}>
                {value}
            </div>
            {subValue && (
                <span className="text-[10px] font-mono text-trade-text-secondary mt-1">{subValue}</span>
            )}
        </div>
    )
}
