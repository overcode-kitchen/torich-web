import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력해주세요' }, { status: 400 })
  }

  try {
    // yahoo-finance2 인스턴스 생성 (v3 필수)
    const { default: YahooFinanceClass } = require('yahoo-finance2')
    const yahooFinance = new YahooFinanceClass({
      suppressNotices: ['ripHistorical', 'yahooSurvey'] // 경고 메시지 숨기기
    })
    
    // 종목 검색
    const searchResult = await yahooFinance.search(query, { newsCount: 0 }) as any
    
    if (!searchResult.quotes || !searchResult.quotes.length) {
      return NextResponse.json({ error: `"${query}"에 대한 검색 결과가 없습니다.` }, { status: 404 })
    }

    const firstQuote = searchResult.quotes[0]
    const symbol = firstQuote.symbol
    
    if (!symbol) {
       return NextResponse.json({ error: '검색 결과에 종목 코드가 없습니다.' }, { status: 404 })
    }

    // 10년치 월봉 데이터 조회 (chart API 사용)
    const endDate = new Date()
    const startDate = new Date()
    startDate.setFullYear(endDate.getFullYear() - 10)

    // chart() API를 사용 (historical()은 deprecated)
    const chartResult = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1mo' // 월봉
    }) as any

    const historicalData = chartResult.quotes

    if (!historicalData || historicalData.length < 2) {
      return NextResponse.json(
        { error: '충분한 히스토리 데이터가 없습니다.' },
        { status: 404 }
      )
    }

    // CAGR 계산 (연평균 수익률)
    // 기초 가격 (가장 오래된 데이터)
    const initialPrice = historicalData[0].close
    // 기말 가격 (가장 최근 데이터)
    const finalPrice = historicalData[historicalData.length - 1].close

    if (!initialPrice || !finalPrice) {
      throw new Error('가격 데이터가 유효하지 않습니다.')
    }

    // 실제 기간 (년 단위)
    const initialDate = new Date(historicalData[0].date)
    const finalDate = new Date(historicalData[historicalData.length - 1].date)
    const yearsElapsed = (finalDate.getTime() - initialDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    // CAGR 공식: (기말주가 / 기초주가)^(1 / 기간년수) - 1
    const cagr = Math.pow(finalPrice / initialPrice, 1 / yearsElapsed) - 1
    let averageRate = parseFloat((cagr * 100).toFixed(2))

    // 안전장치: 현실적인 수익률 보정
    const MAX_RATE_CAP = 20.0
    if (averageRate > MAX_RATE_CAP) {
      averageRate = MAX_RATE_CAP
    }

    // 현재 가격 조회
    const quote = await yahooFinance.quote(symbol) as any
    const currentPrice = quote.regularMarketPrice || finalPrice

    // 응답 포맷
    return NextResponse.json({
      symbol: symbol,
      name: firstQuote.longname || firstQuote.shortname || symbol,
      averageRate: averageRate,
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
