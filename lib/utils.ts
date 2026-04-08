// lib/utils.ts - Shared utilities
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

export function formatTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diff = (now.getTime() - d.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function priorityColor(priority: string): string {
  const map: Record<string, string> = {
    CRITICAL: '#dc2626', HIGH: '#ea580c', MEDIUM: '#d97706', LOW: '#16a34a',
  }
  return map[priority] || '#6b7280'
}

export function statusColor(status: string): { bg: string; color: string } {
  const map: Record<string, { bg: string; color: string }> = {
    ACTIVE: { bg: '#dcfce7', color: '#15803d' },
    QUEUED: { bg: '#fef3c7', color: '#92400e' },
    RESOLVED: { bg: '#f3f4f6', color: '#6b7280' },
    CLOSED: { bg: '#f3f4f6', color: '#6b7280' },
    OPEN: { bg: '#dbeafe', color: '#1d4ed8' },
    IN_PROGRESS: { bg: '#ede9fe', color: '#6d28d9' },
    PENDING: { bg: '#fef9c3', color: '#854d0e' },
    ONLINE: { bg: '#dcfce7', color: '#15803d' },
    BUSY: { bg: '#fee2e2', color: '#dc2626' },
    AWAY: { bg: '#fef3c7', color: '#92400e' },
    OFFLINE: { bg: '#f3f4f6', color: '#6b7280' },
  }
  return map[status] || { bg: '#f3f4f6', color: '#374151' }
}

export function generateAvatarInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function calculateSLAStatus(createdAt: Date, priority: string, status: string): boolean {
  if (status === 'RESOLVED' || status === 'CLOSED') return false
  const hours = (new Date().getTime() - createdAt.getTime()) / 3600000
  const limits: Record<string, number> = { CRITICAL: 2, HIGH: 4, MEDIUM: 8, LOW: 24 }
  return hours > (limits[priority] || 8)
}
