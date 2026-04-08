import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const notes = await prisma.internalNote.findMany({
    where: { chatId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { agent: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ notes })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { text } = await req.json()
  const note = await prisma.internalNote.create({
    data: { chatId: params.id, agentId: auth.user.userId, text },
    include: { agent: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ note }, { status: 201 })
}
