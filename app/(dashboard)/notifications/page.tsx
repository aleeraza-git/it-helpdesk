'use client'
import { useState, useEffect } from 'react'
import { useAPI } from '@/hooks/useAPI'
import { Notification } from '@/types'
import { IC, Btn, Empty, formatTime, Spinner } from '@/components/ui'
import { useRouter } from 'next/navigation'

const TYPE_ICONS: Record<string, { icon: string; color: string }> = {
  NEW_CHAT: { icon: 'chat', color: '#3b82f6' },
  CHAT_ASSIGNED: { icon: 'chat', color: '#8b5cf6' },
  NEW_MESSAGE: { icon: 'chat', color: '#3b82f6' },
  CHAT_RESOLVED: { icon: 'resolve', color: '#10b981' },
  TICKET_CREATED: { icon: 'ticket', color: '#f59e0b' },
  TICKET_UPDATED: { icon: 'ticket', color: '#8b5cf6' },
  TICKET_ASSIGNED: { icon: 'ticket', color: '#3b82f6' },
  SYSTEM: { icon: 'bell', color: '#6b7280' },
}

export default function NotificationsPage() {
  const { get, patch } = useAPI()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    get('/notifications').then(d => setNotifications(d.notifications || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markAllRead = async () => {
    await patch('/notifications', {})
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const filteredNotifs = filter === 'unread' ? notifications.filter(n => !n.isRead) : notifications

  const unreadCount = notifications.filter(n => !n.isRead).length

  const handleClick = (n: Notification) => {
    if (n.chatId) router.push('/dashboard/chats')
    else if (n.ticketId) router.push('/dashboard/tickets')
  }

  return (
    <div style={{ padding: 28, maxWidth: 760, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--text3)' }}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {[['all', 'All'], ['unread', 'Unread']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, border: `1px solid ${filter === v ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer', background: filter === v ? 'var(--accent)' : 'var(--surface)', color: filter === v ? '#fff' : 'var(--text2)' }}>{l}</button>
          ))}
          {unreadCount > 0 && <Btn size="sm" variant="ghost" onClick={markAllRead}><IC name="check-double" size={13} />Mark all read</Btn>}
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner size={32} /></div>
      ) : filteredNotifs.length === 0 ? (
        <Empty icon="bell" title="No notifications" subtitle="You are all caught up!" />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          {filteredNotifs.map((n, i) => {
            const meta = TYPE_ICONS[n.type] || TYPE_ICONS.SYSTEM
            return (
              <div key={n.id} onClick={() => handleClick(n)}
                style={{ display: 'flex', gap: 16, padding: '16px 20px', borderBottom: i < filteredNotifs.length - 1 ? '1px solid var(--border)' : 'none', cursor: (n.chatId || n.ticketId) ? 'pointer' : 'default', background: n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)', transition: 'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                onMouseLeave={e => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(59,130,246,0.04)'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: n.isRead ? 'var(--surface2)' : `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <IC name={meta.icon} size={18} color={n.isRead ? 'var(--text3)' : meta.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: n.isRead ? 400 : 600, color: 'var(--text)', marginBottom: 3 }}>{n.title}</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{formatTime(n.createdAt)}</div>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 6 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
