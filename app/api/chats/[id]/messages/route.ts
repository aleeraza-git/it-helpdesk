import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  const { text, type, fileUrl, fileName, fileSize } = await req.json()
  if (!text && !fileUrl) return NextResponse.json({ error: 'Message content required' }, { status: 400 })

  const message = await prisma.message.create({
    data: { chatId: params.id, senderId: user.userId, text: text || '', type: type || 'TEXT', fileUrl, fileName, fileSize },
    include: { sender: { select: { id: true, name: true, avatar: true, role: true } } },
  })

  await prisma.chat.update({ where: { id: params.id }, data: { updatedAt: new Date() } })

  // Notify the other party
  const chat = await prisma.chat.findUnique({ where: { id: params.id } })
  if (chat) {
    const recipientId = user.role === 'USER' ? chat.agentId : chat.userId
    if (recipientId) {
      await prisma.notification.create({
        data: { userId: recipientId, type: 'NEW_MESSAGE', title: 'New message', text: `${user.name} sent a message: ${text?.slice(0, 60)}`, chatId: params.id },
      })
    }
  }

  return NextResponse.json({ message }, { status: 201 })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  await prisma.message.updateMany({
    where: { chatId: params.id, senderId: { not: user.userId }, isRead: false },
    data: { isRead: true, readAt: new Date() },
  })
  return NextResponse.json({ success: true })
}
