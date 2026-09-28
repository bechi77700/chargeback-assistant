import { Suspense } from 'react';
import Sidebar from './Sidebar';
import DoDontPanel from './DoDontPanel';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      {/* Sidebar reads ?shop= from the URL, which needs a Suspense boundary */}
      <Suspense fallback={<div className="hidden md:block w-60 flex-shrink-0 bg-bg-elevated border-r border-bg-border" />}>
        <Sidebar />
      </Suspense>
      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        {children}
      </main>
      <DoDontPanel />
    </div>
  );
}
