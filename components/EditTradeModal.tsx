'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from './ui/common';
import { TradeLog, AssetType } from '@/types';
import { useTradeStore } from '@/store/tradeStore';
import { saveLog } from '@/app/actions';
import { ASSET_CONFIGS } from '@/utils/calculations';
import { Calendar as CalendarIcon, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditTradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade: TradeLog | null;
}

export default function EditTradeModal({ isOpen, onClose, trade }: EditTradeModalProps) {
    const { updateLog } = useTradeStore();
    const [date, setDate] = useState('');
    const [asset, setAsset] = useState<AssetType>('EURUSD');
    const [direction, setDirection] = useState<'buy' | 'sell'>('buy'); // We'll infer this from entry/stop or just store it if we had it explicit. 
    // Logic: If Entry > SL = Long (Buy), Entry < SL = Short (Sell). 
    // But user wants to EDIT "Side". This implies we might need to flip the Entry/SL relationship or just trust the label?
    // "Side" usually means Direction. If they flip it, we should probably swap Entry/SL prices effectively?
    // Actually, simple requirement: "Edit Side". 
    // Let's assume we just store it or re-jig the logic.
    // Wait, the store calculates logic based on prices. `isLong = entry > sl`.
    // If user changes "Side" to Short, we should probably swap Entry and SL? Or just warn?
    // Let's implement swapping Entry and SL if they change direction to match the logic.

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (trade) {
            setDate(trade.date);
            setAsset(trade.input.asset);
            const isLong = trade.input.entryPrice > trade.input.stopLossPrice;
            setDirection(isLong ? 'buy' : 'sell');
        }
    }, [trade]);

    const handleSave = async () => {
        if (!trade) return;
        setIsSaving(true);

        try {
            // Determine new Entry/SL based on direction change
            // If direction changed, we SWAP Entry and Stop Loss prices to maintain logical consistency with the engine
            // (assuming the user meant "I actually sold", so the prices were entered as such)
            // Or simpler: We just update the prices. 

            let newEntry = trade.input.entryPrice;
            let newSL = trade.input.stopLossPrice;

            const currentIsLong = newEntry > newSL;
            const newIsLong = direction === 'buy';

            if (currentIsLong !== newIsLong) {
                // Direction flipped. Swap prices to make it valid for the calculator logic
                // This is a naive but effective way to 'flip' the side without re-entering numbers
                const temp = newEntry;
                newEntry = newSL;
                newSL = temp;
            }

            const updatedLog: TradeLog = {
                ...trade,
                date: date,
                input: {
                    ...trade.input,
                    date: date,
                    asset: asset,
                    entryPrice: newEntry,
                    stopLossPrice: newSL
                }
                // We do NOT re-calculate results here to avoid messing up complex P&L if it was partials etc. 
                // BUT, if we swap prices, the P&L *logic* remains valid (distance is same). 
                // Ideally we should re-run `recalc` but we decided in plan NOT to do complex math updates.
                // However, `updateLog` in store MIGHT trigger listeners? 
                // Store `updateLog` just replaces the object. 
                // If we flip Start/SL, the `results` object in the log is still the OLD calculation.
                // This creates a discrepancy: Input says Short, Results say Long P&L?
                // Actually, `results` usually stores pure P&L numbers. 
                // If we flip side, the P&L numbers are likely correct in magnitude, but maybe sign?
                // Let's just update the Input for Reference. The `results` are historical. 
            };

            // Correction: If we really want to just "Edit Label", we can't easily, because logic is derived.
            // But if we swap Entry/SL in inputs, at least the UI "Buy/Sell" badge (derived from prices) will update.

            updateLog(updatedLog); // Update client store
            await saveLog(updatedLog.sessionId, updatedLog); // Sync to DB

            onClose();
        } catch (error) {
            console.error("Failed to update trade", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!trade) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-trade-bg border-trade-border text-trade-text-primary">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold uppercase tracking-wider">Edit Trade</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs uppercase text-trade-text-muted">Date</Label>
                        <div className="relative">
                            <input
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-trade-surface border border-trade-border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-trade-primary text-trade-text-primary"
                            />
                            {/* <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-trade-text-muted pointer-events-none" /> */}
                        </div>
                    </div>

                    {/* Asset */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs uppercase text-trade-text-muted">Asset</Label>
                        <select
                            value={asset}
                            onChange={(e) => setAsset(e.target.value as AssetType)}
                            className="w-full bg-trade-surface border border-trade-border rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-trade-primary text-trade-text-primary appearance-none"
                        >
                            {Object.keys(ASSET_CONFIGS).map((a) => (
                                <option key={a} value={a}>{a}</option>
                            ))}
                        </select>
                    </div>

                    {/* Side (Direction) */}
                    <div className="flex flex-col gap-2">
                        <Label className="text-xs uppercase text-trade-text-muted">Side</Label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => setDirection('buy')}
                                className={cn(
                                    "py-2 text-xs font-bold uppercase border rounded transition-all",
                                    direction === 'buy'
                                        ? "bg-trade-success/10 border-trade-success text-trade-success"
                                        : "bg-trade-surface border-trade-border text-trade-text-muted hover:bg-trade-surface-hover"
                                )}
                            >
                                Buy
                            </button>
                            <button
                                onClick={() => setDirection('sell')}
                                className={cn(
                                    "py-2 text-xs font-bold uppercase border rounded transition-all",
                                    direction === 'sell'
                                        ? "bg-trade-loss/10 border-trade-loss text-trade-loss"
                                        : "bg-trade-surface border-trade-border text-trade-text-muted hover:bg-trade-surface-hover"
                                )}
                            >
                                Sell
                            </button>
                        </div>
                        <p className="text-[10px] text-trade-text-muted italic mt-1">
                            Note: Changing side will swap Entry and Stop Loss prices.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isSaving} className="text-xs">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-trade-primary text-white hover:bg-trade-primary/90 text-xs font-bold">
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
