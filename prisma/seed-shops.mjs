// Creates the default shops on first deploy. Runs on every build, but only
// seeds when the Shop table is empty — so renaming or deleting a shop later
// from the app is never undone by a redeploy.
import { PrismaClient } from '@prisma/client';

const DEFAULT_SHOPS = ['Garden & Gather', 'Looma'];

const prisma = new PrismaClient();

try {
  const count = await prisma.shop.count();
  if (count === 0) {
    // Same order as SHOP_COLORS in lib/shops.ts
    const colors = ['#2563EB', '#C2410C'];
    for (const [i, name] of DEFAULT_SHOPS.entries()) {
      await prisma.shop.create({ data: { name, color: colors[i] } });
    }
    console.log(`Seeded shops: ${DEFAULT_SHOPS.join(', ')}`);
  } else {
    console.log(`Shops already exist (${count}) — skipping seed`);
  }
} finally {
  await prisma.$disconnect();
}
