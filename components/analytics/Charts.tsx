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
}

export function EquityCurveChart({ data }: EquityCurveProps) {
    return (
        <Card className="flex flex-col h-[400px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-lg">
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">Equity Curve</CardTitle>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="tradeNumber"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={40}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                            domain={['auto', 'auto']}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '4px', fontSize: '11px', fontFamily: 'var(--font-mono)' }}
                            itemStyle={{ color: '#10b981' }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Balance']}
                            labelFormatter={(label) => `Trade #${label}`}
                            cursor={{ stroke: '#334155', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#10b981"
                            strokeWidth={1.5}
                            fill="url(#colorBalance)"
                            activeDot={{ r: 4, fill: '#10b981', stroke: '#fff', strokeWidth: 1 }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

export function DrawdownChart({ data }: EquityCurveProps) {
    return (
        <Card className="flex flex-col h-[300px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-lg">
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">Drawdown</CardTitle>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                            dataKey="tradeNumber"
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            hide
                        />
                        <YAxis
                            stroke="#64748b"
                            fontSize={10}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${Math.abs(value)}`}
                            tick={{ fill: '#64748b', fontFamily: 'var(--font-mono)' }}
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

interface WinLossDistributionProps {
    data: any[];
}

export function WinLossDistributionChart({ data }: WinLossDistributionProps) {
    return (
        <Card className="flex flex-col h-[300px] border border-trade-border bg-trade-surface shadow-none rounded-none md:rounded-lg">
            <CardHeader className="py-3 px-4 border-b border-trade-border bg-trade-surface/50">
                <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">P&L Distribution</CardTitle>
            </CardHeader>
            <div className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
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
