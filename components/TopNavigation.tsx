'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/common';
import { Session } from '@/types';

interface TopNavigationProps {
    session: Session;
    children?: React.ReactNode;
}

export default function TopNavigation({ session, children }: TopNavigationProps) {
    const router = useRouter();

    return (
        <div className="flex-none h-[50px] p-3 border-b border-trade-border bg-trade-surface flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    onClick={() => router.push('/')}
                    className="h-8 px-2 text-trade-text-muted hover:text-trade-text-primary"
                >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Lobby
                </Button>
                <div className="h-4 w-px bg-trade-border mx-2" />
                <h2 className="text-sm font-semibold text-trade-text-primary">
                    {session.name}
                </h2>
            </div>
            <div className="flex items-center gap-2">
                {children}
            </div>
        </div>
    );
}
