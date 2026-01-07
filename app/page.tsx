'use client';

import React from 'react';
import SessionList from '@/components/SessionList';

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-trade-bg text-trade-text">
      <SessionList />
    </main>
  );
}
