import { NextResponse } from 'next/server'
import { AuthHandler } from '@/lib/auth/auth-handler'

export async function GET(request: Request) {
  return AuthHandler.handleCallback(request)
}
