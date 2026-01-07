import { useTradeStore } from '@/store/tradeStore';
import { saveLog } from '@/app/actions';
import { Button, Card, Input, Label } from './ui/common';
import { Plus, Trash2, Save, X, ChevronDown, ChevronUp, AlertCircle, DollarSign, Percent, ArrowDownUp, Settings, GripHorizontal } from 'lucide-react';
import { ASSET_CONFIGS, PIP_MULTIPLIERS } from '@/utils/calculations';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function TradeTicket() {
    const { input, exits, results, setInput, addExit, removeExit, updateExit, logTrade } = useTradeStore();
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');

    const isLong = tradeDirection === 'long';

    // Validation Logic
    const isValidEntry = input.entryPrice > 0;
    const isValidSL = input.stopLossPrice > 0;
    const isValidRisk = input.riskMode === 'percent' ? input.initialRiskPercent > 0 : (input.riskCashAmount || 0) > 0;
    const isValidDate = !!input.date && input.date.trim() !== '';

    // Auto-detect direction warning (optional, or just rely on explicit)
    // For backtesting, if Entry > SL it's logically Long, if Entry < SL it's Short.
    // If user selected 'Long' but Entry < SL, that's invalid for a standard Long (Stop would be triggered immediately).
    // Let's enforce logical consistency or just warn? 
    // Usually: Long -> SL must be < Entry. Short -> SL must be > Entry.
    const isDirectionValid = isLong ? (input.stopLossPrice < input.entryPrice) : (input.stopLossPrice > input.entryPrice);

    const isValidLots = results ? results.initialLots > 0 : false;

    // Combined Validation
    const isFormValid = isValidEntry && isValidSL && isValidRisk && isDirectionValid && isValidLots && isValidDate;

    const handleLogTrade = async () => {
        setHasSubmitted(true);
        if (isFormValid) {
            logTrade();
            // Get the latest log from store state
            const state = useTradeStore.getState();
            if (state.activeSessionId && state.history.length > 0) {
                const latestLog = state.history[0];
                await saveLog(state.activeSessionId, latestLog);
            }
            setHasSubmitted(false);
            setTradeDirection('long'); // Reset direction
        }
    };

    return (
        <div className="h-full flex flex-col bg-trade-bg text-trade-text select-none font-sans">

            {/* Header / Asset Info */}
            <div className="h-[50px] flex-shrink-0 flex items-center justify-between px-4 border-b border-trade-border bg-trade-bg z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-trade-primary/20 p-1.5 rounded text-trade-primary">
                        <ArrowDownUp size={16} />
                    </div>
                    <div className="flex flex-col">
                        <div className="relative flex items-center">
                            <select
                                value={input.asset}
                                onChange={(e) => setInput('asset', e.target.value)}
                                className="appearance-none bg-transparent font-bold text-sm text-trade-text-primary focus:outline-none cursor-pointer pr-4 hover:text-trade-primary transition-colors z-10"
                            >
                                {Object.keys(ASSET_CONFIGS).map((asset) => (
                                    <option key={asset} value={asset} className="bg-trade-bg text-trade-text-primary">
                                        {asset}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-0 top-1/2 -translate-y-1/2 text-trade-text-muted pointer-events-none" />
                        </div>
                        <div className="text-[10px] text-trade-text-muted mt-0.5">USD Margin</div>
                    </div>
                </div>
                <div className="flex gap-2 items-center">
                    {/* Date Picker - Compact */}
                    <input
                        type="datetime-local"
                        value={input.date || ''}
                        onChange={(e) => setInput('date', e.target.value)}
                        className={cn(
                            "bg-transparent text-[10px] focus:outline-none cursor-pointer w-[110px] transition-colors rounded px-1",
                            input.date ? "text-trade-text-primary" : "text-trade-text-muted",
                            (hasSubmitted && !isValidDate) ? "border border-trade-loss text-trade-loss" : "hover:text-trade-text-primary"
                        )}
                        required
                    />
                    <Settings size={16} className="text-trade-text-muted hover:text-trade-text-primary cursor-pointer transition-colors" />
                </div>
            </div>

            <div className="flex-1 flex flex-col p-3 overflow-hidden">

                {/* Buy / Sell Toggle */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button
                        onClick={() => setTradeDirection('long')}
                        className={cn(
                            "flex flex-col items-center justify-center py-3 rounded border transition-all duration-200",
                            tradeDirection === 'long'
                                ? "bg-trade-success/10 border-trade-success text-trade-success shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                : "bg-trade-surface border-trade-border text-trade-text-muted hover:bg-trade-surface-hover hover:text-trade-text-primary"
                        )}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Buy</span>
                        {tradeDirection === 'long' && <ChevronUp size={14} className="mt-1" />}
                    </button>
                    <button
                        onClick={() => setTradeDirection('short')}
                        className={cn(
                            "flex flex-col items-center justify-center py-3 rounded border transition-all duration-200",
                            tradeDirection === 'short'
                                ? "bg-trade-loss/10 border-trade-loss text-trade-loss shadow-[0_0_15px_rgba(244,63,94,0.1)]"
                                : "bg-trade-surface border-trade-border text-trade-text-muted hover:bg-trade-surface-hover hover:text-trade-text-primary"
                        )}
                    >
                        <span className="text-xs font-bold uppercase tracking-wider">Sell</span>
                        {tradeDirection === 'short' && <ChevronDown size={14} className="mt-1" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-5 pr-1 scrollbar-thin scrollbar-thumb-trade-border scrollbar-track-transparent">

                    {/* Price Inputs */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <Label className={cn("text-[10px] uppercase tracking-wider font-semibold", (!isValidEntry && hasSubmitted) ? "text-trade-loss" : "text-trade-text-muted")}>Entry Price</Label>
                            <Input
                                type="number"
                                step="0.0001"
                                value={input.entryPrice || ''}
                                onChange={(e) => setInput('entryPrice', e.target.valueAsNumber)}
                                className={cn(
                                    "font-mono text-lg font-medium transition-all h-11 bg-trade-surface-hover/50 border-trade-border text-trade-text-primary focus-visible:ring-2 focus-visible:ring-trade-primary/50 focus-visible:border-trade-primary",
                                    (hasSubmitted && !isValidEntry) && "border-trade-loss focus-visible:ring-trade-loss",
                                    isValidEntry && (tradeDirection === 'long' ? "text-trade-success" : "text-trade-loss")
                                )}
                                placeholder="0.00000"
                            />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <Label className={cn("text-[10px] uppercase tracking-wider font-semibold", (!isValidSL && hasSubmitted) ? "text-trade-loss" : "text-trade-text-muted")}>Stop Loss</Label>
                                {(!isDirectionValid && isValidEntry && isValidSL) && (
                                    <span className="text-[9px] text-trade-loss animate-pulse">Invalid for {tradeDirection === 'long' ? 'Buy' : 'Sell'}</span>
                                )}
                            </div>
                            <Input
                                type="number"
                                step="0.0001"
                                value={input.stopLossPrice || ''}
                                onChange={(e) => setInput('stopLossPrice', e.target.valueAsNumber)}
                                className={cn(
                                    "font-mono transition-all h-11 bg-trade-surface-hover/50 border-trade-border text-trade-text-primary focus-visible:ring-2 focus-visible:ring-trade-primary/50 focus-visible:border-trade-primary",
                                    (hasSubmitted && (!isValidSL || !isDirectionValid)) && "border-trade-loss focus-visible:ring-trade-loss"
                                )}
                                placeholder="0.00000"
                            />
                        </div>
                    </div>

                    {/* Risk Input Section */}
                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <Label className={cn("text-[10px] uppercase tracking-wider font-semibold", (!isValidRisk && hasSubmitted) ? "text-trade-loss" : "text-trade-text-muted")}>Risk</Label>
                            <div className="flex bg-trade-surface border border-trade-border rounded-[2px] p-0.5">
                                <button
                                    onClick={() => setInput('riskMode', 'percent')}
                                    className={cn("px-2 py-0.5 text-[10px] uppercase font-bold rounded-[1px] transition-colors", input.riskMode === 'percent' ? "bg-trade-primary/20 text-trade-primary" : "text-trade-text-muted hover:text-trade-text-secondary")}
                                >%</button>
                                <button
                                    onClick={() => setInput('riskMode', 'cash')}
                                    className={cn("px-2 py-0.5 text-[10px] uppercase font-bold rounded-[1px] transition-colors", input.riskMode === 'cash' ? "bg-trade-primary/20 text-trade-primary" : "text-trade-text-muted hover:text-trade-text-secondary")}
                                >$</button>
                            </div>
                        </div>
                        <Input
                            type="number"
                            value={input.riskMode === 'percent' ? (input.initialRiskPercent || '') : (input.riskCashAmount || '')}
                            onChange={(e) => setInput(input.riskMode === 'percent' ? 'initialRiskPercent' : 'riskCashAmount', e.target.valueAsNumber)}
                            className={cn(
                                "h-10 bg-trade-surface-hover/50 border-trade-border text-trade-text-primary font-mono text-sm focus:border-trade-primary/50 focus:ring-1 focus:ring-trade-primary/20 transition-all",
                                (hasSubmitted && !isValidRisk) && "border-trade-loss text-trade-loss"
                            )}
                            placeholder={input.riskMode === 'percent' ? "1.0" : "100"}
                        />
                    </div>

                    <div className="h-px bg-trade-border/50 my-1" />

                    {/* Calculated Units (Lots) - Hero Display */}
                    <div className="space-y-1">
                        <div className="flex justify-between items-baseline">
                            <Label className="text-[10px] text-trade-text-muted uppercase tracking-wider font-semibold">Position Size</Label>
                            <span className="text-[10px] text-trade-text-muted italic">Auto-calculated</span>
                        </div>
                        <div className="h-12 px-3 flex items-center justify-between bg-trade-surface border border-trade-border rounded text-trade-text-primary font-mono shadow-inner">
                            <span className={cn("text-xl font-bold tracking-tight", isValidLots ? "text-trade-primary" : "text-trade-text-muted")}>
                                {results?.initialLots || '0.00'}
                            </span>
                            <span className="text-[10px] font-bold text-trade-text-muted bg-trade-bg px-1.5 py-0.5 rounded border border-trade-border">LOTS</span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    {results && (
                        <div className="grid grid-cols-2 gap-2 text-[11px] opacity-90">
                            <div className="flex justify-between p-2 bg-trade-surface/30 rounded border border-trade-border/50">
                                <span className="text-trade-text-muted">Risk Value</span>
                                <span className="font-mono text-trade-text-primary font-medium">${results.initialRiskAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between p-2 bg-trade-surface/30 rounded border border-trade-border/50">
                                <span className="text-trade-text-muted">SL Pips</span>
                                <span className="font-mono text-trade-text-primary font-medium">{results.slPips.toFixed(1)}</span>
                            </div>
                        </div>
                    )}

                    {/* Partial Exits Section */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-trade-text-muted font-medium flex items-center gap-2">
                                Partial Exits
                                {exits.length > 0 && <span className="bg-trade-surface border border-trade-border rounded px-1.5 py-0.5 text-[9px] text-trade-text-primary font-mono">{exits.length}</span>}
                            </span>
                            <Button
                                onClick={addExit}
                                variant="ghost"
                                className="h-6 text-[10px] text-trade-primary hover:text-trade-primary hover:bg-trade-primary/10 px-2"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </Button>
                        </div>

                        <div className="space-y-2">
                            {exits.map((exit, index) => {
                                return (
                                    <div key={exit.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center bg-trade-surface/30 p-2 rounded border border-trade-border/50">
                                        <div className="space-y-0.5">
                                            <Label className='text-[8px] text-trade-text-muted uppercase'>Price</Label>
                                            <Input
                                                type="number"
                                                value={exit.price || ''}
                                                onChange={(e) => updateExit(exit.id, 'price', e.target.valueAsNumber)}
                                                className="h-7 text-xs font-mono bg-trade-bg border-trade-border focus-visible:ring-trade-primary"
                                            />
                                        </div>
                                        <div className="space-y-0.5">
                                            <Label className='text-[8px] text-trade-text-muted uppercase'>% Close</Label>
                                            <Input
                                                type="number"
                                                value={exit.percentToClose}
                                                onChange={(e) => updateExit(exit.id, 'percentToClose', e.target.valueAsNumber)}
                                                className="h-7 text-xs font-mono bg-trade-bg border-trade-border focus-visible:ring-trade-primary"
                                            />
                                        </div>
                                        <Button
                                            onClick={() => removeExit(exit.id)}
                                            variant="ghost"
                                            className="h-7 w-7 p-0 mt-3 text-trade-text-muted hover:text-trade-loss hover:bg-trade-loss/10"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* P&L Breakdown */}
                    {results && exits.length > 0 && (
                        <div className="mt-2 space-y-2 bg-trade-bg/50 rounded border border-trade-border p-3">
                            <div className="text-[10px] uppercase text-trade-text-muted tracking-wide font-medium">Projection</div>
                            <div className="space-y-1">
                                {results.exits.map((exitResult, idx) => (
                                    <div key={exitResult.exitId} className="flex justify-between text-xs items-center">
                                        <div className="text-trade-text-secondary flex items-center">
                                            <span className="w-4 text-trade-text-muted text-[10px]">{idx + 1}.</span>
                                            <span>Target ({exitResult.percentClosedOfRemaining}%)</span>
                                        </div>
                                        <span className={cn("font-mono", exitResult.netProfit >= 0 ? "text-trade-success" : "text-trade-loss")}>
                                            {exitResult.netProfit >= 0 ? '+' : ''}${exitResult.netProfit.toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="mt-auto pt-4 border-t border-trade-border space-y-4 flex-shrink-0">
                    <Button
                        onClick={handleLogTrade}
                        disabled={hasSubmitted && !isFormValid}
                        className={cn(
                            "w-full text-white shadow-lg transition-all h-11 font-bold tracking-wide text-sm",
                            isLong
                                ? "bg-trade-success hover:bg-trade-success/90 shadow-trade-success/25"
                                : "bg-trade-loss hover:bg-trade-loss/90 shadow-trade-loss/25"
                        )}
                    >
                        <Save className="w-4 h-4 mr-2" />
                        {isLong ? 'BUY' : 'SELL'} {input.asset}
                    </Button>
                </div>
            </div>
        </div>
    );
}
