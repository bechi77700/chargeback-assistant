import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultEvidenceFor } from '@/lib/evidence';
import type { DisputeType } from '@/lib/dispute-types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cases = await prisma.case.findMany({
    orderBy: [{ status: 'asc' }, { deadline: 'asc' }],
  });
  return NextResponse.json(cases);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { orderNumber, disputeType, deadline } = body as {
    orderNumber?: string;
    disputeType?: DisputeType;
    deadline?: string;
  };

  if (!orderNumber || !disputeType || !deadline) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const evidence = JSON.stringify(defaultEvidenceFor(disputeType));

  const created = await prisma.case.create({
    data: {
      orderNumber: orderNumber.trim(),
      disputeType,
      deadline: new Date(deadline),
      evidence,
      step: 1,
    },
  });

  return NextResponse.json(created, { status: 201 });
}
