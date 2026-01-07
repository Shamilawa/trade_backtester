import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AssetType, Exit, TradeInput, CalculationResult, TradeLog, Session, HistoryLog, TransferLog } from '../types';
import { calculateTrade } from '../utils/calculations';

interface TradeStore {
    // Session State
    sessions: Session[];
    activeSessionId: string | null;

    // Active Session Data (Derived/Scoped usually, but we keep simple for now)
    input: TradeInput;
    exits: Exit[];
    results: CalculationResult | null;
    history: HistoryLog[]; // Contains ALL trades, filtered by UI/Getters ideally, or we filter in actions

    // Session Actions
    createSession: (name: string, initialBalance: number) => string;
    setActiveSession: (id: string) => void;
    deleteSession: (id: string) => void;

    // Trade Actions
    setInput: (field: keyof TradeInput, value: number | string | AssetType) => void;
    addExit: () => void;
    removeExit: (id: string) => void;
    updateExit: (id: string, field: keyof Exit, value: number) => void;
    logTrade: () => void;
    addTransaction: (type: 'WITHDRAWAL' | 'DEPOSIT', amount: number, note?: string) => void;
    deleteLog: (id: string) => void;
    clearHistory: () => void; // Clears ONLY active session history
    initializeSession: (session: Session, history: HistoryLog[]) => void;
}

const DEFAULT_INPUT: TradeInput = {
    accountBalance: 0,
    initialRiskPercent: 1.0,
    riskCashAmount: 100,
    riskMode: 'percent',
    entryPrice: 0,
    stopLossPrice: 0,
    asset: 'EURUSD',
    date: '',
};

// Helper to re-run calculation
const recalc = (input: TradeInput, exits: Exit[]): CalculationResult => {
    return calculateTrade(input, exits);
};

