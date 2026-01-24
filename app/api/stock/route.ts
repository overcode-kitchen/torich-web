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

    // ========================================
    // [데이터 갱신 정책] 지난달 말일 기준 CAGR 계산
    // ========================================
    
    // 1. 기준일 설정: 지난달 마지막 날 (lastMonthEnd)
    // new Date(year, month, 0)은 해당 월의 0일 = 전월 말일
    const today = new Date()
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    // 시간을 23:59:59로 설정하여 해당 날짜의 마감 시점으로 설정
    lastMonthEnd.setHours(23, 59, 59, 999)
    
    // 2. 조회 기간 설정: lastMonthEnd 기준 10년 전 ~ lastMonthEnd
    const endDate = lastMonthEnd
    const startDate = new Date(lastMonthEnd)
    startDate.setFullYear(startDate.getFullYear() - 10)
    startDate.setHours(0, 0, 0, 0)

    // 디버그: 조회 기간 로그
    console.log(`[Stock API] ${symbol} | 조회 기간: ${startDate.toISOString().split('T')[0]} ~ ${endDate.toISOString().split('T')[0]} (지난달 말일 기준)`)

    // chart() API를 사용 (historical()은 deprecated)
    const chartResult = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1mo' // 월봉
    }) as any

    let historicalData = chartResult.quotes

    if (!historicalData || historicalData.length < 2) {
      return NextResponse.json(
        { error: '충분한 히스토리 데이터가 없습니다.' },
        { status: 404 }
      )
    }

    // 3. 데이터 필터링 (Pop Logic): 지난달 말일 이후 데이터 제거
    // 마지막 데이터가 lastMonthEnd보다 이후(이번 달 진행 중 데이터)라면 제거
    const lastDataDate = new Date(historicalData[historicalData.length - 1].date)
    
    // 월 단위 비교: lastDataDate의 연월이 lastMonthEnd 연월보다 이후인지 확인
    const lastDataYearMonth = lastDataDate.getFullYear() * 12 + lastDataDate.getMonth()
    const lastMonthEndYearMonth = lastMonthEnd.getFullYear() * 12 + lastMonthEnd.getMonth()
    
    if (lastDataYearMonth > lastMonthEndYearMonth) {
      console.log(`[Stock API] ${symbol} | 이번 달 데이터 제거: ${lastDataDate.toISOString().split('T')[0]}`)
      historicalData = historicalData.slice(0, -1) // 마지막 요소 제거
    }

    if (historicalData.length < 2) {
      return NextResponse.json(
        { error: '충분한 히스토리 데이터가 없습니다.' },
        { status: 404 }
      )
    }

    // 4. CAGR 계산 (연평균 수익률)
    const initialPrice = historicalData[0].close
    const finalPrice = historicalData[historicalData.length - 1].close

    if (!initialPrice || !finalPrice) {
      throw new Error('가격 데이터가 유효하지 않습니다.')
    }

    // 실제 기간 (년 단위) - 필터링된 데이터 기준으로 정밀 계산
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

    // 디버그 로그: CAGR 계산 핵심 정보
    console.log(`[Stock API] ${symbol} | 실제 데이터 기간: ${initialDate.toISOString().split('T')[0]} ~ ${finalDate.toISOString().split('T')[0]} (${yearsElapsed.toFixed(1)}년)`)
    console.log(`[Stock API] ${symbol} | 가격: ${initialPrice.toFixed(2)} → ${finalPrice.toFixed(2)} | CAGR: ${averageRate}%`)

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
