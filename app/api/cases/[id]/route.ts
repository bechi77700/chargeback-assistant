import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { defaultEvidenceFor, reassignExhibits } from '@/lib/evidence';
import type { DisputeType } from '@/lib/dispute-types';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const c = await prisma.case.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(c);
}

const DATE_FIELDS = ['orderDate', 'shipDate', 'deliveryDate', 'latestScanDate', 'estimatedDate', 'deadline'] as const;

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const data: Record<string, unknown> = {};

  // Allow-list of editable fields
  const STRING_FIELDS = [
    'orderNumber', 'customerName', 'customerEmail', 'trackingNumber',
    'packageStatus', 'contactedSupport', 'deliveryZip', 'billingAddress',
    'shippingAddress', 'productDesc', 'returnWindow', 'responseText',
    'notes', 'status',
  ] as const;

  for (const f of STRING_FIELDS) {
    if (f in body) data[f] = body[f] === '' ? null : body[f];
  }

  for (const f of DATE_FIELDS) {
    if (f in body) {
      const v = body[f];
      data[f] = v ? new Date(v) : null;
    }
  }

  if ('amount' in body) {
    const v = body.amount;
    data.amount = v === '' || v == null ? null : Number(v);
  }

  if ('disputeType' in body && body.disputeType) {
    data.disputeType = body.disputeType;
    // Reset evidence to default for the new type
    data.evidence = JSON.stringify(defaultEvidenceFor(body.disputeType as DisputeType));
  }

  if ('evidence' in body) {
    // Re-assign exhibit letters before persisting to keep them in check-order
    const items = Array.isArray(body.evidence) ? body.evidence : [];
    data.evidence = JSON.stringify(reassignExhibits(items));
  }

  if ('step' in body && typeof body.step === 'number') {
    data.step = body.step;
  }

  // Status transitions
  if (body.status === 'submitted' && !body.skipTimestamp) {
    data.submittedAt = new Date();
  }
  if (body.status === 'won' || body.status === 'lost') {
    data.closedAt = new Date();
  }

  const updated = await prisma.case.update({ where: { id: params.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await prisma.case.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
