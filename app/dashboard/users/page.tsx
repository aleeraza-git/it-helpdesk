'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useAPI } from '@/hooks/useAPI'
import { User } from '@/types'
import { Avatar, Badge, StatusDot, Btn, IC, Input, Select, Modal, Empty, formatTime, Spinner, Tip } from '@/components/ui'

export default function UsersPage() {
  const { user: me } = useAuth()
  const { get, post, patch, del } = useAPI()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'USER', department: '', skills: '', maxChats: 5 })
  const [editForm, setEditForm] = useState({ name: '', role: 'USER', department: '', skills: '', maxChats: 5, isActive: true })

  const fetchUsers = useCallback(async () => {
    try {
      const params = roleFilter !== 'all' ? `?role=${roleFilter}` : ''
      const data = await get(`/users${params}`)
      setUsers(data.users || [])
    } catch {} finally { setLoading(false) }
  }, [roleFilter])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const createUser = async () => {
    setSaving(true)
    try {
      const data = await post('/users', { ...newUser, skills: newUser.skills.split(',').map((s: string) => s.trim()).filter(Boolean) })
      setUsers(prev => [data.user, ...prev])
      setShowNew(false)
      setNewUser({ name: '', email: '', password: '', role: 'USER', department: '', skills: '', maxChats: 5 })
    } catch (err: any) { alert(err.message) } finally { setSaving(false) }
  }

  const updateUser = async () => {
    if (!editUser) return
    setSaving(true)
    try {
      const data = await patch(`/users/${editUser.id}`, { ...editForm, skills: typeof editForm.skills === 'string' ? editForm.skills.split(',').map((s: string) => s.trim()).filter(Boolean) : editForm.skills })
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...data.user } : u))
      setEditUser(null)
    } catch (err: any) { alert(err.message) } finally { setSaving(false) }
  }

  const deactivateUser = async (userId: string) => {
    if (!confirm('Deactivate this user? They will no longer be able to log in.')) return
    await del(`/users/${userId}`)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: false } : u))
  }

  const openEdit = (u: User) => {
    setEditForm({ name: u.name, role: u.role, department: u.department || '', skills: u.skills.join(', '), maxChats: u.maxChats, isActive: u.isActive !== false })
    setEditUser(u)
  }

  const filtered = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const roleCounts = { ALL: users.length, USER: users.filter(u => u.role === 'USER').length, AGENT: users.filter(u => u.role === 'AGENT').length, MANAGER: users.filter(u => u.role === 'MANAGER' || u.role === 'ADMIN').length }

  return (
    <div style={{ padding: 28 }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <div style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><IC name="search" size={14} color="var(--text3)" /></div>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search users by name or email..."
            style={{ width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px 9px 34px', color: 'var(--text)', fontSize: 13 }} />
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {[['all', `All (${roleCounts.ALL})`], ['USER', `Users (${roleCounts.USER})`], ['AGENT', `Agents (${roleCounts.AGENT})`], ['MANAGER', `Managers (${roleCounts.MANAGER})`]].map(([v, l]) => (
            <button key={v} onClick={() => setRoleFilter(v)}
              style={{ padding: '7px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500, cursor: 'pointer', background: roleFilter === v ? 'var(--accent)' : 'var(--surface)', color: roleFilter === v ? '#fff' : 'var(--text2)', border: `1px solid ${roleFilter === v ? 'var(--accent)' : 'var(--border)'}` }}>
              {l}
            </button>
          ))}
        </div>
        <Btn variant="primary" onClick={() => setShowNew(true)}><IC name="plus" size={14} color="#fff" />Add User</Btn>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 50 }}><Spinner size={32} /></div>
      ) : filtered.length === 0 ? (
        <Empty icon="users" title="No users found" subtitle="Try adjusting your search or filters" />
      ) : (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['User', 'Email', 'Role', 'Department', 'Skills', 'Status', 'Last Active', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '11px 16px', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textAlign: 'left', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isActive === false ? 0.5 : 1 }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ position: 'relative' }}>
                        <Avatar user={u} size={34} />
                        <StatusDot status={u.status} style={{ position: 'absolute', bottom: 0, right: 0, border: '2px solid var(--surface)' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.name}</div>
                        {u.id === me?.id && <div style={{ fontSize: 10, color: 'var(--accent)' }}>You</div>}
                        {u.isActive === false && <div style={{ fontSize: 10, color: '#f87171' }}>Deactivated</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{u.email}</td>
                  <td style={{ padding: '12px 16px' }}><Badge label={u.role} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text2)' }}>{u.department || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {u.skills.slice(0, 2).map(s => <span key={s} style={{ fontSize: 10, background: 'var(--surface2)', color: 'var(--text3)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border)' }}>{s}</span>)}
                      {u.skills.length > 2 && <span style={{ fontSize: 10, color: 'var(--text3)' }}>+{u.skills.length - 2}</span>}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px' }}><Badge label={u.status} /></td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--text3)' }}>{u.lastSeen ? formatTime(u.lastSeen) : '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Tip text="Edit User"><Btn size="sm" variant="ghost" onClick={() => openEdit(u)} style={{ padding: 6 }}><IC name="edit" size={13} /></Btn></Tip>
                      {u.id !== me?.id && u.isActive !== false && (
                        <Tip text="Deactivate User"><Btn size="sm" variant="danger" onClick={() => deactivateUser(u.id)} style={{ padding: 6 }}><IC name="trash" size={13} /></Btn></Tip>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New user modal */}
      {showNew && (
        <Modal title="Add New User" onClose={() => setShowNew(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Full Name" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} placeholder="John Smith" />
              <Input label="Email Address" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} placeholder="john@imarat.com" type="email" />
              <Input label="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} type="password" placeholder="Min 8 characters" />
              <Select label="Role" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                <option value="USER">User</option>
                <option value="AGENT">Agent</option>
                <option value="MANAGER">Manager</option>
              </Select>
              <Input label="Department" value={newUser.department} onChange={e => setNewUser({ ...newUser, department: e.target.value })} placeholder="IT, Finance, HR..." />
              <Input label="Skills (comma separated)" value={newUser.skills} onChange={e => setNewUser({ ...newUser, skills: e.target.value })} placeholder="vpn, network, hardware" />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setShowNew(false)}>Cancel</Btn>
              <Btn variant="primary" loading={saving} onClick={createUser} disabled={!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()}>Create User</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit user modal */}
      {editUser && (
        <Modal title={`Edit User: ${editUser.name}`} onClose={() => setEditUser(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input label="Full Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              <Select label="Role" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="USER">User</option>
                <option value="AGENT">Agent</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <Input label="Department" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} />
              <Input label="Max Concurrent Chats" value={editForm.maxChats} onChange={e => setEditForm({ ...editForm, maxChats: parseInt(e.target.value) || 5 })} type="number" min={1} max={20} />
              <Input label="Skills (comma separated)" value={typeof editForm.skills === 'string' ? editForm.skills : (editForm.skills as string[]).join(', ')} onChange={e => setEditForm({ ...editForm, skills: e.target.value })} />
              <Select label="Status" value={editUser.status} onChange={e => { setEditUser({ ...editUser, status: e.target.value as any }) }}>
                {['ONLINE', 'BUSY', 'AWAY', 'OFFLINE'].map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <Btn variant="ghost" onClick={() => setEditUser(null)}>Cancel</Btn>
              <Btn variant="primary" loading={saving} onClick={updateUser}>Save Changes</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}



