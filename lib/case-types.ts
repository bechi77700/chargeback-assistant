import type { EvidenceItem } from './evidence';

export interface CaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  orderNumber: string;
  disputeType: string;
  deadline: string;

  customerName: string | null;
  customerEmail: string | null;
  amount: number | null;
  orderDate: string | null;
  shipDate: string | null;
  trackingNumber: string | null;
  packageStatus: string | null;
  contactedSupport: string | null;

  deliveryDate: string | null;
  latestScanDate: string | null;
  estimatedDate: string | null;
  deliveryZip: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  productDesc: string | null;
  returnWindow: string | null;

  evidence: string; // JSON string of EvidenceItem[]
  responseText: string | null;

  status: string;
  step: number;
  submittedAt: string | null;
  closedAt: string | null;
}

export function parseEvidence(c: { evidence: string }): EvidenceItem[] {
  try {
    const arr = JSON.parse(c.evidence);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Format an ISO date string for an <input type="date" /> value.
export function isoToDateInput(v: string | null | undefined): string {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
