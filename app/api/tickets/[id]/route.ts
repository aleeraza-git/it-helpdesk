import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, department: true, email: true } },
      agent: { select: { id: true, name: true, avatar: true, skills: true } },
      chat: { select: { id: true, subject: true, status: true } },
      comments: { orderBy: { createdAt: 'asc' }, include: { user: { select: { id: true, name: true, avatar: true, role: true } } } },
    },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ticket })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await req.json()
  const updateData: any = { ...body, updatedAt: new Date() }
  if (body.status === 'RESOLVED') { updateData.resolvedAt = new Date() }
  const ticket = await prisma.ticket.update({
    where: { id: params.id }, data: updateData,
    include: { user: { select: { id: true, name: true, avatar: true } }, agent: { select: { id: true, name: true, avatar: true } } },
  })
  await prisma.notification.create({
    data: { userId: ticket.userId, type: 'TICKET_UPDATED', title: 'Ticket updated', text: `Your ticket "${ticket.subject}" has been updated.`, ticketId: ticket.id },
  })
  return NextResponse.json({ ticket })
}
