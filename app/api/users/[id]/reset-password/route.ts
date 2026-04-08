import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth, hashPassword } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ["MANAGER", "ADMIN"])
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { password } = await req.json()
  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
  }
  const hashed = await hashPassword(password)
  await prisma.user.update({ where: { id: params.id }, data: { password: hashed } })
  return NextResponse.json({ success: true })
}