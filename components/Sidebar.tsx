'use client';

import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { NO_SHOP, SHOPS_CHANGED_EVENT, notifyShopsChanged, shopColor, type ShopsResponse } from '@/lib/shops';

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
  store: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0V9z" />
      <path d="M5 14v6h14v-6" />
    </svg>
  ),
};

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  matchExact?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [shopData, setShopData] = useState<ShopsResponse | null>(null);

  const onDashboard = pathname === '/' || pathname === '/cases';
  // Shop currently in focus — carried over to "New Dispute" so it's preselected.
  const currentShop = searchParams.get('shop');

  const loadShops = useCallback(() => {
    fetch('/api/shops')
      .then((r) => r.json())
      .then((d: ShopsResponse) => setShopData(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadShops();
    window.addEventListener(SHOPS_CHANGED_EVENT, loadShops);
    return () => window.removeEventListener(SHOPS_CHANGED_EVENT, loadShops);
  }, [loadShops]);

  const navItems: NavItem[] = [
    { href: '/', label: 'Dashboard', icon: Icon.dashboard },
    {
      href: currentShop && currentShop !== NO_SHOP ? `/new?shop=${currentShop}` : '/new',
      label: 'New Dispute',
      icon: Icon.plus,
      matchExact: true,
    },
    { href: '/shops', label: 'Manage shops', icon: Icon.store, matchExact: true },
  ];

  useEffect(() => { setOpen(false); }, [pathname, currentShop]);

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
              const path = item.href.split('?')[0];
              const active = path === '/'
                ? onDashboard
                : item.matchExact ? pathname === path : pathname.startsWith(path);
              return (
                <NavLink key={item.label} href={item.href} icon={item.icon} label={item.label} active={active} />
              );
            })}
          </Section>

          <Section label="Shops">
            <ShopLink
              href="/"
              label="All shops"
              active={onDashboard && !currentShop}
            />
            {shopData?.shops.map((s) => (
              <ShopLink
                key={s.id}
                href={`/?shop=${s.id}`}
                label={s.name}
                color={shopColor(s)}
                count={s.pendingCount}
                active={onDashboard && currentShop === s.id}
              />
            ))}
            {!!shopData?.unassignedCount && (
              <ShopLink
                href={`/?shop=${NO_SHOP}`}
                label="No shop"
                count={shopData.unassignedCount}
                countTitle="disputes without a shop"
                active={onDashboard && currentShop === NO_SHOP}
                muted
              />
            )}
            <AddShop />
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

function AddShop() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setOpen(false);
    setName('');
    setError(null);
  }

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    setError(null);
    const res = await fetch('/api/shops', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: trimmed }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? 'Could not add shop');
      return;
    }
    close();
    notifyShopsChanged();
    router.push(`/?shop=${data.id}`);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm text-text-muted hover:text-accent-violet hover:bg-bg-hover transition-colors"
      >
        <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-3.5 h-3.5">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className="font-medium">Add shop</span>
      </button>
    );
  }

  return (
    <div className="px-1 pt-1">
      <input
        className="input-field py-1.5"
        placeholder="Shop name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') close();
        }}
        autoFocus
      />
      {error && <p className="text-accent-red text-[11px] mt-1 px-1">{error}</p>}
      <div className="flex gap-1.5 mt-1.5">
        <button onClick={close} className="btn-secondary flex-1 text-xs px-2 py-1">Cancel</button>
        <button onClick={submit} disabled={!name.trim() || busy} className="btn-primary flex-1 text-xs px-2 py-1">
          {busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </div>
  );
}

function ShopLink({
  href,
  label,
  active,
  color,
  count,
  countTitle = 'pending disputes',
  muted,
}: {
  href: string;
  label: string;
  active: boolean;
  color?: string;
  count?: number;
  countTitle?: string;
  muted?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-colors duration-150 ${
        active
          ? 'bg-accent-violet/10 text-accent-violet'
          : muted
            ? 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
            : 'text-text-secondary hover:text-text-primary hover:bg-bg-hover'
      }`}
    >
      <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
        {color ? (
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        ) : (
          <span className={`w-2 h-2 rounded-full border ${muted ? 'border-dashed border-text-muted' : 'border-current'}`} />
        )}
      </span>
      <span className="font-medium truncate flex-1">{label}</span>
      {!!count && (
        <span title={`${count} ${countTitle}`} className="text-[10px] font-semibold text-text-muted tabular-nums">
          {count}
        </span>
      )}
    </Link>
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
