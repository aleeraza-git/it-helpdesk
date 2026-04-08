import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const where: any = {}
  if (user.role === 'USER') where.userId = user.userId
  else if (user.role === 'AGENT') {
    const ownChats = { agentId: user.userId }
    const queuedChats = { agentId: null, status: 'QUEUED' }
    where.OR = [ownChats, queuedChats]
  }
  if (status) where.status = status
  const chats = await prisma.chat.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, avatar: true, department: true, status: true, email: true } },
      agent: { select: { id: true, name: true, avatar: true, status: true } },
      messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      _count: { select: { messages: { where: { isRead: false } } } },
    },
  })
  return NextResponse.json({ chats })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const body = await req.json()
  const { subject, category, priority, message } = body
  if (!subject || !message) return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 })

  // Find available agent using round-robin
  const availableAgent = await prisma.user.findFirst({
    where: { role: 'AGENT', status: 'ONLINE', isActive: true },
    orderBy: { updatedAt: 'asc' },
  })

  const chat = await prisma.chat.create({
    data: {
      subject, category: category || 'general', priority: priority || 'MEDIUM',
      status: availableAgent ? 'ACTIVE' : 'QUEUED',
      queuePosition: availableAgent ? null : 1,
      userId: user.userId,
      agentId: availableAgent?.id || null,
      messages: {
        create: [{ text: message, senderId: user.userId, type: 'TEXT' }],
      },
    },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      agent: { select: { id: true, name: true, avatar: true } },
      messages: true,
    },
  })

  if (availableAgent) {
    // Auto greeting from agent
    await prisma.message.create({
      data: {
        text: `Hello! I am ${availableAgent.name} from IMARAT IT Support. I have reviewed your request and will assist you now. Could you please provide any additional details that might help us resolve this faster?`,
        chatId: chat.id, senderId: availableAgent.id, type: 'TEXT',
      },
    })
    await prisma.notification.create({
      data: { userId: availableAgent.id, type: 'NEW_CHAT', title: 'New chat assigned', text: `New support request from ${user.name}: ${subject}`, chatId: chat.id },
    })
  }

  await prisma.auditLog.create({
    data: { userId: user.userId, action: 'CREATE', entity: 'Chat', entityId: chat.id, newValue: JSON.stringify({ subject, category, priority }) },
  })

  return NextResponse.json({ chat }, { status: 201 })
}
