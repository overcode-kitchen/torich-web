import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// 구버전 앱 호환용 기본 연 수익률.
// 예상 수익률(CAGR)은 제품에서 제거됐지만(a3c6acc), 출시된 앱의 useStockRate는
// 응답에 averageRate(number)가 없으면 currentPrice까지 버린다. 그래서 필드는 남기되
// 10년 시세 조회 없이 앱 내부 기본값과 같은 값을 돌려준다.
const LEGACY_DEFAULT_ANNUAL_RATE = 10

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')

  if (!symbol) {
    return NextResponse.json({ error: '종목 코드를 입력해주세요' }, { status: 400 })
  }

  try {
    // Supabase 클라이언트 초기화 (종목명 조회용)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Supabase에서 종목명 조회
    const { data: stockData, error: dbError } = await supabase
      .from('stocks')
      .select('name')
      .eq('symbol', symbol)
      .single()

    if (dbError || !stockData) {
      console.error('Supabase 조회 오류:', dbError)
      // 종목명을 못 찾아도 계속 진행 (symbol을 name으로 사용)
    }

    const stockName = stockData?.name || symbol

    // yahoo-finance2 인스턴스 생성 (v3 필수)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { default: YahooFinanceClass } = require('yahoo-finance2')
    const yahooFinance = new YahooFinanceClass({
      suppressNotices: ['ripHistorical', 'yahooSurvey']
    })

    // 이 라우트의 유일한 실사용 값은 현재가다(주수 환산·납입 시세 캡처).
    // 예전에는 10년 월봉을 먼저 받아 CAGR을 계산했는데, 상장 10년이 안 된 종목이면
    // 아무도 쓰지 않는 CAGR 때문에 404로 끊겨 현재가까지 못 받았다. 그래서 quote만 부른다.
    const quote = await yahooFinance.quote(symbol) as { regularMarketPrice?: number }
    const currentPrice = quote?.regularMarketPrice

    if (typeof currentPrice !== 'number' || !Number.isFinite(currentPrice)) {
      console.error(`[Stock API] ${symbol} | 현재가 조회 실패`)
      return NextResponse.json(
        { error: '주식 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      symbol: symbol,
      name: stockName,
      averageRate: LEGACY_DEFAULT_ANNUAL_RATE,
      currentPrice: parseFloat(currentPrice.toFixed(2))
    })

  } catch (error) {
    console.error('주식 정보 조회 오류:', error)
    return NextResponse.json(
      { error: '주식 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
