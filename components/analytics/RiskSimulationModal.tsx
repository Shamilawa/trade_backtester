'use client';

import React, { useState, useEffect } from 'react';
import { TradeLog } from '@/types';
import { Settings2, ArrowRightLeft, Target } from 'lucide-react';

export type SimulationConfig =
    | { type: 'mapping'; mapping: Record<string, number> }
    | { type: 'static'; value: number; unit: 'percent' | 'cash' };

interface RiskSimulationModalProps {
    isOpen: boolean;
    onClose: () => void;
    logs: TradeLog[];
    onApply: (config: SimulationConfig) => void;
}

interface RiskItem {
    type: 'percent' | 'cash';
    value: number;
    key: string; // "p_1" or "c_100"
}

export default function RiskSimulationModal({ isOpen, onClose, logs, onApply }: RiskSimulationModalProps) {
    const [mode, setMode] = useState<'mapping' | 'static'>('mapping');

    // Mapping State
    const [riskMapping, setRiskMapping] = useState<Record<string, string>>({});
    const [detectedRisks, setDetectedRisks] = useState<RiskItem[]>([]);

    // Static State
    const [staticValue, setStaticValue] = useState<string>('');
    const [staticUnit, setStaticUnit] = useState<'percent' | 'cash'>('percent');

    useEffect(() => {
        if (!isOpen) return;

        // Detect unique risks
        const riskMap = new Map<string, RiskItem>();

        logs.forEach(log => {
            if (log.input.riskMode === 'cash' && log.input.riskCashAmount) {
                const val = log.input.riskCashAmount;
                const key = `c_${val}`;
                if (!riskMap.has(key)) {
                    riskMap.set(key, { type: 'cash', value: val, key });
                }
            } else if (log.input.initialRiskPercent) {
                const val = log.input.initialRiskPercent;
                const key = `p_${val}`;
                if (!riskMap.has(key)) {
                    riskMap.set(key, { type: 'percent', value: val, key });
                }
            }
        });

        const sortedRisks = Array.from(riskMap.values()).sort((a, b) => {
            if (a.type !== b.type) return a.type === 'percent' ? -1 : 1;
            return a.value - b.value;
        });

        setDetectedRisks(sortedRisks);

        // Initialize mapping
        const initialMapping: Record<string, string> = {};
        sortedRisks.forEach(item => {
            initialMapping[item.key] = item.value.toString();
        });
        setRiskMapping(initialMapping);

    }, [isOpen, logs]);

    const handleMappingChange = (key: string, newValueStr: string) => {
        setRiskMapping(prev => ({ ...prev, [key]: newValueStr }));
    };

    const handleRun = () => {
        if (mode === 'mapping') {
            const finalMapping: Record<string, number> = {};
            let isValid = true;

            detectedRisks.forEach(item => {
                const val = parseFloat(riskMapping[item.key]);
                if (isNaN(val) || val <= 0) {
                    isValid = false;
                }
                finalMapping[item.key] = val;
            });

            if (!isValid) {
                alert("Please enter valid positive numbers for all risk values.");
                return;
            }

            onApply({ type: 'mapping', mapping: finalMapping });
        } else {
            const val = parseFloat(staticValue);
            if (isNaN(val) || val <= 0) {
                alert("Please enter a valid positive number for static risk.");
                return;
            }
            onApply({ type: 'static', value: val, unit: staticUnit });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="w-[500px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden text-slate-900">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-1">
                        <Settings2 className="w-5 h-5 text-indigo-600" />
                        <h2 className="text-lg font-bold text-slate-800">Simulation Mode</h2>
                    </div>
                    <p className="text-sm text-slate-500">
                        Adjust parameters to see how your history would have performed.
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200">
                    <button
                        onClick={() => setMode('mapping')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'mapping' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <ArrowRightLeft className="w-4 h-4" />
                        Risk Mapping
                    </button>
                    <button
                        onClick={() => setMode('static')}
                        className={`flex-1 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${mode === 'static' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Target className="w-4 h-4" />
                        Static Risk
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {mode === 'mapping' ? (
                        <div className="space-y-4">
                            <div className="flex justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">
                                <span>Original Risk</span>
                                <span>Simulated Risk</span>
                            </div>
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                                {detectedRisks.map((item) => (
                                    <div key={item.key} className="flex items-center gap-4">
                                        <div className="flex-1 bg-slate-100 rounded-lg py-2.5 px-3 border border-slate-200 text-center font-mono text-sm text-slate-600 font-medium">
                                            {item.type === 'cash' ? '$' : ''}{item.value}{item.type === 'percent' ? '%' : ''}
                                        </div>
                                        <div className="text-slate-300">→</div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                step={item.type === 'percent' ? "0.1" : "1"}
                                                value={riskMapping[item.key] || ''}
                                                onChange={(e) => handleMappingChange(item.key, e.target.value)}
                                                className="w-full bg-white border border-slate-300 rounded-lg py-2.5 px-3 text-center font-mono text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                                placeholder={item.type === 'percent' ? "1.0" : "100"}
                                            />
                                            <span className="absolute right-3 top-2.5 text-xs text-slate-400 pointer-events-none font-medium">
                                                {item.type === 'percent' ? '%' : '$'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="py-6 space-y-6">
                            <div className="text-center space-y-2">
                                <label className="text-sm font-medium text-slate-700">Simulate every trade with a fixed risk of:</label>
                                <div className="flex justify-center gap-4">
                                    <button
                                        onClick={() => setStaticUnit('percent')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${staticUnit === 'percent' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                                    >
                                        Percent (%)
                                    </button>
                                    <button
                                        onClick={() => setStaticUnit('cash')}
                                        className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${staticUnit === 'cash' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-300 hover:border-slate-400'}`}
                                    >
                                        Cash ($)
                                    </button>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="relative w-48">
                                    <input
                                        type="number"
                                        value={staticValue}
                                        onChange={(e) => setStaticValue(e.target.value)}
                                        className="w-full text-center text-3xl font-bold text-slate-800 border-b-2 border-slate-200 py-2 focus:border-indigo-600 focus:outline-none bg-transparent placeholder:text-slate-200"
                                        placeholder="0"
                                        autoFocus
                                    />
                                    <span className="absolute right-0 top-3 text-lg font-medium text-slate-400">
                                        {staticUnit === 'percent' ? '%' : '$'}
                                    </span>
                                </div>
                            </div>

                            <p className="text-center text-xs text-slate-500 max-w-[80%] mx-auto leading-relaxed">
                                This will recalculate all past trades as if you had risked exactly <span className="font-semibold text-slate-900">{staticValue || '0'}{staticUnit === 'percent' ? '%' : '$'}</span> on each setup.
                            </p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-2 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleRun}
                        className="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 shadow-md shadow-indigo-500/20 transition-all"
                    >
                        Run Simulation
                    </button>
                </div>
            </div>
        </div>
    );
}
