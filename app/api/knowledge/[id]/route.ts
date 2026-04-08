import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const article = await prisma.kBArticle.findUnique({
    where: { id: params.id },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  })
  if (!article) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await prisma.kBArticle.update({ where: { id: params.id }, data: { views: { increment: 1 } } })
  return NextResponse.json({ article })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await req.json()
  const article = await prisma.kBArticle.update({ where: { id: params.id }, data: { ...body, updatedAt: new Date() } })
  return NextResponse.json({ article })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ['MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  await prisma.kBArticle.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
