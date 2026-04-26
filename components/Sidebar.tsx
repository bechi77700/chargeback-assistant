'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const Icon = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  list: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchExact?: boolean;
}

const navItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: Icon.dashboard, matchExact: true },
  { href: '/new', label: 'New Dispute', icon: Icon.plus, matchExact: true },
  { href: '/cases', label: 'All Cases', icon: Icon.list },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  return (
    <>
      <div className="md:hidden fixed top-0 inset-x-0 z-30 h-12 bg-bg-elevated/95 backdrop-blur border-b border-bg-border flex items-center justify-between px-3">
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-9 h-9 rounded-lg flex items-center justify-center text-text-primary hover:bg-bg-hover transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-5 h-5">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="logo-mark w-6 h-6 text-xs">CB</div>
          <span className="text-text-primary font-semibold text-sm tracking-tight">Chargeback</span>
        </Link>
        <span className="w-9" />
      </div>

      {open && (
        <div onClick={() => setOpen(false)} className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" aria-hidden />
      )}

      <aside
        className={`
          ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          fixed md:relative inset-y-0 left-0 z-50
          w-64 md:w-60 bg-bg-elevated border-r border-bg-border
          flex flex-col h-screen flex-shrink-0
          transition-transform duration-200 ease-out
        `}
      >
        <div className="px-4 py-5 border-b border-bg-border flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="logo-mark text-xs">CB</div>
            <span className="text-text-primary font-semibold text-base tracking-tight group-hover:text-accent-violet transition-colors">
              Chargeback Assistant
            </span>
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="md:hidden w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-hover transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-4 h-4">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          <Section label="Workspace">
            {navItems.map((item) => {
              const active = item.matchExact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <NavLink key={item.href} href={item.href} icon={item.icon} label={item.label} active={active} />
              );
            })}
          </Section>
        </div>

        <div className="px-4 py-3 border-t border-bg-border">
          <p className="text-text-muted text-[10px] uppercase tracking-widest">Shopify · Customer Support</p>
        </div>
      </aside>
    </>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="px-2.5 mb-2">
        <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">{label}</p>
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${
        active
          ? 'bg-accent-violet/10 text-accent-violet'
          : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      }`}
    >
      <span className={active ? 'text-accent-violet' : 'text-text-muted'}>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}
