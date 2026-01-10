import { HistoryLog, TradeLog } from '../types';

export interface AnalyticsMetrics {
    netProfit: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageWin: number;
    averageLoss: number;
    expectancy: number; // Avg return per trade
    largestWin: number;
    largestLoss: number;
    sharpeRatio: number;
    riskRewardRatio: number;
}

export interface ChartDataPoint {
    tradeNumber: number;
    date: string;
    balance: number;
    drawdown: number;
    drawdownPercent: number;
    tradeNetProfit: number;
    cumulativeNetProfit: number;
    cumulativePercentageGain: number;
    cumulativeR: number;
}

export function filterLogs(logs: HistoryLog[], assetFilter: string | null): HistoryLog[] {
    if (!assetFilter || assetFilter === 'ALL') return logs;
    return logs.filter(log => {
        if (log.type === 'TRADE') {
            return log.input.asset === assetFilter;
        }
        return true;
    });
}

function calculateStandardDeviation(values: number[], mean: number): number {
    if (values.length === 0) return 0;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.sqrt(avgSquareDiff);
}

export function calculateMetrics(logs: HistoryLog[]): AnalyticsMetrics {
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const trades = sortedLogs.filter(l => l.type === 'TRADE') as TradeLog[];
    const totalTrades = trades.length;

    if (totalTrades === 0) {
        return {
            netProfit: 0,
            winRate: 0,
            profitFactor: 0,
            maxDrawdown: 0,
            maxDrawdownPercent: 0,
            totalTrades: 0,
            winningTrades: 0,
            losingTrades: 0,
            averageWin: 0,
            averageLoss: 0,
            expectancy: 0,
            largestWin: 0,
            largestLoss: 0,
            sharpeRatio: 0,
            riskRewardRatio: 0,
        };
    }

    let grossWin = 0;
    let grossLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let largestWin = -Infinity;
    let largestLoss = Infinity;
    let netProfit = 0;
    const tradeProfits: number[] = [];

    trades.forEach(trade => {
        const profit = trade.results.totalNetProfit;
        netProfit += profit;
        tradeProfits.push(profit);

        if (profit > 0) {
            grossWin += profit;
            winningTrades++;
            if (profit > largestWin) largestWin = profit;
        } else {
            grossLoss += Math.abs(profit);
            losingTrades++;
            if (profit < largestLoss) largestLoss = profit;
        }
    });

    const winRate = (winningTrades / totalTrades) * 100;
    const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss;
    const averageWin = winningTrades > 0 ? grossWin / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    const expectancy = netProfit / totalTrades;
    const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin;

    // Sharpe Ratio Calculation (simplified based on trade returns)
    // Sharpe = (Mean Return - RiskFreeRate) / StdDev of Returns
    // Assuming RiskFreeRate = 0 for simplified trade analysis
    const stdDev = calculateStandardDeviation(tradeProfits, expectancy);
    const sharpeRatio = stdDev === 0 ? 0 : expectancy / stdDev;

    // DD Calculation
    let runningBalance = 0;
    let peak = 0;
    let maxDD = 0;

    trades.forEach(trade => {
        runningBalance += trade.results.totalNetProfit;
        if (runningBalance > peak) peak = runningBalance;
        const dd = peak - runningBalance;
        if (dd > maxDD) maxDD = dd;
    });

    return {
        netProfit,
        winRate,
        profitFactor,
        maxDrawdown: maxDD,
        maxDrawdownPercent: 0, // Placeholder
        totalTrades,
        winningTrades,
        losingTrades,
        averageWin,
        averageLoss,
        expectancy,
        largestWin: largestWin === -Infinity ? 0 : largestWin,
        largestLoss: largestLoss === Infinity ? 0 : largestLoss,
        sharpeRatio,
        riskRewardRatio,
    };
}

export function calculateEquityCurve(logs: HistoryLog[], initialBalance: number): ChartDataPoint[] {
    let currentBalance = initialBalance;
    let peakBalance = initialBalance;

    // Sort logs by date to ensure correct calculation order (Oldest -> Newest)
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const points: ChartDataPoint[] = [];

    // Initial Point
    points.push({
        tradeNumber: 0,
        date: 'Start',
        balance: initialBalance,
        drawdown: 0,
        drawdownPercent: 0,
        tradeNetProfit: 0,
        cumulativeNetProfit: 0,
        cumulativePercentageGain: 0,
        cumulativeR: 0
    });

    let tradeCount = 0;
    let cumulativeNetProfit = 0;
    let cumulativeR = 0;

    sortedLogs.forEach((log) => {
        if (log.type === 'TRADE') {
            tradeCount++;
            const profit = log.results.totalNetProfit;
            currentBalance += profit;
            cumulativeNetProfit += profit;

            // Calculate R-Multiple for this trade
            const risk = log.results.initialRiskAmount > 0 ? log.results.initialRiskAmount : 1; // Avoid div by 0
            const rMultiple = profit / risk;
            cumulativeR += rMultiple;

            if (currentBalance > peakBalance) {
                peakBalance = currentBalance;
            }

            const drawdown = peakBalance - currentBalance;
            const drawdownPercent = peakBalance > 0 ? (drawdown / peakBalance) * 100 : 0;
            const cumulativePercentageGain = initialBalance > 0 ? (cumulativeNetProfit / initialBalance) * 100 : 0;

            points.push({
                tradeNumber: tradeCount,
                date: new Date(log.date).toLocaleDateString(), // Simplification
                balance: currentBalance,
                drawdown: drawdown,
                drawdownPercent: drawdownPercent,
                tradeNetProfit: profit,
                cumulativeNetProfit,
                cumulativePercentageGain,
                cumulativeR
            });
        } else if (log.type === 'DEPOSIT' || log.type === 'WITHDRAWAL') {
            // Transfers affect balance but not "Equity Curve" in terms of performance usually.
            // But they do affect the actual money. 
            // If we withdraw, balance drops. Do we count that as drawdown? No.
            // For pure performance analysis, usually we filter out deposits/withdrawals or adjust.
            // BUT for this simple view: Let's track actual Account Balance.

            // Adjust peak balance so withdrawal doesn't look like DD?
            // If I withdraw $1000, current drops $1000. 
            // If I don't adjust peak, it looks like a $1000 DD.
            // Standard approach: Time-Weighted Return or adjust Peak.
            // Simple approach: Reduce peak by withdrawal amount to "reset" the high water mark relative to new capital.
            if (log.type === 'WITHDRAWAL') {
                currentBalance -= log.amount;
                peakBalance -= log.amount; // Adjust peak to avoid fake drawdown
            } else {
                currentBalance += log.amount;
                peakBalance += log.amount;
            }

            // We might insert a point here to show the step change
            // We might insert a point here to show the step change
            const cumulativePercentageGain = initialBalance > 0 ? (cumulativeNetProfit / initialBalance) * 100 : 0;

            points.push({
                tradeNumber: tradeCount, // Keep same trade number?
                date: new Date(log.date).toLocaleDateString() + (log.type === 'WITHDRAWAL' ? ' (W)' : ' (D)'),
                balance: currentBalance,
                drawdown: 0, // Reset DD visual for transfers? or keep previous?
                drawdownPercent: 0,
                tradeNetProfit: 0,
                cumulativeNetProfit, // Keeps previous value
                cumulativePercentageGain, // Keeps previous value
                cumulativeR // Keeps previous value
            });
        }
    });

    return points;
}
