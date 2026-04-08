import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const notifications = await prisma.notification.findMany({
    where: { userId: auth.user.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })
  return NextResponse.json({ notifications })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { ids } = await req.json()
  if (ids) {
    await prisma.notification.updateMany({ where: { id: { in: ids }, userId: auth.user.userId }, data: { isRead: true } })
  } else {
    await prisma.notification.updateMany({ where: { userId: auth.user.userId }, data: { isRead: true } })
  }
  return NextResponse.json({ success: true })
}
