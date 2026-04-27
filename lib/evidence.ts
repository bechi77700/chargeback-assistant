import type { DisputeType } from './dispute-types';

export type EvidencePriority = 'required' | 'recommended';

export interface EvidenceItem {
  key: string;
  label: string;
  hint?: string;
  howTo?: string;             // step-by-step instructions for collecting this evidence
  priority?: EvidencePriority; // undefined = optional
  checked: boolean;
  note: string;
  exhibit: string | null; // 'A', 'B', etc. — assigned in order checked
}

interface EvidenceDef {
  key: string;
  label: string;
  hint?: string;
  howTo?: string;
}

const ALL_CASES: EvidenceDef[] = [
  {
    key: 'order_confirmation',
    label: 'Shopify order confirmation',
    hint: 'Screenshot or PDF',
    howTo: `Shopify Admin → Orders → click the order number.
1. Press Cmd+P (Mac) or Ctrl+P (Windows) → Save as PDF
2. Or take a full-page screenshot showing: order number, customer name, line items, total paid, payment method, order date.`,
  },
  {
    key: 'shipping_address',
    label: 'Customer shipping address as entered at checkout',
    howTo: `Shopify Admin → Orders → click the order number.
1. Look at the right sidebar — the "Shipping address" card shows what the customer typed at checkout
2. Screenshot that card so the address is fully visible
3. Make sure the order # is also visible in the shot.`,
  },
  {
    key: 'policies',
    label: 'Store Terms of Service + Shipping + Refund Policy',
    howTo: `Open your live store in a new tab.
1. Scroll to the footer — click each link: Terms of Service, Shipping Policy, Refund Policy
2. On each page: Cmd+P → Save as PDF (keep URL visible in header/footer)
3. Bundle the 3 PDFs together as one exhibit.`,
  },
  {
    key: 'prior_comm',
    label: 'Any prior customer communication',
    hint: 'Email, chat, or ticket',
    howTo: `Search every channel BEFORE the chargeback was filed:
1. Email inbox (search by customer email)
2. Shopify Inbox / live chat archive
3. Help desk tool (Gorgias, Zendesk, Reamaze, etc.)
4. Social DMs

If found: export the thread (PDF) or screenshot showing dates + content.
If nothing exists: skip this exhibit — it's only useful if there is real prior communication.`,
  },
];

const INR_EXTRA: EvidenceDef[] = [
  {
    key: 'shipping_label',
    label: 'Shipping label from sourcing agent',
    howTo: `Contact your sourcing agent (WeChat, email, or wherever you communicate).
1. Request the shipping label PDF for this order #
2. The label must show: tracking number, recipient address, dispatch date.`,
  },
  {
    key: 'tracking_screenshot',
    label: 'Tracking page screenshot showing "Delivered" + tracking link',
    hint: 'If in transit: latest scan screenshot + estimated delivery date',
    howTo: `Open the tracking link on the carrier site (17track.net, parcelsapp.com, or USPS/UPS/DHL/FedEx).
1. Take a full-page screenshot INCLUDING the URL bar
2. The screenshot must show "Delivered" + date + delivery location
3. Also paste the raw tracking URL as a clickable link in the response

⚠️ If the package is not delivered yet:
   • Wait for delivery before submitting the response if your deadline allows
   • Otherwise: screenshot the latest scan + estimated delivery date instead — but win rate drops significantly without "Delivered" status.`,
  },
  {
    key: 'warehouse_dispatch',
    label: 'Warehouse dispatch confirmation',
    hint: 'If available',
    howTo: `If you use a 3PL or fulfillment warehouse:
1. Find the dispatch confirmation email for this order
2. Screenshot or save as PDF
3. Must show: order #, dispatch date, tracking #.`,
  },
];

