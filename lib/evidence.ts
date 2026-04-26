import type { DisputeType } from './dispute-types';

export type EvidencePriority = 'required' | 'recommended';

export interface EvidenceItem {
  key: string;
  label: string;
  hint?: string;
  priority?: EvidencePriority; // undefined = optional
  checked: boolean;
  note: string;
  exhibit: string | null; // 'A', 'B', etc. — assigned in order checked
}

interface EvidenceDef {
  key: string;
  label: string;
  hint?: string;
}

const ALL_CASES: EvidenceDef[] = [
  { key: 'order_confirmation', label: 'Shopify order confirmation', hint: 'Screenshot or PDF' },
  { key: 'shipping_address', label: 'Customer shipping address as entered at checkout' },
  { key: 'policies', label: 'Store Terms of Service + Shipping + Refund Policy' },
  { key: 'prior_comm', label: 'Any prior customer communication', hint: 'Email, chat, or ticket' },
];

const INR_EXTRA: EvidenceDef[] = [
  { key: 'shipping_label', label: 'Shipping label from sourcing agent' },
  { key: 'tracking_screenshot', label: 'Tracking page screenshot showing "Delivered" + tracking link', hint: 'If in transit: latest scan screenshot + estimated delivery date' },
  { key: 'warehouse_dispatch', label: 'Warehouse dispatch confirmation', hint: 'If available' },
];

const INAD_EXTRA: EvidenceDef[] = [
  { key: 'product_listing', label: 'Product listing screenshot', hint: 'Photos, title, description, specs' },
  { key: 'customer_media', label: 'Any photos/video sent by customer' },
  { key: 'tracking_delivery', label: 'Carrier tracking confirming delivery' },
  { key: 'product_photos_agent', label: 'Product photos from sourcing agent', hint: 'If available' },
  { key: 'return_policy', label: 'Return/refund policy screenshot' },
];

const FRAUD_EXTRA: EvidenceDef[] = [
  { key: 'addresses', label: 'Billing address + shipping address', hint: 'Note if they match' },
  { key: 'ip_device', label: 'IP address + device info', hint: 'From Shopify Fraud Analysis' },
  { key: 'fraud_score', label: 'Shopify fraud analysis score screenshot' },
  { key: 'proof_delivery', label: 'Proof of delivery' },
  { key: 'post_purchase', label: 'Any post-purchase communication from customer' },
];

const GENERIC_EXTRA: EvidenceDef[] = [
  { key: 'all_relevant', label: 'All relevant transaction evidence' },
  { key: 'customer_history', label: 'Customer order/communication history' },
];

// Per-type priority overrides — undefined keys = optional.
// Source: what reps/networks (Visa, MC) consider necessary vs nice-to-have.
const PRIORITY_BY_TYPE: Record<DisputeType, Record<string, EvidencePriority>> = {
  inr: {
    order_confirmation: 'required',
    shipping_address: 'required',
    shipping_label: 'required',
    tracking_screenshot: 'required',
    policies: 'recommended',
    // prior_comm, warehouse_dispatch → optional
  },
  inad: {
    order_confirmation: 'required',
    product_listing: 'required',
    tracking_delivery: 'required',
    return_policy: 'required',
    policies: 'required',
    shipping_address: 'recommended',
    prior_comm: 'recommended',
    product_photos_agent: 'recommended',
    // customer_media → optional (only if customer sent something)
  },
  fraud: {
    order_confirmation: 'required',
    shipping_address: 'required',
    addresses: 'required',
    ip_device: 'required',
    fraud_score: 'required',
    proof_delivery: 'required',
    policies: 'recommended',
    post_purchase: 'recommended',
    // prior_comm → optional (rarely exists in fraud cases)
  },
  credit: {
    order_confirmation: 'required',
    policies: 'required',
    prior_comm: 'required',
    // others → optional
  },
  duplicate: {
    order_confirmation: 'required',
    prior_comm: 'recommended',
    // policies, shipping_address → optional
  },
  subscription: {
    order_confirmation: 'required',
    policies: 'required',
    prior_comm: 'required',
    // shipping_address → optional
  },
  general: {
    order_confirmation: 'required',
    policies: 'recommended',
    prior_comm: 'recommended',
  },
};

export function defaultEvidenceFor(type: DisputeType): EvidenceItem[] {
  let extras: EvidenceDef[] = [];
  if (type === 'inr') extras = INR_EXTRA;
  else if (type === 'inad') extras = INAD_EXTRA;
  else if (type === 'fraud') extras = FRAUD_EXTRA;
  else extras = GENERIC_EXTRA;

  const priorityMap = PRIORITY_BY_TYPE[type] ?? {};

  return [...ALL_CASES, ...extras].map((e) => ({
    ...e,
    priority: priorityMap[e.key],
    checked: false,
    note: '',
    exhibit: null,
  }));
}

// Merge stored evidence with the latest defaults so legacy cases pick up the
// `priority` field (and any new items) without a DB migration.
export function withFreshPriorities(items: EvidenceItem[], type: string): EvidenceItem[] {
  const defaults = defaultEvidenceFor(type as DisputeType);
  const byKey = new Map<string, EvidenceItem>(items.map((i) => [i.key, i]));
  return defaults.map((d) => {
    const existing = byKey.get(d.key);
    if (!existing) return d;
    return { ...d, checked: existing.checked, note: existing.note, exhibit: existing.exhibit };
  });
}

// Reassign exhibit letters based on the order items appear checked in the array.
export function reassignExhibits(items: EvidenceItem[]): EvidenceItem[] {
  let i = 0;
  return items.map((item) => {
    if (item.checked) {
      const letter = String.fromCharCode(65 + i);
      i += 1;
      return { ...item, exhibit: letter };
    }
    return { ...item, exhibit: null };
  });
}

export function checkedCount(items: EvidenceItem[]): number {
  return items.filter((i) => i.checked).length;
}

export function requiredCounts(items: EvidenceItem[]): { collected: number; total: number; missing: EvidenceItem[] } {
  const required = items.filter((i) => i.priority === 'required');
  const collected = required.filter((i) => i.checked).length;
  const missing = required.filter((i) => !i.checked);
  return { collected, total: required.length, missing };
}
