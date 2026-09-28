import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { nextShopColor, type ShopsResponse } from '@/lib/shops';

export const dynamic = 'force-dynamic';

const PENDING_STATUSES = ['draft', 'submitted'];

export async function GET() {
  const [shops, pending, unassignedCount] = await Promise.all([
    prisma.shop.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { cases: true } } },
    }),
    prisma.case.groupBy({
      by: ['shopId'],
      where: { status: { in: PENDING_STATUSES } },
      _count: { _all: true },
    }),
    prisma.case.count({ where: { shopId: null } }),
  ]);

  const pendingByShop = new Map(pending.map((p) => [p.shopId, p._count._all]));

  const body: ShopsResponse = {
    shops: shops.map((s) => ({
      id: s.id,
      name: s.name,
      color: s.color,
      createdAt: s.createdAt.toISOString(),
      caseCount: s._count.cases,
      pendingCount: pendingByShop.get(s.id) ?? 0,
    })),
    unassignedCount,
  };
  return NextResponse.json(body);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
  }

  const existing = await prisma.shop.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json({ error: `A shop named "${name}" already exists` }, { status: 409 });
  }

  const used = await prisma.shop.findMany({ select: { color: true } });
  const color = nextShopColor(used.map((s) => s.color));

  const created = await prisma.shop.create({ data: { name, color } });
  return NextResponse.json(created, { status: 201 });
}
