import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, category, message } = await req.json()
    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name, email: email.toLowerCase(), password: "guest-no-login",
          role: "USER", skills: [], maxChats: 1, status: "ONLINE",
          avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        },
      })
    }

    const agent = await prisma.user.findFirst({
      where: { role: "AGENT", status: "ONLINE", isActive: true },
    })

    const chat = await prisma.chat.create({
      data: {
        subject, category: category || "general", priority: "MEDIUM",
        status: agent ? "ACTIVE" : "QUEUED",
        userId: user.id, agentId: agent?.id || null,
        queuePosition: agent ? null : 1,
        messages: {
          create: [{ text: message, senderId: user.id, type: "TEXT" }],
        },
      },
    })

    if (agent) {
      await prisma.message.create({
        data: {
          chatId: chat.id, senderId: agent.id, type: "TEXT",
          text: `Hello ${name}! I am ${agent.name} from IMARAT IT Support. I will assist you now.`,
        },
      })
      await prisma.notification.create({
        data: {
          userId: agent.id, type: "NEW_CHAT",
          title: "New public chat", text: `${name} started a chat: ${subject}`,
          chatId: chat.id,
        },
      })
    }

    return NextResponse.json({ success: true, chatId: chat.id, agentName: agent?.name || null, status: chat.status }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to start chat" }, { status: 500 })
  }
}