import React from 'react';
import { AnalyticsMetrics } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/common';
import {
    Wallet,
    PieChart,
    Scale,
    Activity,
    Target,
    TrendingUp,
    TrendingDown
} from 'lucide-react';

interface KeyMetricsProps {
    metrics: AnalyticsMetrics;
}

export function KeyMetrics({ metrics }: KeyMetricsProps) {
    const isProfitable = metrics.netProfit >= 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* Net Profit */}
            <MetricCard
                label="Net Profit"
                value={`$${metrics.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                subValue={isProfitable ? "Profitable" : "Loss"}
                subValueColor={isProfitable ? "text-trade-success" : "text-trade-loss"}
                icon={<Wallet className="w-4 h-4 text-trade-primary" />}
                highlight
                valueClassName={isProfitable ? "text-trade-success" : "text-trade-loss"}
            />

            {/* Win Rate */}
            <MetricCard
                label="Win Rate"
                value={`${metrics.winRate.toFixed(1)}%`}
                subValue={`${metrics.winningTrades}W - ${metrics.losingTrades}L`}
                icon={<PieChart className="w-4 h-4 text-purple-400" />}
            />

            {/* Profit Factor */}
            <MetricCard
                label="Profit Factor"
                value={metrics.profitFactor.toFixed(2)}
                subValue="Gross Ratio"
                icon={<Scale className="w-4 h-4 text-orange-400" />}
            />

            {/* Drawdown */}
            <MetricCard
                label="Max Drawdown"
                value={`$${metrics.maxDrawdown.toFixed(2)}`}
                subValue="Peak to Valley"
                subValueColor="text-trade-loss"
                icon={<Activity className="w-4 h-4 text-trade-loss" />}
            />

            {/* Expectancy */}
            <MetricCard
                label="Expectancy"
                value={`$${metrics.expectancy.toFixed(2)}`}
                subValue="Per Trade"
                icon={<Target className="w-4 h-4 text-blue-400" />}
            />
        </div>
    );
}

function MetricCard({
    label,
    value,
    subValue,
    subValueColor = "text-trade-text-muted",
    icon,
    highlight = false,
    trend,
    indicatorColor,
    valueClassName
}: {
    label: string,
    value: string,
    subValue?: string,
    subValueColor?: string,
    icon: React.ReactNode,
    highlight?: boolean,
    trend?: 'up' | 'down' | 'neutral',
    indicatorColor?: string,
    valueClassName?: string
}) {
    return (
        <Card className={cn(
            "relative overflow-hidden border-trade-border bg-trade-surface/20 hover:bg-trade-surface/40 transition-colors backdrop-blur-sm shadow-none rounded-[6px]",
            highlight && "bg-trade-primary/5 border-trade-primary/20"
        )}>
            {indicatorColor && <div className={cn("absolute left-0 top-0 bottom-0 w-1", indicatorColor)} />}
            <CardContent className="p-3">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-trade-text-muted">{label}</span>
                    <div className="p-1.5 rounded-full bg-trade-bg border border-trade-border/50 shadow-sm">
                        {icon}
                    </div>
                </div>
                <div className="space-y-0.5">
                    <div className={cn("text-lg font-mono font-bold text-trade-text-primary tracking-tight", valueClassName)}>
                        {value}
                    </div>
                    {subValue && (
                        <div className={cn("text-[10px] font-medium flex items-center gap-1", subValueColor)}>
                            {trend === 'up' && <TrendingUp className="w-3 h-3" />}
                            {trend === 'down' && <TrendingDown className="w-3 h-3" />}
                            {subValue}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
