import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { hashPassword } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { searchParams } = new URL(req.url)
  const role = searchParams.get('role')
  const where: any = {}
  if (role) where.role = role
  const users = await prisma.user.findMany({
    where, orderBy: { name: 'asc' },
    select: { id: true, name: true, email: true, role: true, avatar: true, department: true, status: true, skills: true, maxChats: true, isActive: true, lastSeen: true, createdAt: true, _count: { select: { chatsAsAgent: { where: { status: 'ACTIVE' } } } } },
  })
  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req, ['MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { name, email, password, role, department, skills, maxChats } = await req.json()
  const hashedPwd = await hashPassword(password)
  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), password: hashedPwd, role, department, skills: skills || [], maxChats: maxChats || 5, avatar: name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) },
    select: { id: true, name: true, email: true, role: true, avatar: true, department: true, status: true },
  })
  return NextResponse.json({ user }, { status: 201 })
}
