import { parseEvidence } from './case-types';

// Short labels matching how the support team writes evidence in the tracker.
const EVIDENCE_SHORT: Record<string, string> = {
  order_confirmation: 'order confirmation',
  shipping_address: 'shipping address',
  policies: 'store policies',
  prior_comm: 'customer comms',
  shipping_label: 'shipping label',
  tracking_screenshot: 'carrier tracking',
  warehouse_dispatch: 'warehouse dispatch',
  product_listing: 'product listing',
  customer_media: 'customer media',
  tracking_delivery: 'carrier tracking',
  product_photos_agent: 'agent photos',
  return_policy: 'return policy',
  addresses: 'addresses',
  ip_device: 'IP/device',
  fraud_score: 'fraud analysis',
  proof_delivery: 'carrier tracking',
  post_purchase: 'post-purchase comms',
  all_relevant: 'transaction evidence',
  customer_history: 'customer history',
};

const DISPUTE_LABEL_SHORT: Record<string, string> = {
  inr: 'Item not received',
  inad: 'Item Not as Described',
  fraud: 'Unauthorized',
  credit: 'Credit not processed',
  duplicate: 'Duplicate',
  subscription: 'Subscription cancelled',
  general: 'General',
};

const PACKAGE_STATUS_LABEL: Record<string, string> = {
  delivered: 'Delivered',
  in_transit: 'In transit',
  returned: 'Returned',
};

export function shortDisputeLabel(type: string): string {
  return DISPUTE_LABEL_SHORT[type] ?? type;
}

export function packageStatusLabel(s: string | null | undefined): string {
  if (!s) return '';
  return PACKAGE_STATUS_LABEL[s] ?? s;
}

export function fmtShortDate(d: Date | string | null | undefined): string {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function evidenceLine(c: { evidence: string }): string {
  const items = parseEvidence(c).filter((i) => i.checked);
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const i of items) {
    const short = EVIDENCE_SHORT[i.key] ?? i.label.toLowerCase();
    if (!seen.has(short)) {
      seen.add(short);
      labels.push(short);
    }
  }
  return labels.join(', ');
}

export function outcomeFromStatus(status: string): 'Won' | 'Lost' | 'Pending' {
  if (status === 'won') return 'Won';
  if (status === 'lost') return 'Lost';
  return 'Pending';
}
