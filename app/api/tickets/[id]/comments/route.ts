import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const { text, isInternal } = await req.json()
  const comment = await prisma.ticketComment.create({
    data: { ticketId: params.id, userId: user.userId, text, isInternal: (isInternal && user.role !== 'USER') || false },
    include: { user: { select: { id: true, name: true, avatar: true, role: true } } },
  })
  const ticket = await prisma.ticket.findUnique({ where: { id: params.id } })
  if (ticket && !isInternal) {
    const notifyId = user.role === 'USER' ? ticket.agentId : ticket.userId
    if (notifyId) {
      await prisma.notification.create({
        data: { userId: notifyId, type: 'TICKET_UPDATED', title: 'New comment on ticket', text: `${user.name} commented on: ${ticket.subject}`, ticketId: params.id },
      })
    }
  }
  return NextResponse.json({ comment }, { status: 201 })
}
