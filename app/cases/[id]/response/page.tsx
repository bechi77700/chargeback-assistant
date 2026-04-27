'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/components/AppShell';
import StepIndicator from '@/components/StepIndicator';
import DeadlinePill from '@/components/DeadlinePill';
import { disputeEmoji, disputeLabel } from '@/lib/dispute-types';
import { parseEvidence, isoToDateInput, type CaseRecord } from '@/lib/case-types';
import { generateResponse } from '@/lib/templates';

interface ExtraField {
  id: keyof EditableExtras;
  label: string;
  hint?: string;        // small explainer below the label
  placeholder?: string; // example value shown inside the input
  type?: 'text' | 'date';
}

const FIELD_GROUPS: { title: string; fields: ExtraField[]; types?: string[] }[] = [
  {
    title: 'Delivery details',
    fields: [
      {
        id: 'deliveryDate',
        label: 'Delivery date',
        hint: 'When the carrier marked the package "Delivered" — copy this exact date from the tracking page.',
        type: 'date',
      },
      {
        id: 'deliveryZip',
        label: 'Carrier delivery location',
        hint: 'The city + ZIP shown on the carrier tracking page (NOT the customer\'s full address). It must match the shipping address area.',
        placeholder: 'e.g. Brooklyn, NY 11201',
      },
    ],
    types: ['inr', 'inad', 'fraud'],
  },
  {
    title: 'In-transit details',
    fields: [
      {
        id: 'latestScanDate',
        label: 'Latest scan date',
        hint: 'Date of the most recent tracking event (e.g. "Out for delivery", "In transit").',
        type: 'date',
      },
      {
        id: 'estimatedDate',
        label: 'Estimated delivery date',
        hint: 'ETA shown by the carrier on the tracking page.',
        type: 'date',
      },
    ],
    types: ['inr'],
  },
  {
    title: 'Fraud details',
    fields: [
      {
        id: 'billingAddress',
        label: 'Billing address',
        hint: 'Address linked to the cardholder\'s payment method (in Shopify Admin → Order → Billing address card).',
        placeholder: 'Street, City, State ZIP, Country',
      },
      {
        id: 'shippingAddress',
        label: 'Shipping address',
        hint: 'Address the customer entered at checkout (in Shopify Admin → Order → Shipping address card).',
        placeholder: 'Street, City, State ZIP, Country',
      },
    ],
    types: ['fraud'],
  },
  {
    title: 'Product details',
    fields: [
      {
        id: 'productDesc',
        label: 'Brief product description',
        hint: 'One short sentence describing what the customer ordered, as listed on your store. Used in the rebuttal text.',
        placeholder: 'e.g. Black wireless earbuds, model X-200',
      },
    ],
    types: ['inad'],
  },
];

interface EditableExtras {
  deliveryDate: string;
  deliveryZip: string;
  latestScanDate: string;
  estimatedDate: string;
  billingAddress: string;
  shippingAddress: string;
  productDesc: string;
}

const EMPTY_EXTRAS: EditableExtras = {
  deliveryDate: '',
  deliveryZip: '',
  latestScanDate: '',
  estimatedDate: '',
  billingAddress: '',
  shippingAddress: '',
  productDesc: '',
};

