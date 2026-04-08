import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req)
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { user } = auth
  if (user.userId !== params.id && !['MANAGER', 'ADMIN'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json()
  const { password, ...rest } = body
  const updated = await prisma.user.update({
    where: { id: params.id }, data: { ...rest },
    select: { id: true, name: true, email: true, role: true, avatar: true, department: true, status: true, skills: true, maxChats: true },
  })
  return NextResponse.json({ user: updated })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  await prisma.user.update({ where: { id: params.id }, data: { isActive: false } })
  return NextResponse.json({ success: true })
}
