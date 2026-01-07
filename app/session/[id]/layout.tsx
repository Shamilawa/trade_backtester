import Sidebar from '@/components/Sidebar';
import React from 'react';

export default function SessionLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="h-screen w-screen overflow-hidden bg-trade-bg text-trade-text flex flex-col md:flex-row">
            <Sidebar />
            <div className="flex-1 h-full overflow-hidden relative flex flex-col">
                {children}
            </div>
        </div>
    );
}
