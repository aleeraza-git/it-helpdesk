import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const chat = await prisma.chat.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, department: true, email: true, status: true } },
      agent: { select: { id: true, name: true, avatar: true, status: true, skills: true } },
      messages: { orderBy: { createdAt: 'asc' }, include: { sender: { select: { id: true, name: true, avatar: true, role: true } } } },
      internalNotes: { orderBy: { createdAt: 'asc' }, include: { agent: { select: { id: true, name: true, avatar: true } } } },
      ticket: true,
    },
  })
  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  return NextResponse.json({ chat })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await req.json()
  const chat = await prisma.chat.update({
    where: { id: params.id },
    data: { ...body, updatedAt: new Date() },
    include: { user: { select: { id: true, name: true, avatar: true } }, agent: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ chat })
}
