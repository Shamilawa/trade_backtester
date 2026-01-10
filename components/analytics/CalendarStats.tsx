'use client';

import React, { useMemo, useState } from 'react';
import { HistoryLog, TradeLog } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarStatsProps {
    logs: HistoryLog[];
}

interface DayStats {
    date: Date;
    pnl: number;
    trades: number;
    wins: number;
    totalR: number;
    hasTrades: boolean;
}

interface WeekStats {
    weekNumber: number;
    pnl: number;
    trades: number;
    daysTraded: number;
}

export default function CalendarStats({ logs }: CalendarStatsProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const tradeLogs = useMemo(() => {
        return logs.filter(l => l.type === 'TRADE') as TradeLog[];
    }, [logs]);

    // Calendar Logic
    const { calendarDays, weeklyStats } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        // 0 = Sunday, 1 = Monday...
        const startDayOfWeek = firstDay.getDay();

        // Generate days array
        const days: (DayStats | null)[] = [];

        // Pad start with nulls
        for (let i = 0; i < startDayOfWeek; i++) {
            days.push(null);
        }

        // Fill days
        for (let d = 1; d <= lastDay.getDate(); d++) {
            const date = new Date(year, month, d);
            const dayTrades = tradeLogs.filter(l => {
                const logDate = new Date(l.date);
                return logDate.getFullYear() === year &&
                    logDate.getMonth() === month &&
                    logDate.getDate() === d;
            });

            if (dayTrades.length > 0) {
                const pnl = dayTrades.reduce((sum, t) => sum + t.results.totalNetProfit, 0);
                const trades = dayTrades.length;
                const wins = dayTrades.filter(t => t.results.totalNetProfit > 0).length;

                // Calculate R
                const totalR = dayTrades.reduce((sum, t) => {
                    const risk = t.results.initialRiskAmount > 0 ? t.results.initialRiskAmount : 1;
                    return sum + (t.results.totalNetProfit / risk);
                }, 0);

                days.push({
                    date,
                    pnl,
                    trades,
                    wins,
                    totalR,
                    hasTrades: true
                });
            } else {
                days.push({
                    date,
                    pnl: 0,
                    trades: 0,
                    wins: 0,
                    totalR: 0,
                    hasTrades: false
                });
            }
        }

        // Calculate Weekly Stats from the days array
        const weeks: WeekStats[] = [];
        let currentWeekStats = { pnl: 0, trades: 0, daysTraded: 0 };
        let weekHasDays = false;

        for (let i = 0; i < days.length; i++) {
            const day = days[i];
            // Start of new week row (every 7 days)
            if (i > 0 && i % 7 === 0) {
                if (weekHasDays) {
                    weeks.push({ ...currentWeekStats, weekNumber: weeks.length + 1 });
                }
                currentWeekStats = { pnl: 0, trades: 0, daysTraded: 0 };
                weekHasDays = false;
            }

            if (day && day.hasTrades) {
                currentWeekStats.pnl += day.pnl;
                currentWeekStats.trades += day.trades;
                currentWeekStats.daysTraded += 1;
            }
            if (day) weekHasDays = true;
        }
        // Push last week
        if (weekHasDays) {
            weeks.push({ ...currentWeekStats, weekNumber: weeks.length + 1 });
        }

        return { calendarDays: days, weeklyStats: weeks };

    }, [currentDate, tradeLogs]);

    const stats = useMemo(() => {
        const cleanDays = calendarDays.filter(d => d !== null) as DayStats[];
        const totalPnl = cleanDays.reduce((acc, d) => acc + d.pnl, 0);
        const activeDays = cleanDays.filter(d => d.hasTrades).length;
        return { totalPnl, activeDays };
    }, [calendarDays]);

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
        <div className="flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                        <h2 className="text-lg font-semibold text-trade-text-primary">{monthName}</h2>
                        <button onClick={goToToday} className="px-2 py-1 text-xs font-medium text-trade-text-secondary bg-trade-surface hover:bg-trade-border rounded transition-colors">
                            This month
                        </button>
                    </div>
                </div>
                <div className="flex items-center space-x-2 text-trade-text-secondary">
                    <span className="text-xs font-mono">Monthly Stats: <span className={stats.totalPnl >= 0 ? "text-emerald-500" : "text-rose-500"}>${stats.totalPnl.toLocaleString()}</span> • {stats.activeDays} days</span>
                    <div className="flex items-center bg-trade-surface rounded border border-trade-border">
                        <button onClick={prevMonth} className="p-1 hover:bg-trade-border rounded-l text-trade-text-secondary"><ChevronLeft size={16} /></button>
                        <div className="w-[1px] h-4 bg-trade-border"></div>
                        <button onClick={nextMonth} className="p-1 hover:bg-trade-border rounded-r text-trade-text-secondary"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 overflow-x-auto">
                {/* Calendar Grid Container */}
                <div>
                    {/* Days Header */}
                    <div className="grid gap-3 mb-3" style={{ gridTemplateColumns: 'repeat(7, 130px)' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-trade-text-muted border border-trade-border rounded-md py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days Grid */}
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(7, 130px)' }}>
                        {calendarDays.map((day, index) => {
                            // Padding days
                            if (!day) return <div key={`pad-${index}`} className="w-[130px] h-[130px] border border-trade-border rounded-md" />;

                            const isPositive = day.pnl >= 0;
                            const isTradeDay = day.hasTrades;
                            const profitColor = isPositive ? 'text-emerald-500' : 'text-rose-500';

                            // User requested simpler background colors in previous edits
                            const bgColor = isTradeDay
                                ? (isPositive ? 'bg-emerald-500/10' : 'bg-rose-500/10')
                                : 'bg-gray-200/30';

                            const borderColor = isTradeDay
                                ? (isPositive ? 'border-emerald-500/20' : 'border-rose-500/20')
                                : 'border-gray-200';

                            const winRate = day.trades > 0 ? (day.wins / day.trades) * 100 : 0;

                            return (
                                <div key={day.date.toISOString()} className={cn(
                                    "relative w-[130px] h-[130px] p-2 flex flex-col justify-between items-end border rounded-lg select-none transition-colors",
                                    bgColor,
                                    borderColor
                                )}>
                                    <div className="text-right text-xs text-trade-text-muted">
                                        {day.date.getDate()}
                                    </div>

                                    {isTradeDay ? (
                                        <div className="flex flex-col items-center justify-center space-y-1 w-full">
                                            <span className={cn("text-2xl font-bold", profitColor)}>
                                                ${Math.abs(day.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                            <div className="flex flex-col items-center text-[10px] text-trade-text-secondary font-mono space-y-0.5">
                                                <span className="text-xs">{day.trades} trades</span>
                                                <span className={cn(winRate >= 50 ? 'text-emerald-500' : 'text-rose-500', 'text-xs')}>
                                                    {winRate.toFixed(0)}% WR
                                                </span>
                                                <span className="text-xs">{day.totalR.toFixed(1)}R</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex-1"></div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Weekly Stats Side Panel */}
                {/* 
                    Header height = approx 34px (py-2 + border + text-xs)
                    mb-3 = 12px
                    Total top offset = 46px to align with first row of 130px cells
                */}
                <div className="w-full lg:w-48 flex flex-col gap-3 pt-[46px]">
                    {weeklyStats.map((week, idx) => (
                        <div key={idx} className="bg-trade-surface border border-trade-border rounded-lg p-3 flex flex-col items-center justify-center space-y-1 h-[130px]">
                            <span className="text-xs text-trade-text-muted font-medium">Week {week.weekNumber}</span>
                            <span className={cn("text-lg font-bold", week.pnl >= 0 ? "text-emerald-500" : "text-rose-500")}>
                                ${Math.abs(week.pnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-[10px] text-trade-text-secondary font-mono">
                                {week.daysTraded} active days
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
