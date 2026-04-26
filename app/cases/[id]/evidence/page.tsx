'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StepIndicator from '@/components/StepIndicator';
import DeadlinePill from '@/components/DeadlinePill';
import { disputeEmoji, disputeLabel } from '@/lib/dispute-types';
import { parseEvidence, type CaseRecord } from '@/lib/case-types';
import {
  reassignExhibits,
  requiredCounts,
  withFreshPriorities,
  type EvidenceItem,
} from '@/lib/evidence';

export default function EvidencePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [c, setCase] = useState<CaseRecord | null>(null);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMissingConfirm, setShowMissingConfirm] = useState(false);

  useEffect(() => {
    fetch(`/api/cases/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Case not found');
        return r.json();
      })
      .then((data: CaseRecord) => {
        setCase(data);
        // Enrich with the latest priority map so older cases still display correctly.
        setEvidence(withFreshPriorities(parseEvidence(data), data.disputeType));
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const required = useMemo(() => requiredCounts(evidence), [evidence]);
  const recommendedTotal = useMemo(
    () => evidence.filter((e) => e.priority === 'recommended').length,
    [evidence],
  );
  const recommendedCollected = useMemo(
    () => evidence.filter((e) => e.priority === 'recommended' && e.checked).length,
    [evidence],
  );

  // Sort: required first, recommended second, optional last (stable inside each group).
  const orderedEvidence = useMemo(() => {
    const score = (it: EvidenceItem) =>
      it.priority === 'required' ? 0 : it.priority === 'recommended' ? 1 : 2;
    return [...evidence]
      .map((it, i) => ({ it, i }))
      .sort((a, b) => score(a.it) - score(b.it) || a.i - b.i)
      .map(({ it }) => it);
  }, [evidence]);

  function toggle(key: string) {
    setEvidence((prev) =>
      reassignExhibits(prev.map((e) => (e.key === key ? { ...e, checked: !e.checked } : e))),
    );
  }

  function setNote(key: string, note: string) {
    setEvidence((prev) => prev.map((e) => (e.key === key ? { ...e, note } : e)));
  }

  async function persistAndAdvance() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence, step: Math.max(c?.step ?? 1, 4) }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push(`/cases/${params.id}/response`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  function handleNext() {
    if (required.missing.length > 0) {
      setShowMissingConfirm(true);
      return;
    }
    persistAndAdvance();
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12">
          <div className="card h-96 shimmer" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <StepIndicator current={3} caseId={params.id} />

        {/* Case header */}
        <div className="card px-4 py-3 mb-6 flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="text-text-primary font-semibold">#{c?.orderNumber}</div>
            <span className="text-text-secondary text-sm">
              {disputeEmoji(c!.disputeType)} {disputeLabel(c!.disputeType)}
            </span>
          </div>
          <DeadlinePill deadline={c?.deadline} />
        </div>

        <h1 className="text-text-primary text-3xl font-bold tracking-tight">Collect Your Evidence</h1>
        <p className="text-text-muted mt-2">
          <span className="text-accent-red font-semibold">Required</span> items are mandatory to win.
          {' '}<span className="text-accent-violet font-semibold">Recommended</span> items strengthen your case.
        </p>

        {/* Progress — required-focused */}
        <div className="mt-6 mb-4">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-x-3 gap-y-1">
            <span className="text-text-secondary text-sm font-medium">
              <span className={required.collected === required.total ? 'text-accent-green' : 'text-accent-red'}>
                {required.collected} / {required.total}
              </span>{' '}
              required collected
              {recommendedTotal > 0 && (
                <span className="text-text-muted ml-3">
                  · {recommendedCollected}/{recommendedTotal} recommended
                </span>
              )}
            </span>
            <span className="text-text-muted text-xs">
              {required.total ? Math.round((required.collected / required.total) * 100) : 0}%
            </span>
          </div>
          <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                required.collected === required.total ? 'bg-accent-green' : 'bg-accent-red'
              }`}
              style={{
                width: `${required.total ? (required.collected / required.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          {orderedEvidence.map((item) => (
            <div
              key={item.key}
              className={`card transition-colors ${
                item.checked
                  ? 'border-accent-violet/40'
                  : item.priority === 'required'
                  ? 'border-accent-red/30'
                  : ''
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(item.key)}
                className="w-full text-left px-4 py-3 flex items-start gap-3"
              >
                <div
                  className={`mt-0.5 w-5 h-5 rounded-md flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                    item.checked
                      ? 'bg-accent-violet border-accent-violet'
                      : 'border-bg-border bg-bg-elevated'
                  }`}
                >
                  {item.checked && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-text-primary text-sm font-medium leading-snug">{item.label}</p>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <PriorityBadge priority={item.priority} />
                      {item.checked && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent-violet/20 text-accent-violet">
                          Exhibit {item.exhibit}
                        </span>
                      )}
                    </div>
                  </div>
                  {item.hint && <p className="text-text-muted text-xs mt-0.5">{item.hint}</p>}
                </div>
              </button>
              {item.checked && (
                <div className="px-4 pb-3 pl-12">
                  <input
                    placeholder="Add tracking link, notes…"
                    className="input-field text-xs"
                    value={item.note}
                    onChange={(e) => setNote(item.key, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/40 text-accent-red text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-between pt-6">
          <Link href={`/cases/${params.id}/details`} className="btn-secondary">← Back</Link>
          <button onClick={handleNext} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Generate Response →'}
          </button>
        </div>

        {/* Missing-required confirmation */}
        {showMissingConfirm && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="card w-full max-w-md p-5 animate-slide-up">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-accent-red/15 border border-accent-red/40 flex items-center justify-center flex-shrink-0 text-accent-red">
                  ⚠️
                </div>
                <div className="flex-1">
                  <h3 className="text-text-primary font-semibold">Missing required evidence</h3>
                  <p className="text-text-muted text-sm mt-1">
                    The following item{required.missing.length > 1 ? 's are' : ' is'} marked required for this dispute type. Without {required.missing.length > 1 ? 'them' : 'it'}, you&apos;ll likely lose:
                  </p>
                  <ul className="mt-3 space-y-1">
                    {required.missing.map((m) => (
                      <li key={m.key} className="text-accent-red text-sm flex gap-2">
                        <span>•</span>
                        <span>{m.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end mt-5">
                <button onClick={() => setShowMissingConfirm(false)} className="btn-secondary">
                  Go back
                </button>
                <button
                  onClick={() => {
                    setShowMissingConfirm(false);
                    persistAndAdvance();
                  }}
                  className="btn-primary"
                  disabled={saving}
                >
                  Continue anyway
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function PriorityBadge({ priority }: { priority: EvidenceItem['priority'] }) {
  if (priority === 'required') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-accent-red/15 text-accent-red border border-accent-red/40">
        Required
      </span>
    );
  }
  if (priority === 'recommended') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-accent-violet/10 text-accent-violet border border-accent-violet/30">
        Recommended
      </span>
    );
  }
  return null;
}
