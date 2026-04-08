import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const priority = searchParams.get('priority')
  const search = searchParams.get('search')
  const where: any = {}
  if (user.role === 'USER') where.userId = user.userId
  if (status) where.status = status
  if (priority) where.priority = priority
  if (search) where.OR = [{ subject: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }]
  const tickets = await prisma.ticket.findMany({
    where, orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, avatar: true, department: true } },
      agent: { select: { id: true, name: true, avatar: true } },
      _count: { select: { comments: true } },
    },
  })
  return NextResponse.json({ tickets })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const body = await req.json()
  const { subject, description, category, priority, tags } = body
  const availableAgent = await prisma.user.findFirst({ where: { role: 'AGENT', status: 'ONLINE', isActive: true } })
  const ticket = await prisma.ticket.create({
    data: {
      subject, description, category: category || 'general',
      priority: priority || 'MEDIUM', tags: tags || [],
      userId: user.userId, agentId: availableAgent?.id || null,
      dueDate: new Date(Date.now() + 86400000 * 2),
    },
    include: { user: { select: { id: true, name: true, avatar: true } }, agent: { select: { id: true, name: true, avatar: true } } },
  })
  if (availableAgent) {
    await prisma.notification.create({
      data: { userId: availableAgent.id, type: 'TICKET_ASSIGNED', title: 'Ticket assigned', text: `New ticket: ${subject}`, ticketId: ticket.id },
    })
  }
  return NextResponse.json({ ticket }, { status: 201 })
}
