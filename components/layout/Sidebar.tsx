'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Avatar, StatusDot, IC, Badge } from '@/components/ui'

const NAV_ITEMS = {
  USER: [
    { href: '/dashboard/chats', icon: 'chat', label: 'My Chats' },
    { href: '/dashboard/tickets', icon: 'ticket', label: 'My Tickets' },
    { href: '/dashboard/knowledge', icon: 'kb', label: 'Knowledge Base' },
    { href: '/dashboard/notifications', icon: 'bell', label: 'Notifications' },
  ],
  AGENT: [
    { href: '/dashboard', icon: 'inbox', label: 'My Queue', exact: true },
    { href: '/dashboard/chats', icon: 'chat', label: 'Live Chats' },
    { href: '/dashboard/tickets', icon: 'ticket', label: 'Tickets' },
    { href: '/dashboard/knowledge', icon: 'kb', label: 'Knowledge Base' },
    { href: '/dashboard/notifications', icon: 'bell', label: 'Notifications' },
  ],
  MANAGER: [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
    { href: '/dashboard/chats', icon: 'chat', label: 'Chat Monitor' },
    { href: '/dashboard/tickets', icon: 'ticket', label: 'All Tickets' },
    { href: '/dashboard/knowledge', icon: 'kb', label: 'Knowledge Base' },
    { href: '/dashboard/analytics', icon: 'bar-chart', label: 'Analytics' },
    { href: '/dashboard/users', icon: 'users', label: 'User Management' },
    { href: '/dashboard/settings', icon: 'settings', label: 'Settings' },
    { href: '/dashboard/notifications', icon: 'bell', label: 'Notifications' },
  ],
  ADMIN: [
    { href: '/dashboard', icon: 'dashboard', label: 'Dashboard', exact: true },
    { href: '/dashboard/chats', icon: 'chat', label: 'Chat Monitor' },
    { href: '/dashboard/tickets', icon: 'ticket', label: 'All Tickets' },
    { href: '/dashboard/knowledge', icon: 'kb', label: 'Knowledge Base' },
    { href: '/dashboard/analytics', icon: 'bar-chart', label: 'Analytics' },
    { href: '/dashboard/users', icon: 'users', label: 'User Management' },
    { href: '/dashboard/settings', icon: 'settings', label: 'Settings' },
    { href: '/dashboard/notifications', icon: 'bell', label: 'Notifications' },
  ],
}

export default function Sidebar({ unreadCount = 0, theme, onToggleTheme }: { unreadCount?: number; theme: string; onToggleTheme: () => void }) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null
  const items = NAV_ITEMS[user.role as keyof typeof NAV_ITEMS] || NAV_ITEMS.USER

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside style={{
      width: collapsed ? 64 : 'var(--sidebar-w)', minWidth: collapsed ? 64 : 'var(--sidebar-w)',
      height: '100vh', background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', transition: 'width .2s, min-width .2s',
      position: 'sticky', top: 0, zIndex: 50, overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, minHeight: 64 }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(59,130,246,0.35)' }}>
          <IC name="activity" size={18} color="#fff" />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>IMARAT IT Support</div>
            <div style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>Enterprise Portal</div>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} style={{ marginLeft: 'auto', color: 'var(--text3)', padding: 4, borderRadius: 4, flexShrink: 0, display: 'flex' }}>
          <IC name="menu" size={14} />
        </button>
      </div>

      {/* User info */}
      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <Avatar user={user} size={34} />
          <StatusDot status={user.status} style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--surface)' }} />
        </div>
        {!collapsed && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}><Badge label={user.role} /></div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto', overflowX: 'hidden' }}>
        {items.map(item => {
          const active = isActive(item.href, item.exact)
          return (
            <button key={item.href} onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '10px' : '9px 12px',
                borderRadius: 8, marginBottom: 2, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                background: active ? 'var(--accent-dim)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--text2)', border: 'none',
                transition: 'all .12s', justifyContent: collapsed ? 'center' : 'flex-start',
                boxShadow: active ? 'inset 0 0 0 1px rgba(59,130,246,0.2)' : 'none',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface2)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
              <IC name={item.icon} size={16} color={active ? 'var(--accent)' : 'currentColor'} />
              {!collapsed && (
                <>
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                  {item.icon === 'bell' && unreadCount > 0 && (
                    <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{unreadCount}</span>
                  )}
                </>
              )}
              {collapsed && item.icon === 'bell' && unreadCount > 0 && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: '1px solid var(--border)' }}>
        <button onClick={onToggleTheme} title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? 10 : '8px 12px', borderRadius: 8, fontSize: 13, color: 'var(--text2)', border: 'none', background: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', marginBottom: 2 }}>
          <IC name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
          {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
        </button>
        <button onClick={logout} title="Sign Out"
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? 10 : '8px 12px', borderRadius: 8, fontSize: 13, color: '#f87171', border: 'none', background: 'none', cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <IC name="logout" size={16} color="#f87171" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  )
}
