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
}

export interface ChartDataPoint {
    tradeNumber: number;
    date: string;
    balance: number;
    drawdown: number;
    drawdownPercent: number;
    tradeNetProfit: number;
}

export function filterLogs(logs: HistoryLog[], assetFilter: string | null): HistoryLog[] {
    if (!assetFilter || assetFilter === 'ALL') return logs;
    return logs.filter(log => {
        if (log.type === 'TRADE') {
            return log.input.asset === assetFilter;
        }
        return true; // Keep transfers to maintain balance logic correct, or maybe filter them? 
        // Logic decision: If we filter by asset, we probably only care about TRADES for that asset. 
        // But for equity curve, we need balance. 
        // If we filter, we might just show P&L curve for that asset instead of Account Balance.
        // For simplicity: When filtering by asset, we might recount "Virtual Balance" starting from 0 or session start.
        // Let's stick to simple filtering: If asset selected, only include those trades for metrics. 
        // For equity curve, it might be weird if we include transfers.
    });
}

export function calculateMetrics(logs: HistoryLog[]): AnalyticsMetrics {
    const trades = logs.filter(l => l.type === 'TRADE') as TradeLog[];
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
        };
    }

    let grossWin = 0;
    let grossLoss = 0;
    let winningTrades = 0;
    let losingTrades = 0; // Breakeven could be its own or lumped. usually < 0 or <= 0.
    let largestWin = -Infinity;
    let largestLoss = Infinity; // Using Infinity so first negative number is smaller
    let netProfit = 0;

    trades.forEach(trade => {
        const profit = trade.results.totalNetProfit;
        netProfit += profit;

        if (profit > 0) {
            grossWin += profit;
            winningTrades++;
            if (profit > largestWin) largestWin = profit;
        } else {
            grossLoss += Math.abs(profit); // loss is absolute for calculation
            losingTrades++; // Counting 0 as loss or neutral? Usually neutral, but for winrate, it's NOT a win.
            if (profit < largestLoss) largestLoss = profit;
        }
    });

    const winRate = (winningTrades / totalTrades) * 100;
    const profitFactor = grossLoss === 0 ? grossWin : grossWin / grossLoss; // If 0 loss, infinite PF.
    const averageWin = winningTrades > 0 ? grossWin / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0; // This will be positive number representing amount
    const expectancy = netProfit / totalTrades;

    // DD Calculation
    // We need to simulate the running balance to find true DD across the filtered set.
    // If filtered, this represents the performance of JUST this subset of trades.
    let runningBalance = 0; // Relative to start of filter
    let peak = 0;
    let maxDD = 0;
    let maxDDPercent = 0;
    // Note: MaxDD % usually requires absolute account balance. 
    // If this is a subset, % might be misleading unless we know the account balance at that time.
    // We will do a simple relative DD calculation.

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
        maxDrawdownPercent: 0, // Placeholder, calculating true % requires full chronological context
        totalTrades,
        winningTrades,
        losingTrades,
        averageWin,
        averageLoss,
        expectancy,
        largestWin: largestWin === -Infinity ? 0 : largestWin,
        largestLoss: largestLoss === Infinity ? 0 : largestLoss,
    };
}

export function calculateEquityCurve(logs: HistoryLog[], initialBalance: number): ChartDataPoint[] {
    let currentBalance = initialBalance;
    let peakBalance = initialBalance;

    // Sort logs by date just in case? Usually they come sorted.
    // Assuming sorted.

    const points: ChartDataPoint[] = [];

    // Initial Point
    points.push({
        tradeNumber: 0,
        date: 'Start',
        balance: initialBalance,
        drawdown: 0,
        drawdownPercent: 0,
        tradeNetProfit: 0
    });

    let tradeCount = 0;

    logs.forEach((log) => {
        if (log.type === 'TRADE') {
            tradeCount++;
            const profit = log.results.totalNetProfit;
            currentBalance += profit;

            if (currentBalance > peakBalance) {
                peakBalance = currentBalance;
            }

            const drawdown = peakBalance - currentBalance;
            const drawdownPercent = peakBalance > 0 ? (drawdown / peakBalance) * 100 : 0;

            points.push({
                tradeNumber: tradeCount,
                date: new Date(log.date).toLocaleDateString(), // Simplification
                balance: currentBalance,
                drawdown: drawdown,
                drawdownPercent: drawdownPercent,
                tradeNetProfit: profit
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
            points.push({
                tradeNumber: tradeCount, // Keep same trade number?
                date: new Date(log.date).toLocaleDateString() + (log.type === 'WITHDRAWAL' ? ' (W)' : ' (D)'),
                balance: currentBalance,
                drawdown: 0, // Reset DD visual for transfers? or keep previous?
                drawdownPercent: 0,
                tradeNetProfit: 0
            });
        }
    });

    return points;
}
