'use client';

import React from 'react';
import { Card, CardContent } from './ui/common';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { PieChart as PieChartIcon } from 'lucide-react';

interface WinRateCardProps {
    winRate: number;
    winningTrades: number;
    losingTrades: number;
}

export default function WinRateCard({ winRate, winningTrades, losingTrades }: WinRateCardProps) {
    const data = [
        { name: 'Wins', value: winningTrades, color: '#10b981' },
        { name: 'Losses', value: losingTrades, color: '#f43f5e' }
    ];

    return (
        <Card className="relative overflow-hidden border-trade-border bg-trade-surface/20 hover:bg-trade-surface/40 transition-colors backdrop-blur-sm shadow-none rounded-[6px]">
            <CardContent className="p-3 h-full flex flex-col justify-between">
                <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-trade-text-muted">Win Rate</span>
                    <div className="p-1.5 rounded-full bg-trade-bg border border-trade-border/50 shadow-sm">
                        <PieChartIcon className="w-4 h-4 text-purple-400" />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-2 flex-1 px-1">
                    {/* Donut Chart */}
                    <div className="relative h-14 w-14 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={20}
                                    outerRadius={28}
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
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-trade-text-primary">
                                {winRate.toFixed(0)}%
                            </span>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex flex-col gap-1.5 justify-center flex-1 ml-10">
                        <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#10b981]" />
                            <div className="flex gap-1">
                                <span className="text-[11px] font-mono font-bold text-trade-text-primary leading-none">{winningTrades}</span>
                                <span className="text-[9px] text-trade-text-muted leading-none mt-0.5">Winners</span>
                            </div>
                        </div>
                        <div className="flex items-start gap-2">
                            <div className="w-2.5 h-2.5 rounded-[2px] bg-[#f43f5e]" />
                            <div className="flex gap-1">
                                <span className="text-[11px] font-mono font-bold text-trade-text-primary leading-none">{losingTrades}</span>
                                <span className="text-[9px] text-trade-text-muted leading-none mt-0.5">Losers</span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
