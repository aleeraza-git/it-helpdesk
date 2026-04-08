import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req)
    if (user) await prisma.user.update({ where: { id: user.userId }, data: { status: 'OFFLINE', lastSeen: new Date() } })
    const response = NextResponse.json({ success: true })
    response.cookies.delete('auth_token')
    return response
  } catch { return NextResponse.json({ success: true }) }
}
