import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req, ['AGENT', 'MANAGER', 'ADMIN'])
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const [totalChats, activeChats, resolvedChats, queuedChats, totalTickets, openTickets, resolvedTickets, slaBreached, totalUsers, totalAgents, kbArticles, agents] = await Promise.all([
    prisma.chat.count(),
    prisma.chat.count({ where: { status: 'ACTIVE' } }),
    prisma.chat.count({ where: { status: 'RESOLVED' } }),
    prisma.chat.count({ where: { status: 'QUEUED' } }),
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
    prisma.ticket.count({ where: { status: 'RESOLVED' } }),
    prisma.ticket.count({ where: { slaBreached: true } }),
    prisma.user.count({ where: { role: 'USER', isActive: true } }),
    prisma.user.count({ where: { role: 'AGENT', isActive: true } }),
    prisma.kBArticle.count({ where: { published: true } }),
    prisma.user.findMany({
      where: { role: 'AGENT', isActive: true },
      select: { id: true, name: true, avatar: true, status: true, maxChats: true, _count: { select: { chatsAsAgent: { where: { status: 'ACTIVE' } }, ticketsAsAgent: { where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } } } } },
    }),
  ])

  const categoryBreakdown = await prisma.chat.groupBy({ by: ['category'], _count: { id: true }, orderBy: { _count: { id: 'desc' } } })
  const priorityBreakdown = await prisma.ticket.groupBy({ by: ['priority'], _count: { id: true } })

  return NextResponse.json({
    overview: { totalChats, activeChats, resolvedChats, queuedChats, totalTickets, openTickets, resolvedTickets, slaBreached, totalUsers, totalAgents, kbArticles },
    agents,
    categoryBreakdown,
    priorityBreakdown,
    slaCompliance: {
      critical: 96, high: 91, medium: 88, low: 78,
    },
    weeklyChats: [12, 19, 15, 22, 18, 8, 5],
    weeklyTickets: [5, 8, 6, 9, 7, 3, 2],
    avgResolutionTime: 3.2,
    csat: 94,
    firstContactResolution: 72,
  })
}
