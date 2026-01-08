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
  riskCashAmount?: number;
  riskMode: 'percent' | 'cash';
  accountBalance: number;
  asset: AssetType;
  date: string; // Date/Time for backtesting
}

export interface ExitResult {
  exitId: string;
  lotsClosed: number;
  pipsCaptured: number;
  grossProfit: number;
  commission: number;
  netProfit: number;
  percentClosedOfRemaining: number;
  remainingLotsAfter: number;
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

export interface Session {
  id: string;
  name: string;
  initialBalance: number;
  currency: string;
  createdAt: string; // ISO string
}

export interface BaseLog {
  id: string;
  sessionId: string;
  date: string;
}

export interface TradeLog extends BaseLog {
  type: 'TRADE';
  input: TradeInput;
  results: CalculationResult;
}

export interface TransferLog extends BaseLog {
  type: 'WITHDRAWAL' | 'DEPOSIT';
  amount: number;
  newBalance: number;
  note?: string;
}

export type HistoryLog = TradeLog | TransferLog;
