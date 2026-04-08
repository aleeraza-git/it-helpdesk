'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAPI } from '@/hooks/useAPI'
import { useRouter } from 'next/navigation'
import { AnalyticsData } from '@/types'
import { Avatar, Badge, PriorityBadge, IC, StatusDot, formatTime, Spinner, Card } from '@/components/ui'

export default function DashboardPage() {
  const { user } = useAuth()
  const { get } = useAPI()
  const router = useRouter()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [recentChats, setRecentChats] = useState<any[]>([])
  const [recentTickets, setRecentTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [analyticsData, chatsData, ticketsData] = await Promise.all([get('/analytics'), get('/chats'), get('/tickets')])
        setData(analyticsData)
        setRecentChats(chatsData.chats?.slice(0, 5) || [])
        setRecentTickets(ticketsData.tickets?.slice(0, 5) || [])
      } catch {} finally { setLoading(false) }
    }
    fetchAll()
    const interval = setInterval(() => { get('/analytics').then(a => setData(a)).catch(() => {}) }, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><Spinner size={32} /></div>

  const ov = data?.overview
  const isStaff = user?.role !== 'USER'
  const greeting = new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'

  return (
    <div style={{ padding: 28 }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Good {greeting}, {user?.name?.split(' ')[0]} 👋</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>{isStaff ? 'Here is an overview of IT Support operations' : 'Welcome to IMARAT IT Support Portal'}</div>
      </div>

      {isStaff ? (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
            {[
              { icon: 'chat', label: 'Active Chats', value: ov?.activeChats, sub: `${ov?.queuedChats} in queue`, color: '#3b82f6', href: '/dashboard/chats' },
              { icon: 'ticket', label: 'Open Tickets', value: ov?.openTickets, sub: `${ov?.totalTickets} total`, color: '#8b5cf6', href: '/dashboard/tickets' },
              { icon: 'warning', label: 'SLA Breaches', value: ov?.slaBreached, sub: 'Need attention', color: '#ef4444', href: '/dashboard/analytics' },
              { icon: 'users', label: 'Online Agents', value: data?.agents?.filter(a => a.status === 'ONLINE').length, sub: `of ${ov?.totalAgents} agents`, color: '#10b981', href: '/dashboard/users' },
              { icon: 'resolve', label: 'Resolved', value: ov?.resolvedChats, sub: 'Chats closed', color: '#10b981' },
              { icon: 'kb', label: 'KB Articles', value: ov?.kbArticles, sub: 'Published', color: '#f59e0b', href: '/dashboard/knowledge' },
            ].map(stat => (
              <div key={stat.label} onClick={() => stat.href && router.push(stat.href)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, cursor: stat.href ? 'pointer' : 'default', borderTop: `3px solid ${stat.color}`, transition: 'transform .15s' }}
                onMouseEnter={e => stat.href && (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 500, marginBottom: 8 }}>{stat.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{stat.value ?? 0}</div>
                    {stat.sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>{stat.sub}</div>}
                  </div>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: `${stat.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IC name={stat.icon} size={18} color={stat.color} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Recent Chats</span>
                <button onClick={() => router.push('/dashboard/chats')} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>View all →</button>
              </div>
              {recentChats.length === 0 ? <div style={{ textAlign: 'center', color: 'var(--text3)', padding: 20, fontSize: 13 }}>No chats yet</div> : recentChats.map(chat => (
                <div key={chat.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <Avatar user={chat.user} size={30} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.subject}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{chat.user?.name} — {chat.agent?.name || 'Unassigned'}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <Badge label={chat.status} />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>{formatTime(chat.updatedAt)}</span>
                  </div>
                </div>
              ))}
            </Card>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Team Status</span>
                <button onClick={() => router.push('/dashboard/users')} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>Manage →</button>
              </div>
              {data?.agents?.map(agent => (
                <div key={agent.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar user={agent} size={30} />
                    <StatusDot status={agent.status} style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--surface)' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{agent._count?.chatsAsAgent || 0}/{agent.maxChats} chats</div>
                  </div>
                  <Badge label={agent.status} />
                </div>
              ))}
            </Card>
          </div>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Recent Tickets</span>
              <button onClick={() => router.push('/dashboard/tickets')} style={{ fontSize: 12, color: 'var(--accent)', cursor: 'pointer' }}>View all →</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>{['ID', 'Subject', 'User', 'Priority', 'Status', 'Updated'].map(h => <th key={h} style={{ padding: '6px 12px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textAlign: 'left' }}>{h}</th>)}</tr></thead>
              <tbody>{recentTickets.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }} onClick={() => router.push('/dashboard/tickets')}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '10px 12px' }}><span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--accent)' }}>{t.id.slice(-6).toUpperCase()}</span></td>
                  <td style={{ padding: '10px 12px', maxWidth: 240 }}><div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</div></td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text2)' }}>{t.user?.name}</td>
                  <td style={{ padding: '10px 12px' }}><PriorityBadge priority={t.priority} /></td>
                  <td style={{ padding: '10px 12px' }}><Badge label={t.status} /></td>
                  <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>{formatTime(t.updatedAt)}</td>
                </tr>
              ))}</tbody>
            </table>
          </Card>
        </>
      ) : (
        // User portal view
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
          {[
            { icon: 'chat', label: 'Start Live Chat', sub: 'Chat with an IT agent in real-time', color: '#3b82f6', href: '/dashboard/chats' },
            { icon: 'ticket', label: 'Submit a Ticket', sub: 'Log an issue for our IT team', color: '#8b5cf6', href: '/dashboard/tickets' },
            { icon: 'kb', label: 'Knowledge Base', sub: 'Find answers to common questions', color: '#f59e0b', href: '/dashboard/knowledge' },
            { icon: 'bell', label: 'My Notifications', sub: 'View your updates and alerts', color: '#10b981', href: '/dashboard/notifications' },
          ].map(card => (
            <div key={card.label} onClick={() => router.push(card.href)}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, cursor: 'pointer', borderTop: `4px solid ${card.color}`, transition: 'transform .2s, box-shadow .2s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${card.color}20` }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: `${card.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <IC name={card.icon} size={24} color={card.color} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>{card.label}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>{card.sub}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
