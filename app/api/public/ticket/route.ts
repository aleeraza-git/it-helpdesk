import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { sendTicketConfirmation } from "@/lib/email/mailer"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, subject, description, category, priority } = body
    if (!name || !email || !subject || !description) {
      return NextResponse.json({ error: "Name, email, subject and description are required" }, { status: 400 })
    }
    let user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          name, email: email.toLowerCase(), password: "guest-no-login",
          role: "USER", department: phone || "", skills: [], maxChats: 1, status: "OFFLINE",
          avatar: name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2),
        },
      })
    }
    const agent = await prisma.user.findFirst({ where: { role: "AGENT", status: "ONLINE", isActive: true } })
    const ticket = await prisma.ticket.create({
      data: {
        subject, description, category: category || "general", priority: priority || "MEDIUM",
        status: "OPEN", userId: user.id, agentId: agent?.id || null,
        dueDate: new Date(Date.now() + 86400000 * 2), tags: [],
      },
    })
    const ticketNumber = ticket.id.slice(-8).toUpperCase()
    if (agent) {
      await prisma.notification.create({
        data: { userId: agent.id, type: "TICKET_CREATED", title: "New public ticket", text: `${name} submitted a ticket: ${subject}`, ticketId: ticket.id },
      })
    }
    try {
      await sendTicketConfirmation({ name, email, ticketNumber, subject, priority: priority || "MEDIUM", category: category || "general" })
    } catch (emailErr) {
      console.error("Email error:", emailErr)
    }
    return NextResponse.json({ success: true, ticketId: ticket.id, ticketNumber, message: "Your ticket has been submitted successfully." }, { status: 201 })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 })
  }
}