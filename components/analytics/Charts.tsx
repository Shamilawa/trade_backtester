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
    ReferenceLine
} from 'recharts';
import { ChartDataPoint } from '@/lib/analytics';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/common';

interface EquityCurveProps {
    data: ChartDataPoint[];
}

export function EquityCurveChart({ data }: EquityCurveProps) {
    return (
        <Card className="bg-trade-surface border-trade-border h-[400px] flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-trade-text-primary">Equity Curve</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="tradeNumber"
                            stroke="#888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                            domain={['auto', 'auto']}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Balance']}
                            labelFormatter={(label) => `Trade #${label}`}
                        />
                        <ReferenceLine y={data[0]?.balance} stroke="#555" strokeDasharray="3 3" />
                        <Line
                            type="monotone"
                            dataKey="balance"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 6, fill: '#10b981' }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}

export function DrawdownChart({ data }: EquityCurveProps) {
    return (
        <Card className="bg-trade-surface border-trade-border h-[400px] flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle className="text-trade-text-primary">Drawdown</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 w-full min-h-0 pl-0">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis
                            dataKey="tradeNumber"
                            stroke="#888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1e1e1e', borderColor: '#333', color: '#fff' }}
                            itemStyle={{ color: '#ff4444' }}
                            formatter={(value: any) => [`$${Math.abs(Number(value)).toFixed(2)}`, 'Drawdown']}
                            labelFormatter={(label) => `Trade #${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="drawdown"
                            stroke="#ef4444"
                            fill="#ef4444"
                            fillOpacity={0.2}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
