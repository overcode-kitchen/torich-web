import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const origin = requestUrl.origin

  // 1. 디버깅 로그: 코드가 잘 들어왔는지 확인
  console.log('Login Callback Start -----------------')
  console.log('Origin:', origin)
  console.log('Code Exists:', !!code)

  if (code) {
    const supabase = await createClient()
    
    // 2. 코드 교환 시도
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      console.log('✅ Login Success! Redirecting to:', `${origin}${next}`)
      return NextResponse.redirect(`${origin}${next}`)
    } else {
      // 3. 에러 발생 시 구체적인 내용 출력
      console.error('❌ Exchange Error:', error)
    }
  } else {
    console.error('❌ No Code provided in URL')
  }

  // 실패 시 에러 페이지로 이동
  console.log('Redirecting to Error Page...')
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
