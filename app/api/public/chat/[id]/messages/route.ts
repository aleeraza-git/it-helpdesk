import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(req.url)
  const email = searchParams.get("email")
  const chat = await prisma.chat.findFirst({
    where: { id: params.id, user: { email: email || "" } },
    include: {
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true, role: true, avatar: true } } } },
      agent: { select: { name: true, avatar: true } },
    },
  })
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  return NextResponse.json({ chat })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { text, email } = await req.json()
  const chat = await prisma.chat.findFirst({ where: { id: params.id, user: { email: email || "" } } })
  if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 })
  const user = await prisma.user.findUnique({ where: { email: email || "" } })
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })
  const message = await prisma.message.create({
    data: { chatId: params.id, senderId: user.id, text, type: "TEXT" },
    include: { sender: { select: { name: true, role: true, avatar: true } } },
  })
  await prisma.chat.update({ where: { id: params.id }, data: { updatedAt: new Date() } })
  return NextResponse.json({ message }, { status: 201 })
}