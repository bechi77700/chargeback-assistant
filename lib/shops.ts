// Minimal shop shape embedded in cases.
export interface ShopRef {
  id: string;
  name: string;
  color: string | null;
}

// Prisma `select` for embedding a shop in case queries.
export const SHOP_REF_SELECT = { id: true, name: true, color: true } as const;

export interface ShopSummary extends ShopRef {
  createdAt: string;
  caseCount: number;
  pendingCount: number;
}

export interface ShopsResponse {
  shops: ShopSummary[];
  unassignedCount: number;
}

// Query-string value used to show cases that have no shop yet.
export const NO_SHOP = 'none';

// Fired on window whenever shops or case counts change, so the sidebar refreshes.
export const SHOPS_CHANGED_EVENT = 'shops:changed';

export function notifyShopsChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(SHOPS_CHANGED_EVENT));
}

// Per-shop color so a store is recognizable at a glance.
// Hex values (not Tailwind classes) because they're picked at runtime.
export const SHOP_COLORS = [
  '#2563EB', // blue
  '#C2410C', // orange
  '#7C3AED', // purple
  '#DB2777', // pink
  '#0891B2', // cyan
  '#A16207', // amber
  '#4F46E5', // indigo
  '#4D7C0F', // olive
];

// First palette color no other shop uses yet (cycles once all are taken).
export function nextShopColor(used: (string | null)[]): string {
  const free = SHOP_COLORS.find((c) => !used.includes(c));
  return free ?? SHOP_COLORS[used.length % SHOP_COLORS.length];
}

export function shopColor(shop: { id: string; color?: string | null }): string {
  if (shop.color) return shop.color;
  // Fallback for shops without a stored color (FNV-1a hash of the id)
  let h = 0x811c9dc5;
  for (let i = 0; i < shop.id.length; i++) h = Math.imul(h ^ shop.id.charCodeAt(i), 0x01000193) >>> 0;
  return SHOP_COLORS[h % SHOP_COLORS.length];
}