export const useTradeStore = create<TradeStore>((set, get) => ({
    sessions: [],
    activeSessionId: null,

    input: DEFAULT_INPUT,
    exits: [],
    results: recalc(DEFAULT_INPUT, []),
    history: [],

    createSession: (name, initialBalance) => {
        const id = uuidv4();
        const newSession: Session = {
            id,
            name,
            initialBalance,
            currency: 'USD',
            createdAt: new Date().toISOString()
        };

        set(state => ({
            sessions: [newSession, ...state.sessions],
            activeSessionId: id,
            // Reset workspace for new session
            input: { ...DEFAULT_INPUT, accountBalance: initialBalance },
            exits: [],
            results: recalc({ ...DEFAULT_INPUT, accountBalance: initialBalance }, [])
        }));

        return id;
    },

    setActiveSession: (id) => {
        set(state => {
            const session = state.sessions.find(s => s.id === id);
            if (!session) return {};

            // Calculate current balance for this session based on its history
            const sessionTrades = state.history.filter(t => t.sessionId === id);
            // Sort by date to get latest balance? 
            // Actually, we can just sum profits to initial balance. 
            // But relying on the last trade's final balance is safer if we store it.
            // Let's re-calculate "current balance" from clean slate + history? 
            // Or just take the last trade's final balance.

            let currentBalance = session.initialBalance;
            if (sessionTrades.length > 0) {
                // Sort by date descending (newest first) as stored in history usually
                // Our history is [newest, ..., oldest]
                // So index 0 is the latest trade.
                const latestLog = sessionTrades[0];
                if (latestLog.type === 'TRADE') {
                    currentBalance = latestLog.results.finalAccountBalance;
                } else { // WITHDRAWAL or DEPOSIT
                    currentBalance = latestLog.newBalance;
                }
            }

            return {
                activeSessionId: id,
                input: { ...state.input, accountBalance: currentBalance },
                exits: [], // Reset trade ticket
                results: recalc({ ...state.input, accountBalance: currentBalance }, [])
            };
        });
    },

    deleteSession: (id) => {
        set(state => ({
            sessions: state.sessions.filter(s => s.id !== id),
            history: state.history.filter(t => t.sessionId !== id),
            activeSessionId: state.activeSessionId === id ? null : state.activeSessionId
        }));
    },

    setInput: (field, value) => {
        set((state) => {
            const newInput = { ...state.input, [field]: value };
            return {
                input: newInput,
                results: recalc(newInput, state.exits),
            };
        });
    },

    addExit: () => {
        set((state) => {
            const newExit: Exit = {
                id: uuidv4(),
                price: state.input.entryPrice, // Default to entry price
                percentToClose: 50, // Default half
            };
            const newExits = [...state.exits, newExit];
            return {
                exits: newExits,
                results: recalc(state.input, newExits),
            };
        });
    },

    removeExit: (id) => {
        set((state) => {
            const newExits = state.exits.filter((e) => e.id !== id);
            return {
                exits: newExits,
                results: recalc(state.input, newExits),
            };
        });
    },

    updateExit: (id, field, value) => {
        set((state) => {
            const newExits = state.exits.map((e) =>
                e.id === id ? { ...e, [field]: value } : e
            );
            return {
                exits: newExits,
                results: recalc(state.input, newExits),
            };
        });
    },

    logTrade: () => {
        set((state) => {
            if (!state.results || !state.activeSessionId) return {}; // Guard: Must have active session

            const newLog: TradeLog = {
                id: uuidv4(),
                sessionId: state.activeSessionId,
                date: state.input.date,
                type: 'TRADE',
                input: { ...state.input }, // Deep copy
                results: { ...state.results, exits: [...state.results.exits] }, // Deep copy
            };

            // Update the input balance for the NEXT trade automatically?
            // Yes, user expects the balance to update after a trade.
            const newBalance = state.results.finalAccountBalance;
            const nextInput = { ...state.input, accountBalance: newBalance };

            return {
                history: [newLog, ...state.history],
                input: nextInput,
                results: recalc(nextInput, state.exits)
            };
        });
    },

    addTransaction: (type, amount, note) => {
        set((state) => {
            if (!state.activeSessionId) return {};

            // Calculate new balance
            const currentBalance = state.input.accountBalance;
            const newBalance = type === 'WITHDRAWAL'
                ? currentBalance - amount
                : currentBalance + amount;

            // Prevent negative balance if withdrawal? (Optional, maybe allow margin call simulation)
            // if (newBalance < 0) return {}; 

            const newLog: TransferLog = {
                id: uuidv4(),
                sessionId: state.activeSessionId,
                date: new Date().toISOString(),
                type: type,
                amount: amount,
                newBalance: newBalance,
                note: note
            };

            const nextInput = { ...state.input, accountBalance: newBalance };

            return {
                history: [newLog, ...state.history],
                input: nextInput,
                results: recalc(nextInput, state.exits)
            };
        });
    },

    deleteLog: (id) => {
        set((state) => {
            const newHistory = state.history.filter((log) => log.id !== id);

            // If we delete the latest trade, we might want to revert the balance? 
            // For now, complex. Let's just delete the log. 
            // The User might need to manually reset balance or we leave it.
            // Ideally: Recalculate everything? Too heavy.
            // Simple: Just delete.

            return { history: newHistory };
        });
    },

    clearHistory: () => {
        set((state) => ({
            history: state.history.filter(t => t.sessionId !== state.activeSessionId)
        }));
    },

    initializeSession: (session, history) => {
        set(state => {
            // Check if we already have this session active to avoid re-initializing unnecessarily if simpler
            // But usually we just overwrite.

            // Calculate current balance from history (latest log)
            let currentBalance = session.initialBalance;
            if (history.length > 0) {
                const latestLog = history[0]; // Assuming history is passed sorted desc
                if (latestLog.type === 'TRADE') {
                    currentBalance = latestLog.results.finalAccountBalance;
                } else {
                    currentBalance = latestLog.newBalance;
                }
            }

            // Merge this session into sessions array if not present
            const existingSessionIndex = state.sessions.findIndex(s => s.id === session.id);
            let newSessions = [...state.sessions];
            if (existingSessionIndex >= 0) {
                newSessions[existingSessionIndex] = session;
            } else {
                newSessions = [session, ...state.sessions];
            }

            return {
                sessions: newSessions,
                activeSessionId: session.id,
                // Wait, if we have other sessions' history in state.history, we should keep them?
                // The store seems to keep ALL history in one array? 
                // Line 15: "history: HistoryLog[]; // Contains ALL trades"
                // So we should merge or filter?
                // "filter(t => t.sessionId !== session.id)" then add new history.
                history: [
                    ...state.history.filter(h => h.sessionId !== session.id),
                    ...history
                ],
                input: { ...state.input, accountBalance: currentBalance }, // Reset input balance
                results: recalc({ ...state.input, accountBalance: currentBalance }, [])
            };
        });
    },
}));
