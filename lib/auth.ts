// lib/auth.ts - Authentication utilities
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from './db'
import { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'imarat-secret-change-in-production'

export interface JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload
  } catch {
    return null
  }
}

export async function getAuthUser(req: NextRequest): Promise<JWTPayload | null> {
  const authHeader = req.headers.get('authorization')
  const cookieToken = req.cookies.get('auth_token')?.value
  
  const token = authHeader?.replace('Bearer ', '') || cookieToken
  if (!token) return null
  
  return verifyToken(token)
}

export async function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const user = await getAuthUser(req)
  if (!user) return { error: 'Unauthorized', status: 401 }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user }
}
