import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')
  const category = searchParams.get('category')
  const where: any = { published: true }
  if (search) where.OR = [{ title: { contains: search, mode: 'insensitive' } }, { content: { contains: search, mode: 'insensitive' } }, { tags: { has: search.toLowerCase() } }]
  if (category && category !== 'all') where.category = category
  const articles = await prisma.kBArticle.findMany({
    where, orderBy: { views: 'desc' },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ articles })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const body = await req.json()
  const { title, content, category, tags, published } = body
  const article = await prisma.kBArticle.create({
    data: { title, content, category, tags: tags || [], published: published !== false, authorId: auth.user.userId },
    include: { author: { select: { id: true, name: true, avatar: true } } },
  })
  return NextResponse.json({ article }, { status: 201 })
}
