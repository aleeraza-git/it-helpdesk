import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyPassword, generateToken } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true, password: true, role: true, avatar: true, department: true, status: true, skills: true, maxChats: true, isActive: true },
    })
    if (!user || !user.isActive) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const valid = await verifyPassword(password, user.password)
    if (!valid) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    const token = generateToken({ userId: user.id, email: user.email, role: user.role, name: user.name })
    await prisma.user.update({ where: { id: user.id }, data: { lastSeen: new Date(), status: 'ONLINE' } })
    const { password: _, ...safeUser } = user
    const response = NextResponse.json({ user: safeUser, token }, { status: 200 })
    response.cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 7, path: '/' })
    return response
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
