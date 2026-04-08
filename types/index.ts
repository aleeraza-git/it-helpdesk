export type Role = 'USER' | 'AGENT' | 'MANAGER' | 'ADMIN'
export type UserStatus = 'ONLINE' | 'BUSY' | 'AWAY' | 'OFFLINE'
export type ChatStatus = 'QUEUED' | 'ACTIVE' | 'RESOLVED' | 'CLOSED'
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'PENDING' | 'RESOLVED' | 'CLOSED'
export type MessageType = 'TEXT' | 'FILE' | 'SYSTEM' | 'AI_SUGGESTION'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  department?: string
  status: UserStatus
  skills: string[]
  maxChats: number
  lastSeen?: string
  createdAt?: string
  isActive?: boolean
  _count?: { chatsAsAgent?: number }
}

export interface Message {
  id: string
  text: string
  type: MessageType
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isRead: boolean
  readAt?: string
  createdAt: string
  chatId: string
  senderId: string
  sender?: Pick<User, 'id' | 'name' | 'avatar' | 'role'>
}

export interface InternalNote {
  id: string
  text: string
  createdAt: string
  chatId: string
  agentId: string
  agent?: Pick<User, 'id' | 'name' | 'avatar'>
}

export interface Chat {
  id: string
  subject: string
  status: ChatStatus
  priority: Priority
  category: string
  tags: string[]
  queuePosition?: number
  rating?: number
  resolution?: string
  resolvedAt?: string
  createdAt: string
  updatedAt: string
  userId: string
  agentId?: string
  user?: User
  agent?: User
  messages?: Message[]
  internalNotes?: InternalNote[]
  ticket?: Ticket
  _count?: { messages?: number }
}

export interface TicketComment {
  id: string
  text: string
  isInternal: boolean
  createdAt: string
  ticketId: string
  userId: string
  user?: Pick<User, 'id' | 'name' | 'avatar' | 'role'>
}

export interface Ticket {
  id: string
  subject: string
  description: string
  status: TicketStatus
  priority: Priority
  category: string
  tags: string[]
  dueDate?: string
  resolution?: string
  resolvedAt?: string
  slaBreached: boolean
  slaResponse?: number
  slaResolution?: number
  createdAt: string
  updatedAt: string
  userId: string
  agentId?: string
  chatId?: string
  user?: User
  agent?: User
  chat?: Pick<Chat, 'id' | 'subject' | 'status'>
  comments?: TicketComment[]
  _count?: { comments?: number }
}

export interface KBArticle {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  views: number
  helpful: number
  published: boolean
  createdAt: string
  updatedAt: string
  authorId: string
  author?: Pick<User, 'id' | 'name' | 'avatar'>
}

export interface Notification {
  id: string
  type: string
  title: string
  text: string
  isRead: boolean
  chatId?: string
  ticketId?: string
  createdAt: string
  userId: string
}

export interface QuickReply {
  id: string
  title: string
  text: string
  category: string
}

export interface AnalyticsData {
  overview: {
    totalChats: number
    activeChats: number
    resolvedChats: number
    queuedChats: number
    totalTickets: number
    openTickets: number
    resolvedTickets: number
    slaBreached: number
    totalUsers: number
    totalAgents: number
    kbArticles: number
  }
  agents: (User & { _count: { chatsAsAgent: number; ticketsAsAgent: number } })[]
  categoryBreakdown: { category: string; _count: { id: number } }[]
  priorityBreakdown: { priority: string; _count: { id: number } }[]
  slaCompliance: { critical: number; high: number; medium: number; low: number }
  weeklyChats: number[]
  weeklyTickets: number[]
  avgResolutionTime: number
  csat: number
  firstContactResolution: number
}
