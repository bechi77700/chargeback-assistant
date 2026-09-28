import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultEvidenceFor } from '@/lib/evidence';
import type { DisputeType } from '@/lib/dispute-types';
import { NO_SHOP, SHOP_REF_SELECT } from '@/lib/shops';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // ?shop=<id> → one shop, ?shop=none → cases without a shop, absent → all shops
  const shop = req.nextUrl.searchParams.get('shop');
  const where = !shop ? {} : shop === NO_SHOP ? { shopId: null } : { shopId: shop };

  const cases = await prisma.case.findMany({
    where,
    include: { shop: { select: SHOP_REF_SELECT } },
    orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
  });
  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderNumber, disputeType, deadline, shopId } = body as {
    orderNumber?: string;
    disputeType?: DisputeType;
    deadline?: string;
    shopId?: string;
  };

  if (!orderNumber || !disputeType || !deadline || !shopId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const shop = await prisma.shop.findUnique({ where: { id: shopId } });
  if (!shop) {
    return NextResponse.json({ error: 'Unknown shop' }, { status: 400 });
  }

  const evidence = JSON.stringify(defaultEvidenceFor(disputeType));

  const created = await prisma.case.create({
    data: {
      orderNumber: orderNumber.trim(),
      disputeType,
      deadline: new Date(deadline),
      shopId,
      evidence,
      step: 1,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
