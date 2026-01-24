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
    const today = new Date()
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // 2. 조회 기간 설정: 정확히 10년 (120개월)
    // 예: 지난달이 2025년 12월이면 → 2016년 1월 ~ 2025년 12월
    const endYear = lastMonthEnd.getFullYear()
    const endMonth = lastMonthEnd.getMonth() // 0-indexed (12월 = 11)
    
    // 시작: 10년 전 다음 달 1일 (예: 2016년 1월 1일)
    const startDate = new Date(endYear - 10, endMonth + 1, 1)
    // 종료: 지난달 말일 다음날 (API가 해당 날짜 이전까지 조회하므로)
    const endDate = new Date(endYear, endMonth + 1, 1)

    // 디버그: 조회 기간 로그
    const expectedStartMonth = `${startDate.getFullYear()}년 ${startDate.getMonth() + 1}월`
    const expectedEndMonth = `${lastMonthEnd.getFullYear()}년 ${lastMonthEnd.getMonth() + 1}월`
    console.log(`[Stock API] ${symbol} | 목표 기간: ${expectedStartMonth} ~ ${expectedEndMonth} (10년 = 120개월)`)

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

    // 3. 안전장치: 범위를 벗어난 데이터 제거
    const currentYearMonth = today.getFullYear() * 12 + today.getMonth()
    // 목표 시작월: 10년 전 다음 달 (예: 2025년 12월 기준 → 2016년 1월)
    const targetStartYearMonth = (endYear - 10) * 12 + (endMonth + 1)
    
    // 3-1. 시작 데이터가 목표 시작월보다 이전이면 제거 (앞에서부터)
    while (historicalData.length > 0) {
      const firstData = historicalData[0]
      const firstDate = new Date(firstData.date)
      const firstYearMonth = firstDate.getFullYear() * 12 + firstDate.getMonth()
      
      if (firstYearMonth < targetStartYearMonth) {
        console.log(`[Stock API] ${symbol} | [Safety] 목표 시작월 이전 데이터 제거: ${firstDate.getFullYear()}/${firstDate.getMonth() + 1}`)
        historicalData.shift()
      } else {
        break
      }
    }
    
    // 3-2. 마지막 데이터가 현재 월 이상이면 제거 (뒤에서부터)
    let lastData = historicalData[historicalData.length - 1]
    let lastDataDate = new Date(lastData.date)
    let lastDataYearMonth = lastDataDate.getFullYear() * 12 + lastDataDate.getMonth()
    
    if (lastDataYearMonth >= currentYearMonth) {
      console.log(`[Stock API] ${symbol} | [Safety] 이번 달 이상의 데이터 제거: ${lastDataDate.getFullYear()}/${lastDataDate.getMonth() + 1}`)
      historicalData.pop()
      
      // pop 후 다시 마지막 데이터 갱신
      lastData = historicalData[historicalData.length - 1]
      lastDataDate = new Date(lastData.date)
      lastDataYearMonth = lastDataDate.getFullYear() * 12 + lastDataDate.getMonth()
    }

    if (historicalData.length < 2) {
      return NextResponse.json(
        { error: '충분한 히스토리 데이터가 없습니다.' },
        { status: 404 }
      )
    }

    // 4. 데이터 검증 로그
    const firstData = historicalData[0]
    const firstDate = new Date(firstData.date)

    const actualMonths = historicalData.length
    console.log(`[Stock API] ${symbol} | 실제 데이터: ${actualMonths}개월 (${firstDate.getFullYear()}/${firstDate.getMonth() + 1} ~ ${lastDataDate.getFullYear()}/${lastDataDate.getMonth() + 1})`)

    // 5. CAGR 계산 (연평균 수익률)
    const initialPrice = firstData.close
    const finalPrice = lastData.close

    if (!initialPrice || !finalPrice) {
      throw new Error('가격 데이터가 유효하지 않습니다.')
    }

    // 실제 기간 (년 단위) - 반환된 데이터 기준으로 정밀 계산
    const yearsElapsed = (lastDataDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

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
    console.log(`[Stock API] ${symbol} | 계산: ${initialPrice.toFixed(0)}원 → ${finalPrice.toFixed(0)}원 (${yearsElapsed.toFixed(2)}년) | CAGR: ${averageRate}%`)

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
