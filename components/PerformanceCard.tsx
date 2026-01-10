'use client';

import React from 'react';
import { Card, CardContent } from './ui/common';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Scale } from 'lucide-react';

interface PerformanceCardProps {
    averageWin: number;
    averageLoss: number;
    averageRR: number;
}

export default function PerformanceCard({ averageWin, averageLoss, averageRR }: PerformanceCardProps) {
    // Use absolute values for the chart to show magnitude comparison
    const absAvgLoss = Math.abs(averageLoss);
    const total = averageWin + absAvgLoss;

    // Avoid division by zero for the chart if no trades
    const data = total > 0 ? [
        { name: 'Avg Win', value: averageWin, color: '#10b981' },
        { name: 'Avg Loss', value: absAvgLoss, color: '#f43f5e' }
    ] : [
        { name: 'No Data', value: 1, color: '#2b2e3b' }
    ];

    return (
        <Card className="col-span-2 relative overflow-hidden border-trade-border bg-trade-surface/20 hover:bg-trade-surface/40 transition-colors backdrop-blur-sm shadow-none rounded-[6px]">
            <CardContent className="relative p-3 h-full flex flex-col justify-between">
                {/* Header: Title + Icon */}
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-trade-text-muted">Performance</span>
                    <div className="p-1.5 rounded-full bg-trade-bg border border-trade-border/50 shadow-sm">
                        <Scale className="w-4 h-4 text-blue-400" />
                    </div>
                </div>

                {/* Content: Horizontal Layout */}
                <div className="relative flex items-center gap-x-16">
                    {/* Left: RR Metric */}
                    <div className="flex flex-col absolute bottom-[10px]">
                        <div className="text-2xl font-mono font-bold text-trade-text-primary tracking-tight">
                            {averageRR.toFixed(2)}R
                        </div>
                        <span className="text-[10px] font-medium text-trade-text-muted">Average R:R</span>
                    </div>

                    {/* Right: Chart + Legend */}
                    <div className="flex items-center gap-4 absolute left-28 bottom-[10px]">
                        {/* Donut Chart */}
                        <div className="relative h-12 w-12 flex-shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={data}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={16}
                                        outerRadius={24}
                                        startAngle={90}
                                        endAngle={-270}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Legend */}
                        <div className="flex flex-col gap-1 justify-center">
                            <div className="flex items-start gap-2">
                                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#10b981] mt-0.5" />
                                <div className="flex gap-1.5 items-baseline">
                                    <span className="text-[13px] font-mono font-bold text-trade-text-primary leading-none">
                                        ${averageWin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] text-trade-text-muted leading-none">Avg Win</span>
                                </div>
                            </div>
                            <div className="flex items-start gap-2">
                                <div className="w-2.5 h-2.5 rounded-[2px] bg-[#f43f5e] mt-0.5" />
                                <div className="flex gap-1.5 items-baseline">
                                    <span className="text-[13px] font-mono font-bold text-trade-text-primary leading-none">
                                        ${Math.abs(averageLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-[10px] text-trade-text-muted leading-none">Avg Loss</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
