'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    description?: string;
}

export function Drawer({ isOpen, onClose, children, title, description }: DrawerProps) {
    // Prevent scrolling when drawer is open
    React.useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <>

            {/* Backdrop */}
            {/* Backdrop - Invisible but handles clicks */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={onClose}
                />
            )}

            {/* Drawer Panel */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 z-50 h-full w-full max-w-[1500px] bg-white shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col border-l border-slate-100",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        {title && <h2 className="text-xl font-semibold text-slate-900">{title}</h2>}
                        {description && <p className="text-sm text-slate-500 mt-1">{description}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-slate-100 text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                    {children}
                </div>
            </div>
        </>
    );
}
