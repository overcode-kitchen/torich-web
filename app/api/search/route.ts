import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/** 사용자에게 돌려주는 최종 건수 */
const RESULT_LIMIT = 20
/** DB에서 받아오는 후보 건수. 정렬 전에 잘리면 대표 종목이 후보에서 빠진다 */
const FETCH_LIMIT = 100

/**
 * 관련도 등급 (낮을수록 위).
 *
 * '삼성'·'KB'·'TIGER'처럼 접두어를 공유하는 종목이 많은 키워드가 한국 시장엔 흔해서,
 * 부분 일치만으로는 대표 종목이 뒤로 밀린다. `ilike`가 대소문자를 구분하지 않으므로
 * 등급 판정도 소문자 기준으로 맞춘다(`tiger` → `TIGER` 접두 일치).
 */
function relevanceRank(name: string, symbol: string, query: string): number {
  const n = name.toLowerCase()
  const s = symbol.toLowerCase()

  if (n === query || s === query) return 1
  if (n.startsWith(query)) return 2
  if (s.startsWith(query)) return 3
  if (n.includes(query)) return 4
  return 5
}

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
      buildBase().ilike('name', `%${query}%`).limit(FETCH_LIMIT),
      buildBase().ilike('symbol', `%${query}%`).limit(FETCH_LIMIT),
    ])

    if (byName.error || bySymbol.error) {
      console.error('Supabase 조회 오류:', byName.error ?? bySymbol.error)
      return NextResponse.json({ error: 'DB 조회 중 오류가 발생했습니다.' }, { status: 500 })
    }

    // symbol 기준 중복 제거 후 병합한다.
    const seen = new Set<string>()
    const merged = [...(byName.data ?? []), ...(bySymbol.data ?? [])].filter((stock) => {
      if (seen.has(stock.symbol)) return false
      seen.add(stock.symbol)
      return true
    })

    // 자르기는 반드시 정렬 '뒤'에 온다. 먼저 자르면 대표 종목이 후보에서 빠진 채로 정렬된다.
    const normalizedQuery = query.toLowerCase()
    const stocks = merged
      .map((stock) => ({ stock, rank: relevanceRank(stock.name, stock.symbol, normalizedQuery) }))
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank
        // 같은 등급이면 이름이 짧을수록 대표 종목일 확률이 높다 (삼성전자 < 삼성전자우).
        if (a.stock.name.length !== b.stock.name.length) {
          return a.stock.name.length - b.stock.name.length
        }
        // 마지막 동률은 사전순으로 고정해 같은 검색어의 순서가 매번 재현되게 한다.
        return a.stock.name.localeCompare(b.stock.name, 'ko')
      })
      .slice(0, RESULT_LIMIT)
      .map(({ stock }) => stock)

    // 결과 반환 (빈 배열도 정상 응답).
    // hasMore는 추가 필드라 구버전 앱은 무시한다 — 응답 형식 호환을 깨지 않는다.
    return NextResponse.json({ stocks, hasMore: merged.length > RESULT_LIMIT })

  } catch (error) {
    console.error('검색 오류:', error)
    return NextResponse.json(
      { error: '검색 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
