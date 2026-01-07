import { HistoryLog } from "../types";

export interface AnalyticsMetrics {
    balance: number;
    initialBalance: number;
    netProfit: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
    averageWin: number;
    averageLoss: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    averageRR: number;
    totalPercentageGain: number;
}

export function calculateAnalytics(history: HistoryLog[], initialBalance: number): AnalyticsMetrics {
    // 1. Sort history by date ascending to simulate equity curve
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = initialBalance;
    let maxBalance = initialBalance;
    let maxDrawdown = 0;

    let totalTrades = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let grossProfit = 0;
    let grossLoss = 0;

    // We only track stats for TRADES, but Balance must respect Transfers too
    // Drawdown should be based on Balance (Equity) Curve? 
    // Yes, withdrawals cause "drawdown" in balance technically, but usually DD is performance based.
    // However, for a simple session view, let's track the Account Balance High Water Mark.
    // If I withdraw, my balance drops. Is that a drawdown? No, it's a transfer.
    // So we should adjust "Max Balance" (High Water Mark) down by the withdrawal amount?
    // Or just treat DD as Trade Performance only?
    // Standard approach: DD is typically trade-induced. 
    // Complexity: true DD calc requires adjusting for cashflows. 
    // Simple approach for this iteration: Just track balance. If user withdraws, it might look like DD.
    // Refined approach: Adjust Max Balance when Withdrawal happens so we don't flag it as DD.

    for (const log of sortedHistory) {
        if (log.type === 'TRADE') {
            const pl = log.results.totalNetProfit;
            currentBalance += pl;

            totalTrades++;
            if (pl > 0) {
                winningTrades++;
                grossProfit += pl;
            } else { // Includes break-even as "not winning" or treat 0 as... usually losing/neutral?
                // Let's treat <= 0 as arguably not a "Win".
                if (pl < 0) {
                    losingTrades++;
                    grossLoss += Math.abs(pl);
                }
            }
        } else if (log.type === 'WITHDRAWAL') {
            // Reduce current balance
            currentBalance -= log.amount;
            // Reduce Max Balance by same amount to "hide" this drop from DD calc
            maxBalance -= log.amount;
        } else if (log.type === 'DEPOSIT') {
            currentBalance += log.amount;
            // No impact on Max Balance relative to DD until it goes higher?
            // Actually depositing just adds equity. 
        }

        // Update High Water Mark
        if (currentBalance > maxBalance) {
            maxBalance = currentBalance;
        }

        // Calculate DD
        const dd = maxBalance - currentBalance;
        if (dd > maxDrawdown) {
            maxDrawdown = dd;
        }
    }

    const netProfit = currentBalance - initialBalance;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;

    // Profit Factor: Gross Profit / Gross Loss. If Loss is 0, PF is Infinity (or Gross Profit if we want a number?)
    // Usually cap at something or show infinity. Let's return 0 if no trades, or Gross Profit if 0 loss.
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);

    const averageWin = winningTrades > 0 ? grossProfit / winningTrades : 0;
    const averageLoss = losingTrades > 0 ? grossLoss / losingTrades : 0;
    const maxDrawdownPercent = maxBalance > 0 ? (maxDrawdown / maxBalance) * 100 : 0;

    const averageRR = averageLoss > 0 ? averageWin / averageLoss : (averageWin > 0 ? 999 : 0);
    const totalPercentageGain = initialBalance > 0 ? (netProfit / initialBalance) * 100 : 0;

    return {
        balance: currentBalance,
        initialBalance,
        netProfit,
        winRate,
        profitFactor,
        maxDrawdown,
        maxDrawdownPercent,
        averageWin,
        averageLoss,
        averageRR,
        totalPercentageGain,
        totalTrades,
        winningTrades,
        losingTrades
    };
}
