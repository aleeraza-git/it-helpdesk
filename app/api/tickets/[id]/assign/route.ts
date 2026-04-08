import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireAuth } from "@/lib/auth"

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth(req, ["MANAGER", "ADMIN"])
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { agentId } = await req.json()
  const agent = await prisma.user.findUnique({ where: { id: agentId } })
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  const ticket = await prisma.ticket.update({
    where: { id: params.id },
    data: { agentId, status: "IN_PROGRESS", updatedAt: new Date() },
    include: { user: { select: { id: true, name: true } } },
  })
  await prisma.notification.create({
    data: { userId: agentId, type: "TICKET_ASSIGNED", title: "Ticket assigned to you", text: `You have been assigned ticket: ${ticket.subject}`, ticketId: ticket.id },
  })
  await prisma.notification.create({
    data: { userId: ticket.userId, type: "TICKET_UPDATED", title: "Agent assigned to your ticket", text: `${agent.name} has been assigned to your ticket: ${ticket.subject}`, ticketId: ticket.id },
  })
  return NextResponse.json({ ticket })
}