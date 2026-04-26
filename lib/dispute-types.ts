export type DisputeType =
  | 'inr'
  | 'inad'
  | 'fraud'
  | 'credit'
  | 'duplicate'
  | 'subscription'
  | 'general';

export const PRIMARY_DISPUTE_TYPES: { id: DisputeType; emoji: string; label: string; sub: string }[] = [
  { id: 'inr', emoji: '📦', label: 'Item Not Received', sub: 'Customer says the package never arrived' },
  { id: 'inad', emoji: '❌', label: 'Item Not as Described', sub: 'Customer says the product is wrong or defective' },
  { id: 'fraud', emoji: '🚫', label: 'Unauthorized / Fraud', sub: 'Cardholder did not authorize the purchase' },
];

export const SECONDARY_DISPUTE_TYPES: { id: DisputeType; label: string }[] = [
  { id: 'credit', label: 'Credit Not Processed' },
  { id: 'duplicate', label: 'Duplicate' },
  { id: 'subscription', label: 'Subscription Cancelled' },
  { id: 'general', label: 'General' },
];

export const ALL_DISPUTE_TYPES: { id: DisputeType; label: string; emoji?: string }[] = [
  ...PRIMARY_DISPUTE_TYPES.map((d) => ({ id: d.id, label: d.label, emoji: d.emoji })),
  ...SECONDARY_DISPUTE_TYPES,
];

export function disputeLabel(type: string): string {
  const found = ALL_DISPUTE_TYPES.find((d) => d.id === type);
  return found ? found.label : type;
}

export function disputeEmoji(type: string): string {
  const found = ALL_DISPUTE_TYPES.find((d) => d.id === type);
  return found?.emoji ?? '📄';
}
