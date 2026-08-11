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

    // name / symbol 을 각각 별도 쿼리로 돌린다.
    // .or() 에 검색어를 보간하면 쉼표가 PostgREST 조건 구분자로 해석돼
    // "삼성,전자" 같은 입력이 400(PGRST100)으로 깨진다(#53).
    // .ilike(column, value) 는 값을 필터 문자열에 보간하지 않아 쉼표가 안전하다.
    const buildBase = () => {
      let qb = supabase.from('stocks').select('symbol, name, group')
      if (market) {
        qb = qb.eq('market', market)
      }
      return qb
    }

    const [byName, bySymbol] = await Promise.all([
      buildBase().ilike('name', `%${query}%`).limit(20),
      buildBase().ilike('symbol', `%${query}%`).limit(20),
    ])

    if (byName.error || bySymbol.error) {
      console.error('Supabase 조회 오류:', byName.error ?? bySymbol.error)
      return NextResponse.json({ error: 'DB 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // symbol 기준 중복 제거 후 병합. name 매치를 앞에 두고 상위 20건만 반환한다.
    const seen = new Set<string>()
    const stocks = [...(byName.data ?? []), ...(bySymbol.data ?? [])]
      .filter((stock) => {
        if (seen.has(stock.symbol)) return false
        seen.add(stock.symbol)
        return true
      })
      .slice(0, 20)

    // 결과 반환 (빈 배열도 정상 응답)
    return NextResponse.json({ stocks })

  } catch (error) {
    console.error('검색 오류:', error)
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