export default function ResponsePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [c, setCase] = useState<CaseRecord | null>(null);
  const [extras, setExtras] = useState<EditableExtras>(EMPTY_EXTRAS);
  const [responseText, setResponseText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [autoGen, setAutoGen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/cases/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('Case not found');
        return r.json();
      })
      .then((data: CaseRecord) => {
        setCase(data);
        const ex: EditableExtras = {
          deliveryDate: isoToDateInput(data.deliveryDate),
          deliveryZip: data.deliveryZip ?? '',
          latestScanDate: isoToDateInput(data.latestScanDate),
          estimatedDate: isoToDateInput(data.estimatedDate),
          billingAddress: data.billingAddress ?? '',
          shippingAddress: data.shippingAddress ?? '',
          productDesc: data.productDesc ?? '',
        };
        setExtras(ex);
        // Use saved responseText if present, otherwise generate fresh
        if (data.responseText) {
          setResponseText(data.responseText);
          setAutoGen(false);
        } else {
          setResponseText(buildResponse(data, ex));
        }
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  // Re-generate when extras or case change while autoGen is enabled
  useEffect(() => {
    if (!c || !autoGen) return;
    setResponseText(buildResponse(c, extras));
  }, [c, extras, autoGen]);

  const evidence = useMemo(() => (c ? parseEvidence(c) : []), [c]);
  const checkedEvidence = useMemo(() => evidence.filter((e) => e.checked), [evidence]);

  const visibleGroups = useMemo(() => {
    if (!c) return [];
    return FIELD_GROUPS.filter((g) => !g.types || g.types.includes(c.disputeType));
  }, [c]);

  // Highlight bracketed placeholders for the read-only preview
  const highlightedHtml = useMemo(() => {
    return responseText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\[([^\]\n]+)\]/g, '<mark class="bg-yellow-400/20 text-yellow-200 px-1 rounded">[$1]</mark>');
  }, [responseText]);

  async function copyToClipboard() {
    try {
      await navigator.clipboard.writeText(responseText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = responseText;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deliveryDate: extras.deliveryDate || null,
          deliveryZip: extras.deliveryZip,
          latestScanDate: extras.latestScanDate || null,
          estimatedDate: extras.estimatedDate || null,
          billingAddress: extras.billingAddress,
          shippingAddress: extras.shippingAddress,
          productDesc: extras.productDesc,
          responseText,
          status: 'submitted',
          step: Math.max(c?.step ?? 1, 5),
        }),
      });
      if (!res.ok) throw new Error('Failed to save');
      router.push(`/cases/${params.id}/logged`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-12">
          <div className="card h-96 shimmer" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto px-4 py-8 md:px-8 md:py-12">
        <StepIndicator current={4} caseId={params.id} />

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

        <h1 className="text-text-primary text-3xl font-bold tracking-tight">Your Response is Ready</h1>
        <p className="text-text-muted mt-2 mb-6">
          Fill in the highlighted fields, then copy to Shopify.
        </p>

        {/* Extras (only the relevant ones) */}
        {visibleGroups.length > 0 && (
          <div className="space-y-5 mb-6">
            {visibleGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-2">
                  {group.title}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.fields.map((f) => (
                    <div key={f.id}>
                      <label className="block text-text-secondary text-xs font-medium mb-1.5">{f.label}</label>
                      <input
                        type={f.type ?? 'text'}
                        className="input-field"
                        value={extras[f.id]}
                        onChange={(e) => setExtras((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Response editor + preview */}
        <div className="card p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-text-primary font-semibold text-sm">Response</h3>
            <label className="flex items-center gap-2 text-text-muted text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoGen}
                onChange={(e) => setAutoGen(e.target.checked)}
                className="accent-accent-violet"
              />
              Auto-generate from fields
            </label>
          </div>
          <textarea
            className="input-field font-mono text-xs min-h-[420px] leading-relaxed"
            value={responseText}
            onChange={(e) => {
              setAutoGen(false);
              setResponseText(e.target.value);
            }}
          />
          <div className="mt-3 px-3 py-2 rounded-lg bg-bg-elevated border border-bg-border">
            <p className="text-text-muted text-[10px] uppercase tracking-widest font-semibold mb-2">Preview (highlighted placeholders)</p>
            <pre
              className="text-text-secondary text-xs whitespace-pre-wrap leading-relaxed font-mono max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          </div>
        </div>

        {/* Evidence list */}
        {checkedEvidence.length > 0 && (
          <div className="card p-4 mb-6">
            <h3 className="text-text-primary font-semibold text-sm mb-2">Evidence submitted</h3>
            <ul className="space-y-1.5">
              {checkedEvidence.map((e) => (
                <li key={e.key} className="text-text-secondary text-sm flex gap-2">
                  <span className="inline-flex items-center px-1.5 rounded bg-accent-violet/15 text-accent-violet text-[10px] font-bold flex-shrink-0">
                    {e.exhibit}
                  </span>
                  <span>
                    {e.label}
                    {e.note && <span className="text-text-muted"> — {e.note}</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {error && (
          <div className="px-3 py-2 rounded-lg bg-accent-red/10 border border-accent-red/40 text-accent-red text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Link href={`/cases/${params.id}/evidence`} className="btn-secondary">← Back</Link>
          <div className="flex flex-wrap gap-2">
            <button onClick={copyToClipboard} className="btn-secondary">
              {copied ? '✓ Copied' : 'Copy Response'}
            </button>
            <button onClick={handleSubmit} disabled={saving} className="btn-primary">
              {saving ? 'Saving…' : 'Mark as Submitted →'}
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function buildResponse(c: CaseRecord, extras: EditableExtras): string {
  const evidence = parseEvidence(c);
  return generateResponse(
    {
      orderNumber: c.orderNumber,
      disputeType: c.disputeType,
      customerName: c.customerName,
      customerEmail: c.customerEmail,
      amount: c.amount,
      orderDate: c.orderDate,
      shipDate: c.shipDate,
      trackingNumber: c.trackingNumber,
      packageStatus: c.packageStatus,
      contactedSupport: c.contactedSupport,
      deliveryDate: extras.deliveryDate || c.deliveryDate,
      latestScanDate: extras.latestScanDate || c.latestScanDate,
      estimatedDate: extras.estimatedDate || c.estimatedDate,
      deliveryZip: extras.deliveryZip || c.deliveryZip,
      billingAddress: extras.billingAddress || c.billingAddress,
      shippingAddress: extras.shippingAddress || c.shippingAddress,
      productDesc: extras.productDesc || c.productDesc,
    },
    evidence,
  );
}