const INAD_EXTRA: EvidenceDef[] = [
  {
    key: 'product_listing',
    label: 'Product listing screenshot',
    hint: 'Photos, title, description, specs',
    howTo: `Open your live store product page in a new tab.
1. Use a full-page screenshot tool: GoFullPage extension (Chrome), or Cmd+Shift+5 → Capture Entire Page (Safari)
2. Capture: product photos, title, description, specs, variants, price
3. ⚠️ The listing must show what was displayed AT THE TIME the customer ordered. If you've updated the listing since, find an archive (Wayback Machine: web.archive.org) or use Shopify's product version history.`,
  },
  {
    key: 'customer_media',
    label: 'Any photos/video sent by customer',
    howTo: `Check support tickets / email / chat for any photos or videos the customer sent.
1. Save the ORIGINAL files (not screenshots — keep file metadata)
2. Note when they were sent
3. If the customer sent nothing: skip this exhibit.`,
  },
  {
    key: 'tracking_delivery',
    label: 'Carrier tracking confirming delivery',
    howTo: `Open the carrier tracking page for this order.
1. Take a full-page screenshot including the URL bar
2. Must show: "Delivered" status, date, location

⚠️ If not delivered yet: INAD disputes require the customer to have received the item to assess it. Wait for delivery before submitting your response.`,
  },
  {
    key: 'product_photos_agent',
    label: 'Product photos from sourcing agent',
    hint: 'If available',
    howTo: `Ask your sourcing agent for QC (quality control) photos taken before the product shipped.
1. Request the highest resolution available
2. These prove the product matched the listing at dispatch
3. Save with original timestamps if possible.`,
  },
  {
    key: 'return_policy',
    label: 'Return/refund policy screenshot',
    howTo: `Open your store's Refund Policy page (usually in the footer).
1. Cmd+P → Save as PDF (URL visible)
2. Or full-page screenshot
3. Used as evidence to show terms were available — never quote the policy timeframes inside the response itself.`,
  },
];

const FRAUD_EXTRA: EvidenceDef[] = [
  {
    key: 'addresses',
    label: 'Billing address + shipping address',
    hint: 'Note if they match',
    howTo: `Shopify Admin → Orders → click the order number.
1. Take ONE screenshot showing both "Billing address" and "Shipping address" cards side by side
2. If they MATCH: this is strong evidence the cardholder placed the order
3. If they differ: still submit — combined with the IP/AVS evidence it can still win.`,
  },
  {
    key: 'ip_device',
    label: 'IP address + device info',
    hint: 'From Shopify Fraud Analysis',
    howTo: `Shopify Admin → Orders → click order # → scroll to "Fraud analysis" section.
1. Screenshot showing: IP address, IP geolocation, browser, device
2. Make sure the order # is visible in the same screenshot
3. If the IP location matches the billing address → strong identity evidence.`,
  },
  {
    key: 'fraud_score',
    label: 'Shopify fraud analysis score screenshot',
    howTo: `Shopify Admin → Orders → click order # → "Fraud analysis" panel.
1. Screenshot the ENTIRE panel showing: risk score (Low / Medium / High), CVV check, AVS check (street + zip match), payment 3DS status
2. A "Low risk" score with green checkmarks is your strongest weapon vs fraud claims.`,
  },
  {
    key: 'proof_delivery',
    label: 'Proof of delivery',
    howTo: `Open the carrier tracking page (UPS / FedEx / USPS / DHL / etc.) for this order.
1. Find the "Delivered" event and screenshot it
2. Capture: date, time, location, AND signature or photo (if the carrier provides one)
3. Include the URL bar in the screenshot
4. For high-value orders: contact the carrier to request a signed Proof of Delivery (POD) document

⚠️ If the package is NOT delivered yet:
   • Wait until delivery before submitting the response if your deadline allows
   • Proof of delivery is the single most critical evidence for fraud disputes — without it, win rate drops drastically
   • Mark a reminder for yourself to come back when delivery happens.`,
  },
  {
    key: 'post_purchase',
    label: 'Any post-purchase communication from customer',
    howTo: `Search every channel for messages from this customer AFTER the order date:
1. Email (search by customer email)
2. Help desk (Gorgias, Zendesk, Reamaze)
3. Live chat / Shopify Inbox
4. Social DMs (Instagram, Facebook, TikTok)

Customer engagement post-purchase strongly suggests they ARE the real cardholder (a fraudster wouldn't reach out).
Screenshot or export every relevant thread with dates visible.`,
  },
];

const GENERIC_EXTRA: EvidenceDef[] = [
  {
    key: 'all_relevant',
    label: 'All relevant transaction evidence',
    howTo: `Gather every document tied to this transaction:
1. Order confirmation, receipts, invoices
2. Communication history with the customer
3. Account activity / login records
4. Anything proving the transaction was legitimate.`,
  },
  {
    key: 'customer_history',
    label: 'Customer order/communication history',
    howTo: `Shopify Admin → Customers → search by email or name.
1. Screenshot the customer profile showing: total orders, total spent, signup date
2. List of past orders (especially completed/delivered ones)
3. A long history of legitimate purchases strengthens your case significantly.`,
  },
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
