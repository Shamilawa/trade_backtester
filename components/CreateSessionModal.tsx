'use client';

import React, { useState } from 'react';
import { useTradeStore } from '@/store/tradeStore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, Button, Input, Label } from './ui/common';
import { Plus, Briefcase, DollarSign } from 'lucide-react';

import { createSession as createSessionAction } from '@/app/actions';
import { useRouter } from 'next/navigation';

export default function CreateSessionModal({ onSessionCreated }: { onSessionCreated?: () => void }) {
    const { createSession } = useTradeStore(); // Keep for store sync if needed, but we rely on server now?
    // Actually, if we navigate to the new session, the page load will init the store.
    // So we don't strictly need to update the client store here if we redirect.

    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [balance, setBalance] = useState(10000);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || balance <= 0) return;

        // server action
        const newId = await createSessionAction(name, balance);

        // Update local store just in case (optional, but good for consistency/optimistic)
        // createSession(name, balance); // This generates a NEW ID locally which is WRONG. 
        // We should NOT call store.createSession unless we can force the ID.
        // The store logic uses uuidv4(). We should probably avoid using store.createSession here.

        setOpen(false);
        setName('');
        setBalance(10000);

        if (onSessionCreated) {
            onSessionCreated();
        } else {
            // Default behavior if no callback? Maybe redirect immediately?
            // router.push(`/session/${newId}`); // If we want to auto-open
        }

        router.refresh(); // Refresh server components to show up in list
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-trade-primary hover:bg-trade-primary/90 text-white shadow-lg shadow-trade-primary/20">
                    <Plus className="w-4 h-4 mr-2" />
                    New Session
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-trade-surface border-trade-border text-trade-text-primary sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Start New Session</DialogTitle>
                    <DialogDescription className="text-trade-text-muted">
                        Create a separate workspace for a new strategy or testing period.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Session Name</Label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-trade-text-muted" />
                            <Input
                                placeholder="e.g. Scalping Gold Jan 2024"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="pl-9 bg-trade-bg border-trade-border focus-visible:ring-trade-primary"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Starting Balance</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-trade-text-muted" />
                            <Input
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(Number(e.target.value))}
                                className="pl-9 font-mono bg-trade-bg border-trade-border focus-visible:ring-trade-primary"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-trade-border hover:bg-trade-bg hover:text-trade-text-primary">
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-trade-primary hover:bg-trade-primary/90 text-white">
                            Create Session
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
