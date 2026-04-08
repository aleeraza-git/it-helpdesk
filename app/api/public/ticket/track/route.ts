import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const ticketId = searchParams.get("id")
  const email = searchParams.get("email")

  if (!ticketId || !email) {
    return NextResponse.json({ error: "Ticket ID and email are required" }, { status: 400 })
  }

  const ticket = await prisma.ticket.findFirst({
    where: {
      id: { endsWith: ticketId.toLowerCase() },
      user: { email: email.toLowerCase() },
    },
    include: {
      user: { select: { name: true, email: true } },
      agent: { select: { name: true } },
      comments: {
        where: { isInternal: false },
        orderBy: { createdAt: "asc" },
        include: { user: { select: { name: true, role: true } } },
      },
    },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found. Please check your ticket number and email." }, { status: 404 })
  }

  return NextResponse.json({ ticket, ticketNumber: ticket.id.slice(-8).toUpperCase() })
}