'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import DeadlinePill from '@/components/DeadlinePill';
import { disputeEmoji } from '@/lib/dispute-types';
import {
  evidenceLine,
  fmtShortDate,
  outcomeFromStatus,
  packageStatusLabel,
  shortDisputeLabel,
} from '@/lib/case-display';

interface Case {
  id: string;
  orderNumber: string;
  disputeType: string;
  deadline: string;
  status: string;
  step: number;
  amount: number | null;
  customerName: string | null;
  packageStatus: string | null;
  evidence: string;
  notes: string | null;
  createdAt: string;
  submittedAt: string | null;
  closedAt: string | null;
}

type OutcomeFilter = 'all' | 'pending' | 'won' | 'lost';
type SortKey =
  | 'orderNumber' | 'disputeType' | 'createdAt' | 'deadline' | 'submittedAt'
  | 'packageStatus' | 'outcome' | 'amount';

function resumeHref(c: Case): string {
  if (c.status === 'won' || c.status === 'lost' || c.status === 'submitted') {
    return `/cases/${c.id}/logged`;
  }
  if (c.step >= 4) return `/cases/${c.id}/response`;
  if (c.step >= 3) return `/cases/${c.id}/evidence`;
  return `/cases/${c.id}/details`;
}

const OUTCOME_PILL: Record<'Pending' | 'Won' | 'Lost', string> = {
  Pending: 'bg-orange-500/15 text-orange-400 border-orange-500/40',
  Won: 'bg-accent-green/15 text-accent-green border-accent-green/40',
  Lost: 'bg-accent-red/15 text-accent-red border-accent-red/40',
};

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OutcomeFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('deadline');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [confirmDelete, setConfirmDelete] = useState<Case | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/cases')
      .then((r) => r.json())
      .then((data) => {
        setCases(data);
        setLoading(false);
      });
  }, []);

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = cases.length;
    const won = cases.filter((c) => c.status === 'won');
    const lost = cases.filter((c) => c.status === 'lost');
    const decided = won.length + lost.length;
    const winRate = decided ? Math.round((won.length / decided) * 100) : null;
    const recovered = won.reduce((sum, c) => sum + (c.amount ?? 0), 0);
    const lostAmount = lost.reduce((sum, c) => sum + (c.amount ?? 0), 0);
    const submitted = cases.filter((c) => c.submittedAt);
    const avgResp = submitted.length
      ? submitted.reduce((sum, c) => {
          const ms = new Date(c.submittedAt!).getTime() - new Date(c.createdAt).getTime();
          return sum + ms / (1000 * 60 * 60);
        }, 0) / submitted.length
      : null;
    return { total, winRate, recovered, lostAmount, avgResp };
  }, [cases]);

  // ── Filter + sort ────────────────────────────────────────────────────────
  const visibleCases = useMemo(() => {
    let rows = cases;
    if (filter === 'pending') rows = rows.filter((c) => c.status === 'draft' || c.status === 'submitted');
    else if (filter === 'won') rows = rows.filter((c) => c.status === 'won');
    else if (filter === 'lost') rows = rows.filter((c) => c.status === 'lost');

    const dir = sortDir === 'asc' ? 1 : -1;
    const get = (c: Case): string | number => {
      switch (sortKey) {
        case 'orderNumber': return c.orderNumber;
        case 'disputeType': return shortDisputeLabel(c.disputeType);
        case 'createdAt': return new Date(c.createdAt).getTime();
        case 'deadline': return new Date(c.deadline).getTime();
        case 'submittedAt': return c.submittedAt ? new Date(c.submittedAt).getTime() : Number.MAX_SAFE_INTEGER;
        case 'packageStatus': return c.packageStatus ?? '';
        case 'outcome': return outcomeFromStatus(c.status);
        case 'amount': return c.amount ?? -1;
      }
    };
    return [...rows].sort((a, b) => {
      const va = get(a); const vb = get(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
  }, [cases, filter, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  }

  // ── Inline updates ───────────────────────────────────────────────────────
  async function patchCase(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/cases/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setCases((prev) => prev.map((c) => (c.id === id ? updated : c)));
    }
  }

  async function changeOutcome(c: Case, newOutcome: 'Pending' | 'Won' | 'Lost') {
    const status = newOutcome === 'Pending' ? (c.submittedAt ? 'submitted' : 'draft') : newOutcome.toLowerCase();
    await patchCase(c.id, { status, skipTimestamp: true });
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    const id = confirmDelete.id;
    const res = await fetch(`/api/cases/${id}`, { method: 'DELETE' });
    if (res.ok) setCases((prev) => prev.filter((c) => c.id !== id));
    setDeleting(false);
    setConfirmDelete(null);
  }

  // ── CSV export ───────────────────────────────────────────────────────────
  function exportCsv() {
    const rows = [
      ['Order #', 'Dispute type', 'Date opened', 'Response deadline', 'Date responded',
       'Package status', 'Evidence submitted', 'Outcome', 'Amount', 'Notes'],
      ...visibleCases.map((c) => [
        c.orderNumber,
        shortDisputeLabel(c.disputeType),
        fmtShortDate(c.createdAt),
        fmtShortDate(c.deadline),
        fmtShortDate(c.submittedAt),
        packageStatusLabel(c.packageStatus),
        evidenceLine(c),
        outcomeFromStatus(c.status),
        c.amount != null ? c.amount.toFixed(2) : '',
        c.notes ?? '',
      ]),
    ];
    const csv = rows
      .map((r) => r.map((cell) => {
        const s = String(cell ?? '');
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      }).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chargebacks-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-10">
        {/* Hero */}
        <div className="mb-8">
          <p className="text-accent-violet text-xs font-semibold uppercase tracking-widest mb-2">
            ● Dispute desk
          </p>
          <h1 className="text-text-primary text-3xl md:text-4xl font-bold tracking-tight">
            Tracking sheet
          </h1>
          <p className="text-text-muted mt-2">
            Every dispute, every column. Click a row to resume the case, edit notes inline, or change the outcome.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <Stat label="Total disputes" value={String(stats.total)} />
          <Stat label="Win rate" value={stats.winRate == null ? '—' : `${stats.winRate}%`} accent />
          <Stat label="Recovered" value={`$${stats.recovered.toFixed(0)}`} tone="green" />
          <Stat label="Lost" value={`$${stats.lostAmount.toFixed(0)}`} tone="red" />
          <Stat label="Avg response" value={stats.avgResp == null ? '—' : `${stats.avgResp.toFixed(1)}h`} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} count={cases.length} />
            <FilterChip
              label="Pending"
              active={filter === 'pending'}
              onClick={() => setFilter('pending')}
              count={cases.filter((c) => c.status === 'draft' || c.status === 'submitted').length}
            />
            <FilterChip label="Won" active={filter === 'won'} onClick={() => setFilter('won')} count={cases.filter((c) => c.status === 'won').length} />
            <FilterChip label="Lost" active={filter === 'lost'} onClick={() => setFilter('lost')} count={cases.filter((c) => c.status === 'lost').length} />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} disabled={visibleCases.length === 0} className="btn-secondary text-sm">
              ↓ Export CSV
            </button>
            <Link href="/new" className="btn-primary text-sm">+ New Dispute</Link>
          </div>
        </div>

        {/* Spreadsheet table */}
        {loading ? (
          <div className="card h-64 shimmer" />
        ) : visibleCases.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="logo-mark mx-auto mb-4 w-12 h-12 text-base">CB</div>
            <p className="text-text-primary font-medium">
              {filter === 'all' ? 'No disputes yet' : `No ${filter} disputes`}
            </p>
            <p className="text-text-muted text-sm mt-1">
              {filter === 'all' ? 'Start a new dispute to begin.' : 'Adjust the filter to see other cases.'}
            </p>
            {filter === 'all' && (
              <Link href="/new" className="btn-primary inline-block mt-5">+ New Dispute</Link>
            )}
          </div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-bg-elevated/60 border-b border-bg-border sticky top-0 z-10">
                <tr className="text-left text-text-muted text-[11px] uppercase tracking-widest">
                  <Th label="Order #" sortKey="orderNumber" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Dispute type" sortKey="disputeType" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Date opened" sortKey="createdAt" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Response deadline" sortKey="deadline" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Date responded" sortKey="submittedAt" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Package status" sortKey="packageStatus" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <th className="px-3 py-2.5 font-medium">Evidence submitted</th>
                  <Th label="Outcome" sortKey="outcome" current={sortKey} dir={sortDir} onSort={toggleSort} />
                  <Th label="Amount" sortKey="amount" current={sortKey} dir={sortDir} onSort={toggleSort} align="right" />
                  <th className="px-3 py-2.5 font-medium">Notes</th>
                  <th className="px-2 py-2.5 font-medium w-10" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {visibleCases.map((c) => {
                  const outcome = outcomeFromStatus(c.status);
                  return (
                    <tr
                      key={c.id}
                      className="border-b border-bg-border last:border-b-0 hover:bg-bg-hover/40 transition-colors group"
                    >
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <Link href={resumeHref(c)} className="text-text-primary font-semibold font-mono hover:text-accent-violet">
                          #{c.orderNumber}
                        </Link>
                        {c.customerName && (
                          <div className="text-text-muted text-[11px] mt-0.5">{c.customerName}</div>
                        )}
                      </td>
                      <td className="px-3 py-2.5 align-top whitespace-nowrap text-text-secondary">
                        <span className="mr-1.5">{disputeEmoji(c.disputeType)}</span>
                        {shortDisputeLabel(c.disputeType)}
                      </td>
                      <td className="px-3 py-2.5 align-top text-text-muted whitespace-nowrap">{fmtShortDate(c.createdAt)}</td>
                      <td className="px-3 py-2.5 align-top whitespace-nowrap">
                        <DeadlinePill deadline={c.deadline} size="xs" />
                      </td>
                      <td className="px-3 py-2.5 align-top text-text-muted whitespace-nowrap">{fmtShortDate(c.submittedAt) || '—'}</td>
                      <td className="px-3 py-2.5 align-top text-text-secondary whitespace-nowrap">{packageStatusLabel(c.packageStatus) || '—'}</td>
                      <td className="px-3 py-2.5 align-top text-text-secondary text-[12px] leading-snug max-w-[220px]">
                        {evidenceLine(c) || <span className="text-text-muted">—</span>}
                      </td>
                      <td className="px-3 py-2.5 align-top">
                        <OutcomeSelect value={outcome} onChange={(v) => changeOutcome(c, v)} />
                      </td>
                      <td className="px-3 py-2.5 align-top text-right text-text-primary font-mono whitespace-nowrap">
                        {c.amount != null ? `$${c.amount.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-3 py-2.5 align-top min-w-[180px]">
                        <NotesCell
                          initial={c.notes ?? ''}
                          onSave={(v) => patchCase(c.id, { notes: v })}
                        />
                      </td>
                      <td className="px-2 py-2.5 align-top text-right">
                        <button
                          onClick={() => setConfirmDelete(c)}
                          aria-label="Delete case"
                          title="Delete case"
                          className="w-8 h-8 rounded-md flex items-center justify-center text-text-muted hover:text-accent-red hover:bg-accent-red/10 transition-colors md:opacity-0 md:group-hover:opacity-100 focus:opacity-100"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                            <path d="M3 6h18" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Delete confirmation */}
        {confirmDelete && (
          <div
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => !deleting && setConfirmDelete(null)}
          >
            <div className="card w-full max-w-md p-5 animate-slide-up" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-red/15 border border-accent-red/40 flex items-center justify-center flex-shrink-0 text-accent-red">⚠️</div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-text-primary font-semibold">Delete this case?</h3>
                  <p className="text-text-muted text-sm mt-1">
                    Order <span className="text-text-primary font-mono">#{confirmDelete.orderNumber}</span>
                    {' '}— {shortDisputeLabel(confirmDelete.disputeType)}.
                  </p>
                  <p className="text-text-muted text-xs mt-2">
                    This permanently removes the case and its evidence. Cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end mt-5">
                <button onClick={() => setConfirmDelete(null)} disabled={deleting} className="btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-2 rounded-lg bg-accent-red text-white text-sm font-semibold hover:bg-accent-red/80 transition-colors disabled:opacity-40"
                >
                  {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function Stat({
  label, value, accent, tone,
}: { label: string; value: string; accent?: boolean; tone?: 'green' | 'red' }) {
  const valueCls = accent
    ? 'text-accent-violet'
    : tone === 'green' ? 'text-accent-green'
    : tone === 'red' ? 'text-accent-red'
    : 'text-text-primary';
  return (
    <div className="card px-4 py-3">
      <p className="text-text-muted text-[10px] uppercase tracking-widest font-medium">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${valueCls}`}>{value}</p>
    </div>
  );
}

function FilterChip({
  label, active, onClick, count,
}: { label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button onClick={onClick} className={active ? 'pill-active' : 'pill'}>
      {label}
      <span className={`text-[10px] ${active ? 'opacity-80' : 'text-text-muted'}`}>({count})</span>
    </button>
  );
}

function Th({
  label, sortKey, current, dir, onSort, align,
}: {
  label: string;
  sortKey: SortKey;
  current: SortKey;
  dir: 'asc' | 'desc';
  onSort: (k: SortKey) => void;
  align?: 'right';
}) {
  const isActive = current === sortKey;
  return (
    <th className={`px-3 py-2.5 font-medium ${align === 'right' ? 'text-right' : ''}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 ${isActive ? 'text-accent-violet' : 'text-text-muted hover:text-text-primary'}`}
      >
        {label}
        <span className="text-[10px] w-2">{isActive ? (dir === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );
}

function OutcomeSelect({
  value, onChange,
}: { value: 'Pending' | 'Won' | 'Lost'; onChange: (v: 'Pending' | 'Won' | 'Lost') => void }) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as 'Pending' | 'Won' | 'Lost')}
        className={`appearance-none cursor-pointer pl-3 pr-7 py-1 rounded-full text-[11px] font-bold border bg-transparent ${OUTCOME_PILL[value]} focus:outline-none focus:ring-2 focus:ring-accent-violet/30`}
      >
        <option value="Pending">Pending</option>
        <option value="Won">Won</option>
        <option value="Lost">Lost</option>
      </select>
      <svg
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
        className="w-3 h-3 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-70"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function NotesCell({
  initial, onSave,
}: { initial: string; onSave: (v: string) => void }) {
  const [value, setValue] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const lastSaved = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync when the underlying record changes (e.g. status change refresh)
  useEffect(() => {
    setValue(initial);
    lastSaved.current = initial;
  }, [initial]);

  function commit(v: string) {
    if (v === lastSaved.current) return;
    setSaving(true);
    onSave(v);
    lastSaved.current = v;
    setSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 800);
  }

  return (
    <div className="relative">
      <input
        className="w-full bg-transparent border border-transparent rounded-md px-2 py-1 text-sm text-text-secondary placeholder-text-muted focus:bg-bg-elevated focus:border-bg-border focus:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-violet/20 hover:border-bg-border transition-colors"
        placeholder="Add a note…"
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          if (timer.current) clearTimeout(timer.current);
          timer.current = setTimeout(() => commit(v), 600);
        }}
        onBlur={() => {
          if (timer.current) clearTimeout(timer.current);
          commit(value);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
        }}
      />
      {(saving || savedFlash) && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-accent-violet pointer-events-none">
          {saving ? '…' : '✓'}
        </span>
      )}
    </div>
  );
}
