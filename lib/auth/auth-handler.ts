import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export class AuthHandler {
  private static logAuthStep(step: string, data: any) {
    console.log(`${step}:`, data)
  }

  private static logAuthError(step: string, error: any) {
    console.error(`❌ ${step}:`, error)
  }

  static async handleCodeExchange(code: string): Promise<{ success: boolean; error?: any }> {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        this.logAuthError('Exchange Error', error)
        return { success: false, error }
      }
      
      return { success: true }
    } catch (error) {
      this.logAuthError('Unexpected Error', error)
      return { success: false, error }
    }
  }

  static async handleCallback(request: Request): Promise<NextResponse> {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next') ?? '/'
    const origin = requestUrl.origin

    this.logAuthStep('Login Callback Start', {
      Origin: origin,
      CodeExists: !!code
    })

    if (code) {
      const result = await this.handleCodeExchange(code)
      
      if (result.success) {
        this.logAuthStep('Login Success', `Redirecting to: ${origin}${next}`)
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      this.logAuthError('No Code provided in URL', null)
    }

    this.logAuthStep('Redirecting to Error Page', null)
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
  }
}
