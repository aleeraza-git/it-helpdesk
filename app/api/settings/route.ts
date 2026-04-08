import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const settings = await prisma.systemSettings.findMany()
  const map: Record<string, string> = {}
  settings.forEach(s => { map[s.key] = s.value })
  return NextResponse.json({ settings: map })
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAuth(req, ['MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { settings } = await req.json()
  for (const [key, value] of Object.entries(settings)) {
    await prisma.systemSettings.upsert({
      where: { key }, update: { value: String(value) }, create: { key, value: String(value) },
    })
  }
  return NextResponse.json({ success: true })
}
