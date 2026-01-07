import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AssetType, Exit, TradeInput, CalculationResult, TradeLog } from '../types';
import { calculateTrade } from '../utils/calculations';

interface TradeStore {
    input: TradeInput;
    exits: Exit[];
    results: CalculationResult | null;
    history: TradeLog[];

    // Actions
    setInput: (field: keyof TradeInput, value: number | AssetType) => void;
    addExit: () => void;
    removeExit: (id: string) => void;
    updateExit: (id: string, field: keyof Exit, value: number) => void;
    logTrade: () => void;
    deleteLog: (id: string) => void;
    clearHistory: () => void;
}

const DEFAULT_INPUT: TradeInput = {
    accountBalance: 0,
    initialRiskPercent: 0,
    entryPrice: 0,
    stopLossPrice: 0,
    asset: 'EURUSD',
};

// Helper to re-run calculation
const recalc = (input: TradeInput, exits: Exit[]): CalculationResult => {
    return calculateTrade(input, exits);
};

export const useTradeStore = create<TradeStore>((set, get) => ({
    input: DEFAULT_INPUT,
    exits: [],
    results: recalc(DEFAULT_INPUT, []),
    history: [],

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
            if (!state.results) return {};
            const newLog: TradeLog = {
                id: uuidv4(),
                date: new Date().toISOString(),
                input: { ...state.input }, // Deep copy
                results: { ...state.results, exits: [...state.results.exits] }, // Deep copy
            };
            return { history: [newLog, ...state.history] };
        });
    },

    deleteLog: (id) => {
        set((state) => ({
            history: state.history.filter((log) => log.id !== id),
        }));
    },

    clearHistory: () => {
        set({ history: [] });
    },
}));
