import React from 'react';
import { AnalyticsMetrics } from '@/lib/analytics';
import { ArrowUpRight, ArrowDownRight, Activity, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/common';

interface KeyMetricsProps {
    metrics: AnalyticsMetrics;
}

export function KeyMetrics({ metrics }: KeyMetricsProps) {
    const isProfitable = metrics.netProfit >= 0;

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <MetricCard
                title="Net Profit"
                value={`$${metrics.netProfit.toFixed(2)}`}
                icon={isProfitable ? <ArrowUpRight className="w-4 h-4 text-green-500" /> : <ArrowDownRight className="w-4 h-4 text-red-500" />}
                trend={isProfitable ? "positive" : "negative"}
            />
            <MetricCard
                title="Profit Factor"
                value={metrics.profitFactor.toFixed(2)}
                icon={<Activity className="w-4 h-4 text-blue-500" />}
            />
            <MetricCard
                title="Win Rate"
                value={`${metrics.winRate.toFixed(1)}%`}
                subValue={`${metrics.winningTrades}W / ${metrics.losingTrades}L`}
                icon={<TrendingUp className="w-4 h-4 text-purple-500" />}
            />
            <MetricCard
                title="Max Drawdown"
                value={`$${metrics.maxDrawdown.toFixed(2)}`}
                icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
                trend="negative"
            />
            <MetricCard
                title="Expectancy"
                value={`$${metrics.expectancy.toFixed(2)}`}
                subValue="per trade"
                icon={<Activity className="w-4 h-4 text-indigo-500" />}
            />
        </div>
    );
}

function MetricCard({ title, value, subValue, icon, trend }: { title: string, value: string, subValue?: string, icon: React.ReactNode, trend?: 'positive' | 'negative' }) {
    return (
        <Card className="bg-trade-surface border-trade-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
                <CardTitle className="text-sm font-medium text-trade-text-secondary">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className={cn("text-2xl font-bold", trend === 'positive' ? "text-green-500" : trend === 'negative' ? "text-red-500" : "text-trade-text-primary")}>
                    {value}
                </div>
                {subValue && <p className="text-xs text-trade-text-muted mt-1">
                    {subValue}
                </p>}
            </CardContent>
        </Card>
    )
}
