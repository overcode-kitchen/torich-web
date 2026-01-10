import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const market = searchParams.get('market') // KR 또는 US

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    // Supabase 클라이언트 초기화
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 쿼리 빌더 패턴으로 조건부 필터링
    let queryBuilder = supabase
      .from('stocks')
      .select('symbol, name, group')
      .or(`name.ilike.%${query}%,symbol.ilike.%${query}%`)

    // market 파라미터가 있으면 필터링 추가
    if (market) {
      queryBuilder = queryBuilder.eq('market', market)
    }

    // limit 적용 및 실행
    const { data: stocks, error: dbError } = await queryBuilder.limit(20)

    if (dbError) {
      console.error('Supabase 조회 오류:', dbError)
      return NextResponse.json({ error: 'DB 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // 결과 반환 (빈 배열도 정상 응답)
    return NextResponse.json({
      stocks: stocks || []
    })

  } catch (error) {
    console.error('검색 오류:', error)
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
