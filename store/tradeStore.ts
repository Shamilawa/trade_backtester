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
    updateLog: (log: TradeLog | TransferLog) => void;
    updateTags: (tradeId: string, tags: string[]) => void;
    uploadTradeImage: (tradeId: string, type: 'entry' | 'exit', file: File) => Promise<string | undefined>;
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

// Helper to completely recalculate history balances
// Ensures that if a middle log is deleted/changed, all subsequent balances are fixed.
const recalculateHistory = (history: HistoryLog[], initialBalance: number): HistoryLog[] => {
    // 1. Sort to ensure chronological order
    const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = initialBalance;

    const recalculated = sorted.map(log => {
        if (log.type === 'TRADE') {
            const profit = log.results.totalNetProfit;
            const newFinalBalance = Number((currentBalance + profit).toFixed(2));

            const updatedLog: TradeLog = {
                ...log,
                input: {
                    ...log.input,
                    accountBalance: Number(currentBalance.toFixed(2)) // Update start balance for record
                },
                results: {
                    ...log.results,
                    finalAccountBalance: newFinalBalance
                }
            };

            currentBalance = newFinalBalance;
            return updatedLog;
        } else {
            // Transfer
            const amount = log.amount;
            let newBalance = currentBalance;

            if (log.type === 'WITHDRAWAL') {
                newBalance -= amount;
            } else {
                newBalance += amount;
            }

            newBalance = Number(newBalance.toFixed(2));

            const updatedLog: TransferLog = {
                ...log,
                newBalance: newBalance
            };

            currentBalance = newBalance;
            return updatedLog;
        }
    });

    // Store usually keeps it [Newest, ..., Oldest]
    return recalculated.reverse();
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

            let currentBalance = session.initialBalance;

            // Recalculate to ensure consistency on load (optional but safe)
            const rehashedHistory = recalculateHistory(sessionTrades, session.initialBalance);

            if (rehashedHistory.length > 0) {
                const latestLog = rehashedHistory[0];
                if (latestLog.type === 'TRADE') {
                    currentBalance = latestLog.results.finalAccountBalance;
                } else {
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
                tags: [],
            };

            const otherHistory = state.history.filter(h => h.sessionId !== state.activeSessionId);
            const sessionHistory = state.history.filter(h => h.sessionId === state.activeSessionId);
            const session = state.sessions.find(s => s.id === state.activeSessionId);

            // Add new log -> then Recalculate everything
            const updatedSessionHistory = recalculateHistory([newLog, ...sessionHistory], session?.initialBalance || 0);

            // Get new balance for next trade
            const latestLog = updatedSessionHistory[0];
            const newBalance = latestLog.type === 'TRADE' ? latestLog.results.finalAccountBalance : latestLog.newBalance;

            // Reset trade-specific fields
            const nextInput = {
                ...state.input,
                accountBalance: newBalance,
                entryPrice: 0,
                stopLossPrice: 0,
                date: '',
            };

            return {
                history: [...updatedSessionHistory, ...otherHistory],
                input: nextInput,
                exits: [], // Clear partial exits
                results: recalc(nextInput, [])
            };
        });
    },

    addTransaction: (type, amount, note) => {
        set((state) => {
            if (!state.activeSessionId) return {};

            const newLog: TransferLog = {
                id: uuidv4(),
                sessionId: state.activeSessionId,
                date: new Date().toISOString(),
                type: type,
                amount: amount,
                newBalance: 0, // Will be calc'd
                note: note
            };

            const otherHistory = state.history.filter(h => h.sessionId !== state.activeSessionId);
            const sessionHistory = state.history.filter(h => h.sessionId === state.activeSessionId);
            const session = state.sessions.find(s => s.id === state.activeSessionId);

            const updatedSessionHistory = recalculateHistory([newLog, ...sessionHistory], session?.initialBalance || 0);

            const latestLog = updatedSessionHistory[0];
            const newBalance = latestLog.type === 'TRADE' ? latestLog.results.finalAccountBalance : latestLog.newBalance;

            const nextInput = { ...state.input, accountBalance: newBalance };

            return {
                history: [...updatedSessionHistory, ...otherHistory],
                input: nextInput,
                results: recalc(nextInput, state.exits)
            };
        });
    },

    deleteLog: (id) => {
        set((state) => {
            const logToDelete = state.history.find(l => l.id === id);
            if (!logToDelete) return {};

            const otherHistory = state.history.filter(h => h.sessionId !== logToDelete.sessionId);
            const sessionHistory = state.history.filter(h => h.sessionId === logToDelete.sessionId && h.id !== id);
            const session = state.sessions.find(s => s.id === logToDelete.sessionId);

            const updatedSessionHistory = recalculateHistory(sessionHistory, session?.initialBalance || 0);

            // If we deleted the last log, we need to update the input balance if it's the active session
            let newBalance = session?.initialBalance || 0;
            if (updatedSessionHistory.length > 0) {
                const latest = updatedSessionHistory[0];
                newBalance = latest.type === 'TRADE' ? latest.results.finalAccountBalance : latest.newBalance;
            }

            // Only update input if this was the active session
            const inputUpdate = state.activeSessionId === logToDelete.sessionId
                ? { input: { ...state.input, accountBalance: newBalance }, results: recalc({ ...state.input, accountBalance: newBalance }, state.exits) }
                : {};

            return {
                history: [...updatedSessionHistory, ...otherHistory],
                ...inputUpdate
            };
        });
    },

    updateLog: (updatedLog: TradeLog | TransferLog) => {
        set((state) => {
            const otherHistory = state.history.filter(h => h.sessionId !== updatedLog.sessionId);
            const sessionHistory = state.history.filter(h => h.sessionId === updatedLog.sessionId).map(l => l.id === updatedLog.id ? updatedLog : l);
            const session = state.sessions.find(s => s.id === updatedLog.sessionId);

            const updatedSessionHistory = recalculateHistory(sessionHistory, session?.initialBalance || 0);

            // Update input balance if active session
            let newBalance = session?.initialBalance || 0;
            if (updatedSessionHistory.length > 0) {
                const latest = updatedSessionHistory[0];
                newBalance = latest.type === 'TRADE' ? latest.results.finalAccountBalance : latest.newBalance;
            }

            const inputUpdate = state.activeSessionId === updatedLog.sessionId
                ? { input: { ...state.input, accountBalance: newBalance }, results: recalc({ ...state.input, accountBalance: newBalance }, state.exits) }
                : {};

            return {
                history: [...updatedSessionHistory, ...otherHistory],
                ...inputUpdate
            };
        });
    },

    updateTags: async (tradeId: string, tags: string[]) => {
        const { history } = get();
        const tradeLog = history.find((log) => log.id === tradeId) as TradeLog;
        if (!tradeLog) return;

        const updatedLog = { ...tradeLog, tags };

        set((state) => ({
            history: state.history.map((log) => (log.id === tradeId ? updatedLog : log)),
        }));

        // Persist change
        try {
            const { saveLog } = await import('@/app/actions');
            await saveLog(updatedLog.sessionId, updatedLog);
        } catch (error) {
            console.error("Failed to save tags:", error);
        }
    },

    uploadTradeImage: async (tradeId: string, type: 'entry' | 'exit', file: File) => {
        const { history } = get();
        const tradeLog = history.find((log) => log.id === tradeId) as TradeLog;
        if (!tradeLog) return;

        try {
            // Optimistic update of loading state could go here if we tracked it in the store
            // For now, we'll let the component handle the loading state

            const formData = new FormData();
            formData.append('file', file);

            // Dynamic import to avoid server-side issues
            const { uploadImage } = await import('@/app/actions/upload');
            const url = await uploadImage(formData);

            const updatedLog = { ...tradeLog, [type === 'entry' ? 'entryImage' : 'exitImage']: url };

            set((state) => ({
                history: state.history.map((log) => (log.id === tradeId ? updatedLog : log)),
            }));

            // Persist change
            const { saveLog } = await import('@/app/actions');
            await saveLog(updatedLog.sessionId, updatedLog);

            return url;
        } catch (error) {
            console.error("Failed to upload image:", error);
            throw error;
        }
    },
    clearHistory: () => {
        set((state) => ({
            history: state.history.filter(t => t.sessionId !== state.activeSessionId)
        }));
    },

    initializeSession: (session, history) => {
        set(state => {
            // Calculate current balance from history
            // Use recalculateHistory to ensure consistency on load
            const rehashedHistory = recalculateHistory(history, session.initialBalance);

            let currentBalance = session.initialBalance;
            if (rehashedHistory.length > 0) {
                const latestLog = rehashedHistory[0]; // Assuming history is passed sorted desc by recalculateHistory
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
                history: [
                    ...state.history.filter(h => h.sessionId !== session.id),
                    ...rehashedHistory
                ],
                input: { ...state.input, accountBalance: currentBalance }, // Reset input balance
                results: recalc({ ...state.input, accountBalance: currentBalance }, [])
            };
        });
    },
}));
