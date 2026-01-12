'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Input, Label } from './ui/common';
import { TradeLog } from '@/types';
import { useTradeStore } from '@/store/tradeStore';
import { X, Plus, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagsModalProps {
    isOpen: boolean;
    onClose: () => void;
    trade: TradeLog | null;
}

export default function TagsModal({ isOpen, onClose, trade }: TagsModalProps) {
    const { updateTags, history, activeSessionId } = useTradeStore();
    const [currentTags, setCurrentTags] = useState<string[]>([]);
    const [newTag, setNewTag] = useState('');
    const [availableTags, setAvailableTags] = useState<string[]>([]);

    useEffect(() => {
        if (trade) {
            setCurrentTags(trade.tags || []);
        }
    }, [trade]);

    useEffect(() => {
        // Derive unique tags from history for the current session
        if (activeSessionId) {
            const sessionTrades = history.filter(h => h.sessionId === activeSessionId && h.type === 'TRADE') as TradeLog[];
            const allTags = sessionTrades.flatMap(t => t.tags || []);
            const uniqueTags = Array.from(new Set(allTags)).sort();
            setAvailableTags(uniqueTags);
        }
    }, [history, activeSessionId]);

    const handleAddTag = () => {
        const tag = newTag.trim();
        if (tag && !currentTags.includes(tag)) {
            setCurrentTags([...currentTags, tag]);
            setNewTag('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault(); // Prevent form submission if any
            handleAddTag();
        }
    };

    const removeTag = (tagToRemove: string) => {
        setCurrentTags(currentTags.filter(tag => tag !== tagToRemove));
    };

    const toggleAvailableTag = (tag: string) => {
        if (currentTags.includes(tag)) {
            removeTag(tag);
        } else {
            setCurrentTags([...currentTags, tag]);
        }
    };

    const handleSave = () => {
        if (trade) {
            updateTags(trade.id, currentTags);
            onClose();
        }
    };

    if (!trade) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] bg-trade-bg border-trade-border text-trade-text-primary">
                <DialogHeader>
                    <DialogTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                        <Tag size={16} /> Manage Tags
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4">
                    {/* Active Tags */}
                    <div className="flex flex-wrap gap-2 min-h-[40px] p-2 bg-trade-surface/30 border border-trade-border/50 rounded-md">
                        {currentTags.length === 0 ? (
                            <span className="text-xs text-trade-text-muted italic self-center">No tags added...</span>
                        ) : (
                            currentTags.map(tag => (
                                <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-trade-primary/20 text-trade-primary text-xs rounded-full border border-trade-primary/30">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="hover:text-trade-loss transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2">
                        <Input
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type new tag..."
                            className="flex-1 bg-trade-surface border-trade-border text-xs h-8"
                        />
                        <Button onClick={handleAddTag} variant="ghost" className="h-8 w-8 p-0 border border-trade-border hover:bg-trade-surface-hover">
                            <Plus size={16} />
                        </Button>
                    </div>

                    {/* Available Tags */}
                    {availableTags.length > 0 && (
                        <div className="flex flex-col gap-2 mt-2">
                            <span className="text-[10px] uppercase font-bold text-trade-text-muted">Previously Used</span>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map(tag => {
                                    const isSelected = currentTags.includes(tag);
                                    return (
                                        <button
                                            key={tag}
                                            onClick={() => toggleAvailableTag(tag)}
                                            className={cn(
                                                "px-2 py-1 text-xs rounded-full border transition-all",
                                                isSelected
                                                    ? "bg-trade-primary/20 text-trade-primary border-trade-primary/30 opacity-50 cursor-default" // Visually indicate it's already added, or maybe allow toggling off?
                                                    // Let's actually make it toggleable.
                                                    : "bg-trade-surface border-trade-border text-trade-text-secondary hover:border-trade-primary/50 hover:text-trade-primary"
                                            )}
                                        >
                                            {tag}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} className="text-xs h-8">
                        Cancel
                    </Button>
                    <Button onClick={handleSave} className="bg-trade-primary text-white hover:bg-trade-primary/90 text-xs font-bold h-8">
                        Save Tags
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
