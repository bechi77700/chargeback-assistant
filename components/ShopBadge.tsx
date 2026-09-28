import { shopColor, type ShopRef } from '@/lib/shops';

export default function ShopBadge({
  shop,
  size = 'sm',
}: {
  shop: ShopRef | null | undefined;
  size?: 'xs' | 'sm';
}) {
  const sizeCls = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';

  if (!shop) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold border border-dashed border-text-muted/50 text-text-muted ${sizeCls}`}>
        No shop
      </span>
    );
  }

  const color = shopColor(shop);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border whitespace-nowrap ${sizeCls}`}
      style={{ color, borderColor: `${color}66`, backgroundColor: `${color}14` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {shop.name}
    </span>
  );
}
