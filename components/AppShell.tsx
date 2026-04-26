import Sidebar from './Sidebar';
import DoDontPanel from './DoDontPanel';

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-bg-base overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-12 md:pt-0">
        {children}
      </main>
      <DoDontPanel />
    </div>
  );
}
