'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { saveLog } from '@/app/actions';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Button,
    Input,
    Label
} from '@/components/ui/common';
import { Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WithdrawalModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function WithdrawalModal({ open, onOpenChange }: WithdrawalModalProps) {
    const { input, addTransaction } = useTradeStore();
    const [amount, setAmount] = useState<number | ''>('');
    const [error, setError] = useState<string | null>(null);

    const currentBalance = input.accountBalance;
    const maxWithdrawal = currentBalance;

    const handleWithdraw = () => {
        const val = Number(amount);
        if (isNaN(val) || val <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (val > maxWithdrawal) {
            setError('Insufficient funds');
            return;
        }

        addTransaction('WITHDRAWAL', val, 'Manual Withdrawal');

        // Persist to DB
        const state = useTradeStore.getState();
        if (state.activeSessionId && state.history.length > 0) {
            const latestLog = state.history[0];
            saveLog(state.activeSessionId, latestLog); // Fire and forget or await? 
            // Better to await if possible, but inside event handler implies fire and forget is okay-ish if we don't block closing.
            // But we should probably catch errors? For now keep simple.
        }

        onOpenChange(false);
        setAmount('');
        setError(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wallet className="w-5 h-5 text-trade-primary" />
                        Withdraw Funds
                    </DialogTitle>
                    <DialogDescription>
                        Enter the amount you wish to withdraw from your account.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <Label htmlFor="amount">Amount</Label>
                            <span className="text-trade-text-muted">
                                Available: <span className="text-trade-text-primary font-mono">${currentBalance.toFixed(2)}</span>
                            </span>
                        </div>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={(e) => {
                                setAmount(e.target.valueAsNumber);
                                setError(null);
                            }}
                            className={cn(
                                "font-mono",
                                error && "border-trade-loss focus-visible:ring-trade-loss"
                            )}
                            placeholder="0.00"
                        />
                        {error && <span className="text-[10px] text-trade-loss">{error}</span>}
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleWithdraw} disabled={!amount || Number(amount) <= 0 || Number(amount) > maxWithdrawal}>
                        Withdraw
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
