import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  if (!name) {
    return NextResponse.json({ error: 'Shop name is required' }, { status: 400 });
  }

  const clash = await prisma.shop.findUnique({ where: { name } });
  if (clash && clash.id !== params.id) {
    return NextResponse.json({ error: `A shop named "${name}" already exists` }, { status: 409 });
  }

  const updated = await prisma.shop.update({ where: { id: params.id }, data: { name } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  // Refuse to delete a shop that still has disputes — they'd silently lose their shop.
  const caseCount = await prisma.case.count({ where: { shopId: params.id } });
  if (caseCount > 0) {
    return NextResponse.json(
      { error: `This shop still has ${caseCount} dispute${caseCount > 1 ? 's' : ''}. Move or delete them first.` },
      { status: 409 },
    );
  }

  await prisma.shop.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
