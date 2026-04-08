import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { resolution } = await req.json()
  const chat = await prisma.chat.update({
    where: { id: params.id },
    data: { status: 'RESOLVED', resolution, resolvedAt: new Date(), updatedAt: new Date() },
  })
  await prisma.message.create({
    data: { chatId: params.id, senderId: auth.user.userId, text: 'This chat has been marked as resolved. If you need further assistance, please start a new chat or create a support ticket.', type: 'SYSTEM' },
  })
  await prisma.notification.create({
    data: { userId: chat.userId, type: 'CHAT_RESOLVED', title: 'Chat resolved', text: `Your support chat "${chat.subject}" has been resolved.`, chatId: chat.id },
  })
  return NextResponse.json({ chat })
}
