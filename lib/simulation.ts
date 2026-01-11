
export interface SimulationResult {
    equityCurve: number[];
    finalBalance: number;
    maxDrawdown: number;
    maxDrawdownPercent: number;
}

export interface SimulationStats {
    medianBalance: number;
    p05Balance: number;
    p95Balance: number;
    medianDrawdown: number;
    maxDrawdownP95: number;
    ruinProbability: number; // Probability of going below 0 or a threshold
}

export interface MonteCarloParams {
    startBalance: number;
    numSimulations: number;
    numTrades: number;
    winRate: number; // 0-100
    avgWin: number;
    avgLoss: number;
    riskPerTradeType: 'percent' | 'fixed';
    riskPerTrade: number; // Percentage (e.g., 1 for 1%) or cash amount
}

export function runMonteCarloSimulation(params: MonteCarloParams): { results: SimulationResult[], stats: SimulationStats } {
    const { startBalance, numSimulations, numTrades, winRate, avgWin, avgLoss, riskPerTradeType, riskPerTrade } = params;

    const results: SimulationResult[] = [];

    for (let i = 0; i < numSimulations; i++) {
        let currentBalance = startBalance;
        let peakBalance = startBalance;
        let maxDrawdown = 0;
        let maxDrawdownPercent = 0;
        const curve: number[] = [startBalance];

        for (let j = 0; j < numTrades; j++) {
            const isWin = Math.random() * 100 < winRate;
            let pnl = 0;

            if (riskPerTradeType === 'fixed') {
                // Simplified: Win = avgWin, Loss = avgLoss (treated as risk)
                // BUT, to respect risk settings:
                // Usually Monte Carlo shuffles historical trades OR uses Win/Loss stats.
                // Here we use stats.
                pnl = isWin ? avgWin : -Math.abs(avgLoss);
            } else {
                // Percent based risk
                // Loss = balance * risk%
                // Win = Loss * (AvgWin / AvgLoss) -> R-Multiple
                const riskAmount = currentBalance * (riskPerTrade / 100);
                const rMultiple = avgLoss !== 0 ? avgWin / Math.abs(avgLoss) : 1;

                if (isWin) {
                    pnl = riskAmount * rMultiple;
                } else {
                    pnl = -riskAmount;
                }
            }

            currentBalance += pnl;
            curve.push(currentBalance);

            if (currentBalance > peakBalance) {
                peakBalance = currentBalance;
            }

            const dd = peakBalance - currentBalance;
            if (dd > maxDrawdown) {
                maxDrawdown = dd;
            }

            const ddPercent = peakBalance > 0 ? (dd / peakBalance) * 100 : 0;
            if (ddPercent > maxDrawdownPercent) {
                maxDrawdownPercent = ddPercent;
            }

            // Optional: Break if ruin?
            // if (currentBalance <= 0) break; 
        }

        results.push({
            equityCurve: curve,
            finalBalance: currentBalance,
            maxDrawdown,
            maxDrawdownPercent
        });
    }

    // Calculate Stats
    const finalBalances = results.map(r => r.finalBalance).sort((a, b) => a - b);
    const drawdowns = results.map(r => r.maxDrawdownPercent).sort((a, b) => a - b);

    const ruinedCount = results.filter(r => r.finalBalance <= 0).length;

    const stats: SimulationStats = {
        medianBalance: finalBalances[Math.floor(finalBalances.length * 0.5)],
        p05Balance: finalBalances[Math.floor(finalBalances.length * 0.05)],
        p95Balance: finalBalances[Math.floor(finalBalances.length * 0.95)],
        medianDrawdown: drawdowns[Math.floor(drawdowns.length * 0.5)],
        maxDrawdownP95: drawdowns[Math.floor(drawdowns.length * 0.95)],
        ruinProbability: (ruinedCount / numSimulations) * 100
    };

    return { results, stats };
}
