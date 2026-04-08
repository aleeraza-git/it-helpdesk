import { useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function useAPI() {
  const { token } = useAuth()

  const request = useCallback(async (path: string, options: RequestInit = {}) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    }
    const res = await fetch(`/api${path}`, { ...options, headers })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Request failed')
    return data
  }, [token])

  const get = useCallback((path: string) => request(path), [request])
  const post = useCallback((path: string, body: any) => request(path, { method: 'POST', body: JSON.stringify(body) }), [request])
  const patch = useCallback((path: string, body: any) => request(path, { method: 'PATCH', body: JSON.stringify(body) }), [request])
  const del = useCallback((path: string) => request(path, { method: 'DELETE' }), [request])

  return { get, post, patch, del, request }
}
