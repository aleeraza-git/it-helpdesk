import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { agentId } = await req.json()
  const agent = await prisma.user.findUnique({ where: { id: agentId } })
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  const chat = await prisma.chat.update({
    where: { id: params.id },
    data: { agentId, status: 'ACTIVE', queuePosition: null, updatedAt: new Date() },
  })
  await prisma.message.create({
    data: { chatId: params.id, senderId: auth.user.userId, text: `Chat assigned to ${agent.name}.`, type: 'SYSTEM' },
  })
  await prisma.notification.create({
    data: { userId: agentId, type: 'CHAT_ASSIGNED', title: 'Chat assigned to you', text: `You have been assigned a chat: ${chat.subject}`, chatId: chat.id },
  })
  return NextResponse.json({ chat })
}
