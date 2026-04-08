import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const replies = await prisma.quickReply.findMany({ orderBy: { title: 'asc' } })
  return NextResponse.json({ replies })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { title, text, category } = await req.json()
  const reply = await prisma.quickReply.create({ data: { title, text, category: category || 'general' } })
  return NextResponse.json({ reply }, { status: 201 })
}
