import { AssetConfig, AssetType, CalculationResult, Exit, ExitResult, TradeInput } from '../types';

export const ASSET_CONFIGS: Record<AssetType, AssetConfig> = {
    EURUSD: { symbol: 'EURUSD', pipValue: 10, commission: 7 },
    XAUUSD: { symbol: 'XAUUSD', pipValue: 10, commission: 7 },
};

// Multipliers to convert Price Difference to Pips
// EURUSD: 1.0000 -> 1.0001 = 1 Pip (0.0001). 1 / 0.0001 = 10000
// XAUUSD: 2000.00 -> 2000.10 = 1 Pip (0.10). 1 / 0.10 = 10
export const PIP_MULTIPLIERS: Record<AssetType, number> = {
    EURUSD: 10000,
    XAUUSD: 10,
};

export function calculateTrade(input: TradeInput, exits: Exit[]): CalculationResult {
    const { accountBalance, initialRiskPercent, entryPrice, stopLossPrice, asset } = input;
    const config = ASSET_CONFIGS[asset];

    // 1. Calculate Initial Risk Amount ($)
    const initialRiskAmount = accountBalance * (initialRiskPercent / 100);

    // 2. Calculate SL Pips
    // We use absolute difference because SL is always a distance from entry
    const priceDiff = Math.abs(entryPrice - stopLossPrice);
    const slPips = priceDiff * PIP_MULTIPLIERS[asset];

    // 3. Calculate Risk Per Lot
    // Basic Formula: Risk = (SL Pips * PipValue) + Commission
    // Note: Commission is Round Turn per lot.
    // If we lose, we pay the pip loss AND the commission.
    const lossPerLot = (slPips * config.pipValue) + config.commission;

    // 4. Calculate Initial Lots
    // Lots = Risk Amount / Loss Per Lot
    // Sanity check for zero division
    let initialLots = 0;
    if (lossPerLot > 0) {
        initialLots = initialRiskAmount / lossPerLot;
    }

    // Normalize lots to typical broker steps (e.g. 0.01)
    // Usually floor or round? Better to floor to stay within risk, or round.
    // Let's use 2 decimal places standard.
    initialLots = Number(initialLots.toFixed(2));

    // 5. Process Exits
    let currentLots = initialLots;
    let totalNetProfit = 0;
    const exitResults: ExitResult[] = [];

    // Determine Trade Direction
    const isLong = entryPrice > stopLossPrice;

    for (const exit of exits) {
        // Calculate volume to close based on REMAINING lots (Sequential Partial Close)
        // exit.percentToClose is 0-100
        const lotsToCloseRaw = currentLots * (exit.percentToClose / 100);

        // Fix to 2 decimals to match broker reality
        const lotsToClose = Number(lotsToCloseRaw.toFixed(2));

        // Calculate Pips Captured based on Price
        let pipsCaptured = 0;
        if (exit.price) {
            const rawDiff = exit.price - entryPrice;
            // If Long, (Exit - Entry). If Short, (Entry - Exit) -> or -(Exit - Entry)
            // Long: 1.1020 - 1.1000 = +0.0020 (+20 pips)
            // Short: 1.0980 (Entry) - 1.0960 (Exit) => we want +20 pips. 
            // Formula: (Entry - Exit) for Short.

            if (isLong) {
                pipsCaptured = (exit.price - entryPrice) * PIP_MULTIPLIERS[asset];
            } else {
                pipsCaptured = (entryPrice - exit.price) * PIP_MULTIPLIERS[asset];
            }
        } else if (exit.pips) {
            // Fallback for backward compatibility if pips existed
            pipsCaptured = exit.pips;
        }

        // Round pips to 1 decimal
        pipsCaptured = Number(pipsCaptured.toFixed(1));


        if (lotsToClose === 0) {
            // Skip if too small to close
            exitResults.push({
                exitId: exit.id,
                lotsClosed: 0,
                pipsCaptured: pipsCaptured,
                grossProfit: 0,
                commission: 0,
                netProfit: 0,
                percentClosedOfRemaining: exit.percentToClose
            });
            continue;
        }

        // Gross Profit = Lots * Pips * PipValue
        const grossProfit = lotsToClose * pipsCaptured * config.pipValue;

        // Commission = Lots * CommissionPerLot
        const commission = lotsToClose * config.commission;

        const netProfit = grossProfit - commission;

        exitResults.push({
            exitId: exit.id,
            lotsClosed: lotsToClose,
            pipsCaptured: pipsCaptured,
            grossProfit,
            commission,
            netProfit,
            percentClosedOfRemaining: exit.percentToClose
        });

        totalNetProfit += netProfit;
        currentLots -= lotsToClose;

        // Prevent negative lots floating point errors
        if (currentLots < 0) currentLots = 0;
    }

    return {
        initialRiskAmount: Number(initialRiskAmount.toFixed(2)),
        initialLots,
        slPips: Number(slPips.toFixed(1)), // Pips usually 1 decimal
        exits: exitResults,
        totalNetProfit: Number(totalNetProfit.toFixed(2)),
        remainingLots: Number(currentLots.toFixed(2)),
        finalAccountBalance: Number((accountBalance + totalNetProfit).toFixed(2))
    };
}
