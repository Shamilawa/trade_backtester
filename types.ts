export type AssetType = 'EURUSD' | 'XAUUSD';

export interface AssetConfig {
  symbol: AssetType;
  pipValue: number; // $ per lot (Standard)
  commission: number; // $ per lot (Round turn)
}

export interface Exit {
  id: string;
  price: number; // Exit Price
  pips?: number; // Calculated Profit/Loss distance in pips
  percentToClose: number; // 0-100, based on REMAINING volume
}

export interface TradeInput {
  entryPrice: number;
  stopLossPrice: number;
  initialRiskPercent: number;
  accountBalance: number;
  asset: AssetType;
}

export interface ExitResult {
  exitId: string;
  lotsClosed: number;
  pipsCaptured: number;
  grossProfit: number;
  commission: number;
  netProfit: number;
  percentClosedOfRemaining: number;
}

export interface CalculationResult {
  initialRiskAmount: number;
  initialLots: number;
  slPips: number;
  exits: ExitResult[];
  totalNetProfit: number;
  remainingLots: number;
  finalAccountBalance: number;
}

export interface TradeLog {
  id: string;
  date: string; // ISO string
  input: TradeInput;
  results: CalculationResult;
}
