'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Session, HistoryLog, TradeLog } from '@/types';
import TopNavigation from '@/components/TopNavigation';
import { runMonteCarloSimulation, MonteCarloParams, SimulationResult, SimulationStats } from '@/lib/simulation';
import { Card, CardContent, CardHeader, CardTitle, Input, Label, Button } from '@/components/ui/common';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function MonteCarloClient({ session, initialLogs }: { session: Session, initialLogs: HistoryLog[] }) {
    // 1. Calculate Historical Stats for Defaults
    const historicalStats = useMemo(() => {
        const trades = initialLogs.filter(l => l.type === 'TRADE') as TradeLog[];
        if (trades.length === 0) {
            return {
                winRate: 50,
                avgWin: 100,
                avgLoss: 100,
                risk: 1,
                count: 100
            };
        }

        let wins = 0;
        let totalWinAmt = 0;
        let totalLossAmt = 0;
        let lossCount = 0;

        trades.forEach(t => {
            const p = t.results.totalNetProfit;
            if (p >= 0) {
                wins++;
                totalWinAmt += p;
            } else {
                lossCount++;
                totalLossAmt += Math.abs(p);
            }
        });

        return {
            winRate: (wins / trades.length) * 100,
            avgWin: wins > 0 ? totalWinAmt / wins : 0,
            avgLoss: lossCount > 0 ? totalLossAmt / lossCount : 0,
            risk: 1, // Default 1%
            count: trades.length
        };
    }, [initialLogs]);

    // 2. State for Parameters
    const [params, setParams] = useState<MonteCarloParams>({
        startBalance: session.initialBalance,
        numSimulations: 50,
        numTrades: 50, // Default to 50 trades lookahead
        winRate: 50,
        avgWin: 100,
        avgLoss: 100,
        riskPerTradeType: 'percent',
        riskPerTrade: 1
    });

    // Load defaults on mount
    useEffect(() => {
        setParams(prev => ({
            ...prev,
            winRate: Number(historicalStats.winRate.toFixed(1)),
            avgWin: Number(historicalStats.avgWin.toFixed(2)),
            avgLoss: Number(historicalStats.avgLoss.toFixed(2)),
            numTrades: historicalStats.count > 0 ? historicalStats.count : 50
        }));
    }, [historicalStats]);

    // 3. Simulation Results State
    const [simulationData, setSimulationData] = useState<{ results: SimulationResult[], stats: SimulationStats } | null>(null);

    // 4. Run Simulation Handler
    const handleRunSimulation = () => {
        const data = runMonteCarloSimulation(params);
        setSimulationData(data);
    };

    // Run once on load after params set
    useEffect(() => {
        if (historicalStats.count > 0) {
            // Defer slightly to allow params to update
            const timer = setTimeout(() => {
                setSimulationData(runMonteCarloSimulation({
                    ...params,
                    winRate: Number(historicalStats.winRate.toFixed(1)),
                    avgWin: Number(historicalStats.avgWin.toFixed(2)),
                    avgLoss: Number(historicalStats.avgLoss.toFixed(2)),
                    numTrades: historicalStats.count > 0 ? historicalStats.count : 50
                }));
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [historicalStats]);


    // Prepare Chart Data
    // We want to show multiple lines. Recharts needs an array of objects like { index: 0, sim1: 100, sim2: 105, ... }
    const chartData = useMemo(() => {
        if (!simulationData) return [];

        const data: any[] = [];
        const numPoints = params.numTrades + 1; // +1 for start

        for (let i = 0; i < numPoints; i++) {
            const point: any = { index: i };
            simulationData.results.forEach((res, simIndex) => {
                // Limit to first 20 simulations for performance in chart if massive
                if (simIndex < 50) {
                    point[`sim_${simIndex}`] = res.equityCurve[i];
                }
            });
            // Try to add median?
            data.push(point);
        }
        return data;
    }, [simulationData, params.numTrades]);

    return (
        <div className="flex flex-col h-full bg-trade-bg text-trade-text">
            <TopNavigation session={session}>
                <div className="flex items-center gap-2 border-l border-trade-border pl-4 ml-4">
                    <span className="text-sm font-semibold text-trade-text-primary">Monte Carlo Simulation</span>
                </div>
            </TopNavigation>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Configuration Panel */}
                <aside className="w-full md:w-[300px] bg-trade-surface border-r border-trade-border p-4 flex flex-col gap-6 overflow-y-auto z-10">
                    <div>
                        <h3 className="text-xs font-bold text-trade-text-secondary uppercase tracking-wider mb-4">Parameters</h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <Label className="text-xs text-trade-text-secondary">Start Balance</Label>
                                <Input
                                    type="number"
                                    value={params.startBalance}
                                    onChange={e => setParams({ ...params, startBalance: Number(e.target.value) })}
                                    className="h-8 bg-trade-bg border-trade-border"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-trade-text-secondary">Number of Trades</Label>
                                <Input
                                    type="number"
                                    value={params.numTrades}
                                    onChange={e => setParams({ ...params, numTrades: Number(e.target.value) })}
                                    className="h-8 bg-trade-bg border-trade-border"
                                />
                            </div>
                            <div className="pt-2 border-t border-trade-border/50">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-trade-text-secondary">Win Rate (%)</Label>
                                    <Input
                                        type="number"
                                        value={params.winRate}
                                        onChange={e => setParams({ ...params, winRate: Number(e.target.value) })}
                                        className="h-8 bg-trade-bg border-trade-border"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-trade-text-secondary">Avg Win ($)</Label>
                                <Input
                                    type="number"
                                    value={params.avgWin}
                                    onChange={e => setParams({ ...params, avgWin: Number(e.target.value) })}
                                    className="h-8 bg-trade-bg border-trade-border"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs text-trade-text-secondary">Avg Loss ($)</Label>
                                <Input
                                    type="number"
                                    value={params.avgLoss}
                                    onChange={e => setParams({ ...params, avgLoss: Number(e.target.value) })}
                                    className="h-8 bg-trade-bg border-trade-border"
                                />
                            </div>
                            <div className="pt-2 border-t border-trade-border/50">
                                <div className="space-y-1.5">
                                    <Label className="text-xs text-trade-text-secondary">Risk Mode</Label>
                                    <select
                                        value={params.riskPerTradeType}
                                        onChange={e => setParams({ ...params, riskPerTradeType: e.target.value as any })}
                                        className="w-full h-8 bg-trade-bg border border-trade-border rounded px-2 text-xs focus:outline-none focus:border-trade-primary"
                                    >
                                        <option value="percent">Percent Risk (%)</option>
                                        <option value="fixed">Fixed Risk (Avg Loss)</option>
                                    </select>
                                </div>
                                {params.riskPerTradeType === 'percent' && (
                                    <div className="space-y-1.5 mt-2">
                                        <Label className="text-xs text-trade-text-secondary">Risk Per Trade (%)</Label>
                                        <Input
                                            type="number"
                                            value={params.riskPerTrade}
                                            onChange={e => setParams({ ...params, riskPerTrade: Number(e.target.value) })}
                                            className="h-8 bg-trade-bg border-trade-border"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <Button
                        onClick={handleRunSimulation}
                        className="w-full bg-trade-primary hover:bg-trade-primary-hover text-white font-medium"
                    >
                        Run Simulation
                    </Button>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
                    {/* Stats Grid */}
                    {simulationData && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <StatsCard label="Median Balance" value={`$${simulationData.stats.medianBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subLabel="50th Percentile" />
                            <StatsCard label="Safety Floor (P05)" value={`$${simulationData.stats.p05Balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subLabel="Worst 5% Outcome" highlight={simulationData.stats.p05Balance < params.startBalance} />
                            <StatsCard label="Max Drawdown (P95)" value={`${simulationData.stats.maxDrawdownP95.toFixed(2)}%`} subLabel="Expected Worst Case" />
                            <StatsCard label="Ruined Probability" value={`${simulationData.stats.ruinProbability.toFixed(1)}%`} subLabel="Chance of Blowout" highlight={simulationData.stats.ruinProbability > 0} />
                        </div>
                    )}

                    {/* Equity Map Chart */}
                    <Card className="flex flex-col h-[500px] border border-trade-border bg-trade-surface shadow-none">
                        <CardHeader className="py-3 px-4 border-b border-trade-border flex flex-row items-center justify-between">
                            <CardTitle className="text-xs uppercase font-bold tracking-wider text-trade-text-secondary">Monte Carlo Equity Trails ({params.numSimulations} Sims)</CardTitle>
                        </CardHeader>
                        <div className="flex-1 w-full min-h-0 p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.1} />
                                    <XAxis
                                        dataKey="index"
                                        type="number"
                                        domain={[0, params.numTrades]}
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#64748b"
                                        fontSize={10}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                        domain={['auto', 'auto']}
                                    />

                                    {simulationData && (() => {
                                        // Calculate global min/max for color scaling
                                        const values = simulationData.results.map(r => r.finalBalance);
                                        const min = Math.min(...values);
                                        const max = Math.max(...values);
                                        const range = max - min;

                                        return simulationData.results.slice(0, 50).map((res, i) => {
                                            // Map performance to Hue (0 = Red/Worst, 240 = Blue/Best)
                                            // Or 280 for Purple. Let's do 0 -> 240 for a nice spread.
                                            const normalized = range === 0 ? 0.5 : (res.finalBalance - min) / range;
                                            // Use 0 (Red) to 200 (Blue-ish) or 270 (Purple)
                                            // For financial, maybe Red (0) -> Yellow (60) -> Green (120)? 
                                            // User asked for "Rainbow", so let's go full spectrum: Red -> Violet
                                            // Red(0) -> Violet(270)
                                            const hue = Math.floor(normalized * 270);

                                            return (
                                                <Line
                                                    key={i}
                                                    type="monotone"
                                                    dataKey={`sim_${i}`}
                                                    stroke={`hsl(${hue}, 80%, 50%)`}
                                                    strokeWidth={1}
                                                    dot={false}
                                                    strokeOpacity={0.6}
                                                    isAnimationActive={false}
                                                />
                                            );
                                        })
                                    })()}
                                    <ReferenceLine y={params.startBalance} stroke="#64748b" strokeDasharray="3 3" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <div className="text-center text-[10px] text-trade-text-muted/50 font-mono py-4">
                        MONTE CARLO MODULE // {new Date().toISOString().split('T')[0]} // {session.id}
                    </div>
                </main>
            </div>
        </div>
    );
}

function StatsCard({ label, value, subLabel, highlight }: { label: string, value: string, subLabel?: string, highlight?: boolean }) {
    return (
        <Card className="border border-trade-border bg-trade-surface shadow-none rounded-[4px]">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center h-full">
                <span className="text-[10px] font-bold text-trade-text-secondary uppercase tracking-wider mb-1">{label}</span>
                <span className={`text-xl md:text-2xl font-mono font-medium ${highlight ? 'text-rose-500' : 'text-trade-primary'}`}>
                    {value}
                </span>
                {subLabel && <span className="text-[10px] text-trade-text-muted mt-1">{subLabel}</span>}
            </CardContent>
        </Card>
    )
}
