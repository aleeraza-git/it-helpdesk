import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const chat = await prisma.chat.findUnique({
    where: { id: params.id },
    include: { internalNotes: true },
  })
  if (!chat) return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
  if (chat.ticket) return NextResponse.json({ error: 'Ticket already exists for this chat' }, { status: 409 })

  const notes = chat.internalNotes.map(n => n.text).join(' | ')
  const ticket = await prisma.ticket.create({
    data: {
      subject: chat.subject,
      description: `Escalated from live chat on ${new Date().toLocaleDateString('en-GB')}.\n\nOriginal request: See chat transcript.\n\nAgent notes: ${notes || 'None'}`,
      status: 'OPEN', priority: chat.priority, category: chat.category,
      tags: chat.tags, userId: chat.userId, agentId: chat.agentId,
      chatId: chat.id,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
  })

  await prisma.message.create({
    data: { chatId: chat.id, senderId: user.userId, text: `This conversation has been escalated to ticket #${ticket.id.slice(-8).toUpperCase()}. Our team will follow up with updates via the ticket system.`, type: 'SYSTEM' },
  })

  await prisma.notification.create({
    data: { userId: chat.userId, type: 'TICKET_CREATED', title: 'Ticket created', text: `Your chat was escalated to ticket: ${ticket.subject}`, ticketId: ticket.id },
  })

  return NextResponse.json({ ticket }, { status: 201 })
}
