'use client';

import React from 'react';
import { LayoutDashboard, Settings, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/common';

export default function Sidebar() {
    return (
        <aside className="w-[60px] md:w-[240px] flex-shrink-0 border-r border-trade-border bg-trade-surface/50 backdrop-blur-md flex flex-col h-full z-20 transition-all duration-300">
            {/* Brand / Logo Area */}
            <div className="h-[50px] flex items-center justify-center md:justify-start md:px-6 border-b border-trade-border">
                <div className="h-6 w-6 rounded bg-trade-primary flex items-center justify-center shrink-0">
                    <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="hidden md:block ml-3 font-bold text-trade-text-primary tracking-tight">TRADER</span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 space-y-1 px-2 md:px-3">
                <NavItem
                    icon={<LayoutDashboard className="w-5 h-5" />}
                    label="Trade Log"
                    isActive
                />
                <NavItem
                    icon={<LineChart className="w-5 h-5" />}
                    label="Analytics"
                    isActive={false} // Placeholder
                    disabled
                />
            </nav>

            {/* Bottom Section */}
            <div className="p-2 md:p-3 border-t border-trade-border">
                <NavItem
                    icon={<Settings className="w-5 h-5" />}
                    label="Settings"
                    isActive={false}
                />
            </div>
        </aside>
    );
}

function NavItem({ icon, label, isActive, disabled }: { icon: React.ReactNode, label: string, isActive?: boolean, disabled?: boolean }) {
    return (
        <button
            disabled={disabled}
            className={cn(
                "w-full flex items-center justify-center md:justify-start px-2 md:px-3 py-2 rounded-[4px] transition-colors group",
                isActive
                    ? "bg-trade-surface-hover text-trade-primary"
                    : "text-trade-text-secondary hover:bg-trade-surface-hover/50 hover:text-trade-text-primary",
                disabled && "opacity-50 cursor-not-allowed hover:bg-transparent hover:text-trade-text-secondary"
            )}
        >
            <div className={cn("shrink-0", isActive ? "text-trade-primary" : "text-trade-text-muted group-hover:text-trade-text-primary")}>
                {icon}
            </div>
            <span className="hidden md:block ml-3 text-sm font-medium">{label}</span>
            {isActive && <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-trade-primary" />}
        </button>
    );
}
