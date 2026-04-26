'use client';

import { useEffect, useState } from 'react';

const DOS = [
  'Respond within 5 business days',
  'Contact sourcing agent same day for shipping docs',
  'Wait for delivery confirmation before responding (INR)',
  'Be factual and professional',
  'Name exhibit files clearly',
];

const DONTS = [
  'Ignore any dispute — unanswered = automatic loss',
  'Admit fault or offer refund in the response',
  'Submit INR without delivery proof if deadline allows',
  'Upload out-of-order exhibit files',
  'Close a case without logging the outcome',
];

export default function DoDontPanel() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('dodont_open') : null;
    if (stored === '1') setOpen(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('dodont_open', open ? '1' : '0');
  }, [open]);

  return (
    <div className="fixed bottom-4 right-4 z-30 w-[min(360px,calc(100vw-2rem))] pointer-events-none">
      <div className="card pointer-events-auto shadow-xl overflow-hidden">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-bg-hover transition-colors"
          aria-expanded={open}
        >
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-violet shadow-glow-violet" />
            <span className="text-text-primary text-sm font-semibold">Quick rules</span>
          </div>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 text-text-muted transition-transform ${open ? '' : 'rotate-180'}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        {open && (
          <div className="px-4 pb-4 pt-1 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-bg-border animate-fade-in">
            <div>
              <p className="text-accent-green text-[10px] uppercase tracking-widest font-semibold mb-2">✅ Do</p>
              <ul className="space-y-1.5">
                {DOS.map((d) => (
                  <li key={d} className="text-text-secondary text-xs leading-snug">{d}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-accent-red text-[10px] uppercase tracking-widest font-semibold mb-2">❌ Don&apos;t</p>
              <ul className="space-y-1.5">
                {DONTS.map((d) => (
                  <li key={d} className="text-text-secondary text-xs leading-snug">{d}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
