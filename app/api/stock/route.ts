import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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
    const { default: YahooFinanceClass } = require('yahoo-finance2')
    const yahooFinance = new YahooFinanceClass({
      suppressNotices: ['ripHistorical', 'yahooSurvey'] // 경고 메시지 숨기기
    })

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

    // 응답 포맷 (Supabase에서 조회한 name 사용)
    return NextResponse.json({
      symbol: symbol,
      name: stockName,
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
