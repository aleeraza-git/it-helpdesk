'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Header from '@/components/layout/Header'
import { useAPI } from '@/hooks/useAPI'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/chats': 'Chats',
  '/dashboard/tickets': 'Tickets',
  '/dashboard/knowledge': 'Knowledge Base',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/users': 'User Management',
  '/dashboard/settings': 'Settings',
  '/dashboard/notifications': 'Notifications',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { get } = useAPI()
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [unreadCount, setUnreadCount] = useState(0)
  const [pathname, setPathname] = useState('/dashboard')

  useEffect(() => {
    if (typeof window !== 'undefined') setPathname(window.location.pathname)
  }, [])

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [user, loading, router])

  useEffect(() => {
    document.documentElement.className = theme === 'light' ? 'light' : ''
  }, [theme])

  useEffect(() => {
    if (user) {
      get('/notifications').then(d => {
        setUnreadCount((d.notifications || []).filter((n: any) => !n.isRead).length)
      }).catch(() => {})
    }
  }, [user])

  if (loading || !user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      </div>
    )
  }

  const title = PAGE_TITLES[pathname] || 'IMARAT IT Support'

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>
      <Sidebar unreadCount={unreadCount} theme={theme} onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header title={title} />
        <main style={{ flex: 1, overflow: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
