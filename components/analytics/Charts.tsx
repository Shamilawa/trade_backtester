'use client';

import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { ChartDataPoint } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/common';

interface EquityCurveProps {
    data: ChartDataPoint[];
    className?: string; // Added className
}

export function EquityCurveChart({ data, className }: EquityCurveProps) {
    const [metric, setMetric] = React.useState<'balance' | 'cumulativeNetProfit' | 'cumulativePercentageGain' | 'cumulativeR'>('balance');

    const config = {
        balance: {
            label: 'Balance',
            dataKey: 'balance',
            stroke: '#10b981',
            fill: '#10b981',
            tickFormatter: (val: number) => `$${val.toLocaleString()}`,
            tooltipFormatter: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        cumulativeNetProfit: {
            label: 'Cum. Profit ($)',
            dataKey: 'cumulativeNetProfit',
            stroke: '#3b82f6',
            fill: '#3b82f6',
            tickFormatter: (val: number) => `$${val.toLocaleString()}`,
            tooltipFormatter: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        },
        cumulativePercentageGain: {
            label: 'Cum. Gain (%)',
            dataKey: 'cumulativePercentageGain',
            stroke: '#8b5cf6',
            fill: '#8b5cf6',
            tickFormatter: (val: number) => `${val.toFixed(1)}%`,
            tooltipFormatter: (val: number) => `${val.toFixed(2)}%`
        },
        cumulativeR: {
            label: 'Cum. R',
            dataKey: 'cumulativeR',
            stroke: '#f59e0b',
            fill: '#f59e0b',
            tickFormatter: (val: number) => `${val.toFixed(1)}R`,
            tooltipFormatter: (val: number) => `${val.toFixed(2)}R`
        }
    };

    const currentConfig = config[metric];
    const gradientId = `color${metric}`;

    return (
        <Card className={cn("flex flex-col h-[400px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-[6px]", className)}>
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50 flex flex-row items-center justify-between">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">Equity Curve</CardTitle>
                <div className="relative">
                    <select
                        value={metric}
                        onChange={(e) => setMetric(e.target.value as any)}
                        className="appearance-none bg-trade-bg border border-trade-border text-xs font-mono text-trade-text-primary rounded px-2 py-1 pr-6 focus:outline-none focus:border-trade-primary cursor-pointer hover:border-trade-text-secondary/50 transition-colors"
                    >
                        <option value="balance">Balance</option>
                        <option value="cumulativeNetProfit">Cum. Gain ($)</option>
                        <option value="cumulativePercentageGain">Cum. Gain (%)</option>
                        <option value="cumulativeR">Cum. R</option>
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-trade-text-muted">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="m6 9 6 6 6-6" />
                        </svg>
                    </div>
                </div>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 20, right: 15, left: 5, bottom: 10 }}>
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={currentConfig.stroke} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={currentConfig.stroke} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="tradeNumber"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={40}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                            dy={5}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={currentConfig.tickFormatter}
                            domain={['auto', 'auto']}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                            dx={-5}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(15, 23, 42, 0.9)', // trade-surface with opacity
                                borderColor: '#1e293b',
                                color: '#f8fafc',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontFamily: 'var(--font-mono)',
                                backdropFilter: 'blur(8px)',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                            }}
                            itemStyle={{ color: currentConfig.stroke }}
                            formatter={(value: any) => [currentConfig.tooltipFormatter(Number(value)), currentConfig.label]}
                            labelFormatter={(label) => `Trade #${label}`}
                            cursor={{ stroke: '#334155', strokeWidth: 1, strokeDasharray: '2 2' }}
                        />
                        <Area
                            type="monotone"
                            dataKey={currentConfig.dataKey}
                            stroke={currentConfig.stroke}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            activeDot={{ r: 4, fill: currentConfig.stroke, stroke: '#fff', strokeWidth: 2 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function DrawdownChart({ data, className }: EquityCurveProps) {
    return (
        <Card className={cn("flex flex-col h-[300px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-[6px]", className)}>
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">Drawdown</CardTitle>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="tradeNumber"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={40}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                            dy={5}
                            label={{
                                value: 'Trade #',
                                position: 'insideBottomRight',
                                offset: -5,
                                fill: '#475569',
                                fontSize: 10,
                                fontFamily: 'var(--font-mono)'
                            }}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${Math.abs(value)}`}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                            dx={-5}
                            label={{
                                value: 'DD ($)',
                                angle: -90,
                                position: 'insideLeft',
                                fill: '#475569',
                                fontSize: 10,
                                fontFamily: 'var(--font-mono)',
                                style: { textAnchor: 'middle' }
                            }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                            itemStyle={{ color: '#f43f5e' }}
                            formatter={(value: any) => [`$${Math.abs(Number(value)).toFixed(2)}`, 'Drawdown']}
                            cursor={{ stroke: '#334155', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="drawdown"
                            stroke="#f43f5e"
                            strokeWidth={1.5}
                            fill="#f43f5e"
                            fillOpacity={0.1}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

interface PnLByTradeProps {
    data: any[];
    className?: string;
}

export function PnLByTradeChart({ data, className }: PnLByTradeProps) {
    return (
        <Card className={cn("flex flex-col h-[300px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-[6px]", className)}>
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">P&L by Trade</CardTitle>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <BarChart width={600} height={300} data={data} margin={{ top: 10, right: 10, left: -5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.1} />
                    <XAxis
                        dataKey="tradeNumber"
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                        tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                        dy={5}
                        label={{
                            value: 'Trade #',
                            position: 'insideBottomRight',
                            offset: -5,
                            fill: '#475569',
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)'
                        }}
                    />
                    <YAxis
                        stroke="#64748b"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${value}`}
                        tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                        dx={-5}
                        label={{
                            value: 'P&L ($)',
                            angle: -90,
                            position: 'insideLeft',
                            fill: '#475569',
                            fontSize: 10,
                            fontFamily: 'var(--font-mono)',
                            style: { textAnchor: 'middle' }
                        }}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Net Profit']}
                        labelFormatter={(label) => `Trade #${label}`}
                    />
                    <Bar dataKey="pnl">
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#f43f5e'} />
                        ))}
                    </Bar>
                </BarChart>
            </div>
        </Card >
    );
}

interface WinLossDistributionProps {
    data: any[];
    className?: string; // Added className
}

export function WinLossDistributionChart({ data, className }: WinLossDistributionProps) {
    return (
        <Card className={cn("flex flex-col h-[300px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-[6px]", className)}>
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">P&L Distribution</CardTitle>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="range"
                            stroke="#64748b"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                            interval={0}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar dataKey="count">
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    )
}
