'use client';

import React from 'react';
import { HistoryLog, Session } from '@/types';
import { calculateAnalytics } from '@/utils/analytics';
import { Card, CardContent } from './ui/common';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Activity,
    PieChart,
    Scale,
    ArrowDownRight,
    ArrowUpRight
} from 'lucide-react';

interface AnalyticsCardsProps {
    history: HistoryLog[];
    session: Session | undefined;
}

export default function AnalyticsCards({ history, session }: AnalyticsCardsProps) {
    if (!session) return null;

    const metrics = calculateAnalytics(history, session.initialBalance);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">

            {/* Balance Card */}
            <MetricCard
                label="Balance"
                value={`$${metrics.balance.toFixed(2)}`}
                subValue={metrics.netProfit >= 0 ? `+${metrics.netProfit.toFixed(2)} (${metrics.totalPercentageGain.toFixed(2)}%)` : `${metrics.netProfit.toFixed(2)} (${metrics.totalPercentageGain.toFixed(2)}%)`}
                subValueColor={metrics.netProfit >= 0 ? 'text-trade-success' : 'text-trade-loss'}
                icon={<Wallet className="w-4 h-4 text-trade-primary" />}
                highlight
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
                subValue="Gross P/L Ratio"
                icon={<Scale className="w-4 h-4 text-orange-400" />}
                trend={metrics.profitFactor > 1.5 ? 'up' : metrics.profitFactor < 1 ? 'down' : 'neutral'}
            />

            {/* Max Drawdown */}
            <MetricCard
                label="Max Drawdown"
                value={`$${metrics.maxDrawdown.toFixed(2)}`}
                subValue={`${metrics.maxDrawdownPercent.toFixed(1)}%`}
                subValueColor="text-trade-loss"
                icon={<Activity className="w-4 h-4 text-trade-loss" />}
            />

            {/* Avg Win & Loss & RR Combined */}
            <Card className="col-span-2 relative overflow-hidden border-trade-border bg-trade-surface/20 hover:bg-trade-surface/40 transition-colors backdrop-blur-sm">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-trade-primary/50" />
                <CardContent className="p-3 h-full flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-trade-text-muted">Performance</span>
                        <div className="p-1.5 rounded-full bg-trade-bg border border-trade-border/50 shadow-sm">
                            <Scale className="w-4 h-4 text-blue-400" />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <div className="text-[11px] text-trade-text-muted mb-0.5 font-medium">Avg Win</div>
                            <div className="text-base font-mono font-bold text-trade-success">${metrics.averageWin.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-trade-text-muted mb-0.5 font-medium">Avg Loss</div>
                            <div className="text-base font-mono font-bold text-trade-loss">${metrics.averageLoss.toFixed(2)}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-trade-text-muted mb-0.5 font-medium">Avg R:R</div>
                            <div className="text-base font-mono font-bold text-trade-text-primary">{metrics.averageRR.toFixed(2)}R</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

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
    indicatorColor
}: {
    label: string,
    value: string,
    subValue?: string,
    subValueColor?: string,
    icon: React.ReactNode,
    highlight?: boolean,
    trend?: 'up' | 'down' | 'neutral',
    indicatorColor?: string
}) {
    return (
        <Card className={cn(
            "relative overflow-hidden border-trade-border bg-trade-surface/20 hover:bg-trade-surface/40 transition-colors backdrop-blur-sm",
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
                    <div className="text-lg font-mono font-bold text-trade-text-primary tracking-tight">
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
