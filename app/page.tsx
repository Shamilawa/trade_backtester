import React from 'react';
import SessionList from '@/components/SessionList';
import { getRecentSessions } from './actions';

export default async function Home() {
  const sessions = await getRecentSessions();

  return (
    <main className="min-h-screen w-full bg-trade-bg text-trade-text">
      {/* We can refactor SessionList to accept initialSessions or we pass them to a new wrapper. 
            Let's check SessionList implementation first. 
            Assuming SessionList is a client component.
        */}
      <SessionList initialSessions={sessions} />
    </main>
  );
}
