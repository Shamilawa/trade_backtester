
'use client';

import React, { useState } from 'react';
import TradeCalculator from '@/components/TradeCalculator';
import TradeHistoryTable from '@/components/TradeHistoryTable';
import { Drawer } from '@/components/ui/drawer';
import { Button } from '@/components/ui/common';
import { Plus } from 'lucide-react';

export default function Home() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12 font-[family-name:var(--font-geist-sans)]">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Trade Logs</h1>
            <p className="text-slate-500 text-sm">Manage and track your trading positions.</p>
          </div>
          <Button
            onClick={() => setIsDrawerOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Trade
          </Button>
        </header>

        <TradeHistoryTable />

        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="New Trade"
          description="Calculate position size, risk, and partial exits."
        >
          <div className="mt-4">
            <TradeCalculator onClose={() => setIsDrawerOpen(false)} />
          </div>
        </Drawer>
      </div>
    </main>
  );
}

