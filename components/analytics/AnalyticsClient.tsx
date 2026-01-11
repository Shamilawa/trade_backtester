'use client';

import React, { useMemo, useState } from 'react';
import { Session, HistoryLog, TradeLog } from '@/types';
import { calculateEquityCurve, calculateMetrics, filterLogs } from '@/lib/analytics';
import { PnLByTradeChart, EquityCurveChart, DrawdownChart, WinLossDistributionChart, MonthByMonthChart } from './Charts';
import CalendarStats from './CalendarStats';
import TopNavigation from '@/components/TopNavigation';
import AnalyticsCards from '@/components/AnalyticsCards';
import RiskSimulationModal, { SimulationConfig } from './RiskSimulationModal';

export default function AnalyticsClient({ session, initialLogs }: { session: Session, initialLogs: HistoryLog[] }) {
    const [assetFilter, setAssetFilter] = useState<string>('ALL');
    const [dateRange, setDateRange] = useState<string>('ALL');

    // Simulation Mode State
    const [isSimulationMode, setIsSimulationMode] = useState(false);
    const [showSimulationModal, setShowSimulationModal] = useState(false);
    const [simulatedLogs, setSimulatedLogs] = useState<HistoryLog[]>([]);
    const [simulationConfig, setSimulationConfig] = useState<SimulationConfig | null>(null);

    const filteredLogs = useMemo(() => {
        const sourceLogs = isSimulationMode ? simulatedLogs : initialLogs;
        return filterLogs(sourceLogs, assetFilter === 'ALL' ? null : assetFilter)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [initialLogs, simulatedLogs, isSimulationMode, assetFilter]);

    const handleToggleSimulation = () => {
        if (!isSimulationMode) {
            setShowSimulationModal(true);
        } else {
            setIsSimulationMode(false);
            setSimulatedLogs([]);
            setSimulationConfig(null);
        }
    };

    const handleApplySimulation = (config: SimulationConfig) => {
        setSimulationConfig(config);

        const newLogs = initialLogs.map(log => {
            if (log.type !== 'TRADE') return log;

            const tradeLog = log as TradeLog;
            let originalRisk = 0;
            let targetRisk = 0;

            // 1. Determine Original Risk
            if (tradeLog.results.initialRiskAmount) {
                originalRisk = tradeLog.results.initialRiskAmount;
            } else if (tradeLog.input.riskCashAmount) {
                originalRisk = tradeLog.input.riskCashAmount;
            } else {
                originalRisk = tradeLog.input.accountBalance * (tradeLog.input.initialRiskPercent / 100);
            }

            if (originalRisk <= 0) return log;

            // 2. Determine Target Risk
            if (config.type === 'mapping') {
                let key = '';
                if (tradeLog.input.riskMode === 'cash' && tradeLog.input.riskCashAmount) {
                    key = `c_${tradeLog.input.riskCashAmount}`;
                } else if (tradeLog.input.initialRiskPercent) {
                    key = `p_${tradeLog.input.initialRiskPercent}`;
                }

                if (!key || config.mapping[key] === undefined) return log;

                const mappedValue = config.mapping[key];

                // Smart logic: if key was percent-based (p_1), mappedValue (0.5) implies 0.5% risk
                if (key.startsWith('p_')) {
                    targetRisk = tradeLog.input.accountBalance * (mappedValue / 100);
                } else {
                    // Key was cash-based (c_100), mappedValue (50) implies $50 risk
                    targetRisk = mappedValue;
                }

            } else {
                // Static Config
                if (config.unit === 'cash') {
                    targetRisk = config.value;
                } else {
                    // Static Percent
                    targetRisk = tradeLog.input.accountBalance * (config.value / 100);
                }
            }

            if (targetRisk === 0) return log;

            const ratio = targetRisk / originalRisk;

            // Deep clone to avoid mutating original
            const newLog = JSON.parse(JSON.stringify(tradeLog)) as TradeLog;

            // Adjust Financials
            newLog.results.totalNetProfit = tradeLog.results.totalNetProfit * ratio;
            newLog.results.initialRiskAmount = targetRisk;

            return newLog;
        });

        setSimulatedLogs(newLogs);
        setIsSimulationMode(true);
    };

    const metrics = useMemo(() => calculateMetrics(filteredLogs), [filteredLogs]);
    const equityCurve = useMemo(() => calculateEquityCurve(filteredLogs, session.initialBalance), [filteredLogs, session.initialBalance]);

    const pnlByTrade = useMemo(() => {
        return filteredLogs
            .filter(l => l.type === 'TRADE')
            .map((l, i) => ({
                tradeNumber: `#${i + 1}`,
                pnl: Number((l as TradeLog).results.totalNetProfit),
                fill: (l as TradeLog).results.totalNetProfit >= 0 ? '#10b981' : '#f43f5e'
            }));
    }, [filteredLogs]);

    const winLossDistribution = useMemo(() => {
        const trades = filteredLogs.filter(l => l.type === 'TRADE') as TradeLog[];
        if (trades.length === 0) return [];

        const bins = [
            { label: '< -500', min: -Infinity, max: -500, count: 0, fill: '#881337' },
            { label: '-500:-100', min: -500, max: -100, count: 0, fill: '#be123c' },
            { label: '-100:0', min: -100, max: 0, count: 0, fill: '#f43f5e' },
            { label: '0:100', min: 0, max: 100, count: 0, fill: '#10b981' },
            { label: '100:500', min: 100, max: 500, count: 0, fill: '#059669' },
            { label: '> 500', min: 500, max: Infinity, count: 0, fill: '#047857' },
        ];

        trades.forEach(t => {
            const p = t.results.totalNetProfit;
            const bin = bins.find(b => p >= b.min && p < b.max);
            if (bin) bin.count++;
        });

        return bins.map(b => ({ range: b.label, count: b.count, fill: b.fill }));
    }, [filteredLogs]);

    const monthlyData = useMemo(() => {
        const tradeLogs = filteredLogs.filter(l => l.type === 'TRADE') as TradeLog[];
        const groups: { [key: string]: { pnl: number, rMultiple: number } } = {};

        tradeLogs.forEach(log => {
            const date = new Date(log.date);
            const key = date.toLocaleString('default', { month: 'short', year: '2-digit' }); // e.g., "Jan 24"
            if (!groups[key]) groups[key] = { pnl: 0, rMultiple: 0 };

            groups[key].pnl += Number(log.results.totalNetProfit);

            const initialRisk = log.results.initialRiskAmount || 0;
            if (initialRisk > 0) {
                groups[key].rMultiple += Number(log.results.totalNetProfit) / initialRisk;
            }
        });

        // Convert to array and Sort chronologically
        return Object.entries(groups).map(([month, data]) => ({
            month,
            pnl: data.pnl,
            percentage: session.initialBalance ? (data.pnl / session.initialBalance) * 100 : 0,
            rMultiple: data.rMultiple
        })).sort((a, b) => {
            const dateA = new Date(a.month.replace(" ", " 1, 20"));
            const dateB = new Date(b.month.replace(" ", " 1, 20"));
            return dateA.getTime() - dateB.getTime();
        });
    }, [filteredLogs, session.initialBalance]);



    return (
        <div className="flex flex-col h-full bg-trade-bg">
            {/* Header & Controls */}
            <TopNavigation session={session}>
                <select
                    value={assetFilter}
                    onChange={(e) => setAssetFilter(e.target.value)}
                    className="h-6 text-[10px] bg-trade-bg border border-trade-border rounded text-trade-text-secondary focus:outline-none focus:border-trade-primary cursor-pointer px-2"
                >
                    <option value="ALL">All Assets</option>
                    <option value="EURUSD">EURUSD</option>
                    <option value="XAUUSD">XAUUSD</option>
                </select>
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="h-6 text-[10px] bg-trade-bg border border-trade-border rounded text-trade-text-secondary focus:outline-none focus:border-trade-primary cursor-pointer px-2"
                    disabled
                >
                    <option value="ALL">All Time</option>
                    <option value="MONTH">This Month</option>
                </select>

                <div className="flex items-center gap-2 ml-4 border-l border-trade-border pl-4">
                    <span className="text-[10px] text-trade-text-secondary uppercase font-mono tracking-wider">Simulation</span>
                    <button
                        onClick={handleToggleSimulation}
                        className={`w-9 h-5 rounded-full relative transition-colors border ${isSimulationMode ? 'bg-trade-primary border-trade-primary' : 'bg-gray-200 border-white/20'}`}
                    >
                        <div className={`absolute top-0.5 bottom-0.5 w-3.5 rounded-full bg-white transition-all ${isSimulationMode ? 'translate-x-4 ml-0.5' : 'translate-x-0.5'}`} />
                    </button>
                </div>
            </TopNavigation>

            <RiskSimulationModal
                isOpen={showSimulationModal}
                onClose={() => setShowSimulationModal(false)}
                logs={initialLogs.filter(l => l.type === 'TRADE') as TradeLog[]}
                onApply={handleApplySimulation}
            />
            {/* Main Container - matching Trade Table wrapper style */}
            <div className="flex-1 flex flex-col p-4 md:p-6 overflow-y-auto space-y-6">

                {isSimulationMode && (
                    <div className="bg-trade-primary/10 border border-trade-primary/20 text-trade-primary px-4 py-3 rounded text-xs font-mono text-center tracking-wide">
                        ⚠️ SIMULATION MODE ACTIVE — RESULTS ARE HYPOTHETICAL BASED ON RISK ADJUSTMENT
                    </div>
                )}

                {/* Key Metrics - Grid Strip */}
                <AnalyticsCards history={filteredLogs} session={session} />

                {/* Charts Grid */}
                <div className="flex flex-col gap-6">
                    {/* Top Row: Equity + Drawdown */}
                    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[400px]">
                        <div className="w-full lg:w-[60%] h-[400px] lg:h-full">
                            <EquityCurveChart data={equityCurve} className="h-full" />
                        </div>
                        <div className="w-full lg:w-[40%] h-[300px] lg:h-full">
                            <DrawdownChart data={equityCurve} className="h-full" />
                        </div>
                    </div>

                    {/* Bottom Row: Month by Month + P&L + Distribution */}
                    <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[350px]">
                        <div className="w-full lg:flex-1 h-[300px] lg:h-full">
                            <MonthByMonthChart data={monthlyData} className="h-full" />
                        </div>
                        <div className="w-full lg:flex-1 h-[300px] lg:h-full">
                            <PnLByTradeChart data={pnlByTrade} className="h-full" />
                        </div>
                        <div className="w-full lg:flex-1 h-[300px] lg:h-full">
                            <WinLossDistributionChart data={winLossDistribution} className="h-full" />
                        </div>
                    </div>
                </div>

                <div className="mt-6 pb-6">
                    <CalendarStats logs={filteredLogs} />
                </div>

                <div className="text-center text-[10px] text-trade-text-muted/50 font-mono py-4 border-t border-trade-border">
                    ANALYTICS MODULE // {new Date().toISOString()} // {session.id}
                </div>
            </div>
        </div>
    );
}
