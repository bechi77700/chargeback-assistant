import type { DisputeType } from './dispute-types';
import type { EvidenceItem } from './evidence';

export interface CaseLike {
  orderNumber: string | null;
  disputeType: DisputeType | string;
  customerName: string | null;
  customerEmail: string | null;
  amount: number | null;
  orderDate: Date | string | null;
  shipDate: Date | string | null;
  trackingNumber: string | null;
  packageStatus: string | null;
  contactedSupport: string | null;
  deliveryDate: Date | string | null;
  latestScanDate: Date | string | null;
  estimatedDate: Date | string | null;
  deliveryZip: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  productDesc: string | null;
  returnWindow: string | null;
}

const fmtDate = (v: Date | string | null | undefined): string => {
  if (!v) return '[DATE]';
  const d = typeof v === 'string' ? new Date(v) : v;
  if (isNaN(d.getTime())) return '[DATE]';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const fmtAmount = (v: number | null | undefined): string => {
  if (v == null || isNaN(v)) return '[AMOUNT]';
  return v.toFixed(2);
};

const fallback = (v: string | null | undefined, placeholder: string): string =>
  v && v.trim() ? v : placeholder;

const evidenceList = (items: EvidenceItem[]): string => {
  const checked = items.filter((i) => i.checked);
  if (checked.length === 0) return '[ADD EVIDENCE LIST]';
  return checked
    .map((i) => `• Exhibit ${i.exhibit ?? '?'} — ${i.label}${i.note ? ` (${i.note})` : ''}`)
    .join('\n');
};

export function generateResponse(c: CaseLike, evidence: EvidenceItem[]): string {
  const order = fallback(c.orderNumber, '[ORDER NUMBER]');
  const customer = fallback(c.customerName, '[CUSTOMER NAME]');
  const amount = fmtAmount(c.amount);
  const orderDate = fmtDate(c.orderDate);
  const shipDate = fmtDate(c.shipDate);
  const tracking = fallback(c.trackingNumber, '[TRACKING NUMBER]');
  const deliveryDate = fmtDate(c.deliveryDate);
  const deliveryZip = fallback(c.deliveryZip, '[DELIVERY ZIP / CITY]');
  const latestScan = fmtDate(c.latestScanDate);
  const estDate = fmtDate(c.estimatedDate);
  const billing = fallback(c.billingAddress, '[BILLING ADDRESS]');
  const shipping = fallback(c.shippingAddress, '[SHIPPING ADDRESS]');
  const productDesc = fallback(c.productDesc, '[BRIEF PRODUCT DESCRIPTION]');
  const returnWindow = fallback(c.returnWindow, '[X]');
  const evList = evidenceList(evidence);

  // INR — In transit
  if (c.disputeType === 'inr' && c.packageStatus === 'in_transit') {
    return `Subject: Rebuttal — Item Not Received — Order #${order}

We are writing to contest this chargeback filed by ${customer} for Order #${order} placed on ${orderDate} for $${amount}.

The order was fulfilled and shipped as agreed.

On ${shipDate}, the item was dispatched from our fulfillment partner's warehouse. The carrier's latest scan shows the package is in transit as of ${latestScan}, with an estimated delivery of ${estDate}.

Tracking number ${tracking} was assigned and is updating normally.

Our delivery timelines are clearly disclosed in our shipping policy, which the customer agreed to at checkout. We respectfully ask that the card network allow the delivery window to complete before a final ruling.

The customer did not contact our support team before filing this dispute. Had they done so, we would have provided the tracking information and estimated delivery date directly.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // INR — Delivered (default INR)
  if (c.disputeType === 'inr') {
    return `Subject: Rebuttal — Item Not Received — Order #${order}

We are writing to contest this chargeback filed by ${customer} for Order #${order} placed on ${orderDate} for $${amount}.

The order was fulfilled and shipped as agreed.

On ${shipDate}, the item was dispatched from our fulfillment partner's warehouse. Tracking number ${tracking} was assigned.

According to the carrier's official tracking records, the package was marked as delivered on ${deliveryDate} to ${deliveryZip}, matching the shipping address provided at checkout.

The customer did not contact our support team before filing this dispute. Had they done so, we would have resolved it promptly.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // INAD
  if (c.disputeType === 'inad') {
    return `Subject: Rebuttal — Item Not as Described — Order #${order}

We are writing to contest this chargeback filed by ${customer} for Order #${order} placed on ${orderDate} for $${amount}.

The item delivered fully matches what was advertised on our store.

As shown in our product listing screenshot, the item is described as ${productDesc}. The photos, dimensions, and specifications shown match the product that was shipped.

The item was delivered on ${deliveryDate} per carrier tracking. We received no prior complaint, return request, or photo evidence demonstrating a discrepancy before this dispute was filed.

Our return policy allows customers to contact us within ${returnWindow} days of delivery. The customer did not reach out, which prevented us from resolving this directly.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // FRAUD
  if (c.disputeType === 'fraud') {
    return `Subject: Rebuttal — Unauthorized Transaction — Order #${order}

We are writing to contest this chargeback filed against Order #${order} placed on ${orderDate} for $${amount}.

The transaction was legitimate and authorized.

The order was placed through our secure checkout using billing address ${billing}, shipped to ${shipping}. Shopify's fraud analysis flagged this order as low risk at the time of purchase.

The order details — name, email, and shipping address — are consistent with the cardholder's information on file.

The item was delivered on ${deliveryDate} to the shipping address provided at checkout.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // CREDIT NOT PROCESSED
  if (c.disputeType === 'credit') {
    return `Subject: Rebuttal — Credit Not Processed — Order #${order}

We are writing to contest this chargeback filed by ${customer} for Order #${order} placed on ${orderDate} for $${amount}.

Our records show no return was received and no refund was due under the terms accepted at checkout.

Our refund policy requires the customer to initiate a return through our support channel before any credit is issued. We have no record of such a request from this customer prior to this dispute.

We remain willing to process any approved return through our standard policy. The customer did not contact our support team before filing this dispute, which prevented us from resolving this directly.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // DUPLICATE
  if (c.disputeType === 'duplicate') {
    return `Subject: Rebuttal — Duplicate Transaction — Order #${order}

We are writing to contest this chargeback filed against Order #${order} placed on ${orderDate} for $${amount}.

This transaction is not a duplicate. Our records show only a single, distinct charge for this order.

Each order in our system has a unique order number and a unique charge. If multiple charges appeared on the cardholder's statement, those correspond to separate orders, each fulfilled and tracked independently.

The customer did not contact our support team before filing this dispute. Had they done so, we would have walked them through their order history.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // SUBSCRIPTION CANCELLED
  if (c.disputeType === 'subscription') {
    return `Subject: Rebuttal — Subscription Cancelled — Order #${order}

We are writing to contest this chargeback filed by ${customer} for Order #${order} on ${orderDate} for $${amount}.

Our records show this charge was processed before any cancellation request was received from the customer.

Subscriptions on our store are cancelled effective at the end of the current billing cycle, as disclosed at checkout. The charge in question corresponds to a billing cycle that began before any cancellation was registered.

The customer did not contact our support team to request an exception before filing this dispute.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
  }

  // GENERAL fallback
  return `Subject: Rebuttal — Order #${order}

We are writing to contest this chargeback filed by ${customer} for Order #${order} placed on ${orderDate} for $${amount}.

The transaction was legitimate, fulfilled, and consistent with the terms accepted at checkout.

The customer did not contact our support team before filing this dispute. Had they done so, we would have addressed any concern through our standard support channels.

Evidence submitted:
${evList}

We respectfully request that this chargeback be ruled in our favor.`;
}
