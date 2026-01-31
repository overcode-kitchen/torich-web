import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// [Helper] 날짜를 한국 시간(KST) 기준의 연월 값(year*12+month)으로 변환
function getKSTYearMonth(dateStr: string | Date): number {
  const date = new Date(dateStr)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return kstDate.getUTCFullYear() * 12 + kstDate.getUTCMonth()
}

// [Helper] 날짜를 KST 기준 년/월 문자열로 변환 (로그용)
function getKSTDateString(dateStr: string | Date): string {
  const date = new Date(dateStr)
  const kstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  return `${kstDate.getUTCFullYear()}년 ${kstDate.getUTCMonth() + 1}월`
}

// CAGR 계산 함수 (지난달 말일 기준, 정확히 10년)
async function calculateCAGR(symbol: string): Promise<number | null> {
  try {
    const { default: YahooFinanceClass } = require('yahoo-finance2')
    const yahooFinance = new YahooFinanceClass({
      suppressNotices: ['ripHistorical', 'yahooSurvey']
    })

    // 1. 기준일 설정: 지난달 마지막 날
    const today = new Date()
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // 2. 조회 기간: 정확히 10년 (120개월)
    const endYear = lastMonthEnd.getFullYear()
    const endMonth = lastMonthEnd.getMonth()
    
    // API 요청용 날짜 - 15일 전략 (어떤 타임존에서도 월이 바뀌지 않음)
    const startDate = new Date(Date.UTC(endYear - 10, endMonth, 15))
    const endDate = new Date(Date.UTC(endYear, endMonth + 1, 15))

    // Yahoo Finance API 호출
    const chartResult = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1mo'
    }) as any

    const historicalData = chartResult.quotes

    if (!historicalData || historicalData.length < 2) {
      return null
    }

    // 3. 안전장치: 범위를 벗어난 데이터 제거 (KST 기준으로 통일)
    const todayKST = new Date(today.getTime() + 9 * 60 * 60 * 1000)
    const currentYearMonth = todayKST.getUTCFullYear() * 12 + todayKST.getUTCMonth()
    const targetStartYearMonth = (endYear - 10) * 12 + (endMonth + 1)
    
    // 시작 데이터가 목표 시작월보다 이전이면 제거 (KST 기준)
    while (historicalData.length > 0) {
      const firstData = historicalData[0]
      const firstYearMonth = getKSTYearMonth(firstData.date)
      
      if (firstYearMonth < targetStartYearMonth) {
        historicalData.shift()
      } else {
        break
      }
    }
    
    // 마지막 데이터가 현재 월 이상이면 제거 (KST 기준)
    let lastData = historicalData[historicalData.length - 1]
    let lastDataYearMonth = getKSTYearMonth(lastData.date)
    
    if (lastDataYearMonth >= currentYearMonth) {
      historicalData.pop()
      lastData = historicalData[historicalData.length - 1]
    }

    if (historicalData.length < 2) {
      return null
    }

    // CAGR 계산 - 단순 종가(close) 사용
    const firstData = historicalData[0]
    const initialPrice = firstData.close
    const finalPrice = lastData.close

    if (!initialPrice || !finalPrice) {
      return null
    }

    const firstDate = new Date(firstData.date)
    const lastDataDate = new Date(lastData.date)
    const yearsElapsed = (lastDataDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

    const cagr = Math.pow(finalPrice / initialPrice, 1 / yearsElapsed) - 1
    let averageRate = parseFloat((cagr * 100).toFixed(2))

    // 안전장치: 최대 20%로 제한
    const MAX_RATE_CAP = 20.0
    if (averageRate > MAX_RATE_CAP) {
      averageRate = MAX_RATE_CAP
    }

    return averageRate
  } catch (error) {
    console.error(`[Update Rates] ${symbol} CAGR 계산 실패:`, error)
    return null
  }
}

// 기납입액 기준 월복리 최종금액 계산
function calculateFinalAmount(monthlyAmount: number, periodYears: number, annualRate: number): number {
  const monthlyRate = annualRate / 100 / 12
  const totalMonths = periodYears * 12
  const finalAmount = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  return Math.round(finalAmount)
}

// Supabase에서 종목 심볼 조회 (title로 검색)
async function getSymbolFromTitle(supabase: any, title: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('stocks')
    .select('symbol')
    .eq('name', title)
    .single()

  if (error || !data) {
    return null
  }

  return data.symbol
}

// 지난달 말일 계산 (KST 기준) - ISO 형식 문자열로 반환
function getLastMonthEndISO(): string {
  const now = new Date()
  const kstNow = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  const lastMonthEnd = new Date(Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), 0))
  return lastMonthEnd.toISOString()
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const lastMonthEndISO = getLastMonthEndISO()

    // 1. 갱신이 필요한 레코드만 조회 (레코드 레벨에서 체크)
    // - is_custom_rate가 false이고
    // - rate_updated_at이 null이거나, rate_updated_at < 지난달 말일
    const { data: records, error: fetchError } = await supabase
      .from('records')
      .select('id, title, symbol, monthly_amount, period_years')
      .eq('user_id', userId)
      .eq('is_custom_rate', false)
      .or(`rate_updated_at.is.null,rate_updated_at.lt.${lastMonthEndISO}`)

    if (fetchError) {
      throw new Error(`레코드 조회 실패: ${fetchError.message}`)
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        updated: false,
        message: '이미 최신 상태입니다.',
        updatedRecords: 0,
        duration: `${Date.now() - startTime}ms`
      })
    }

    console.log(`[Update Rates] 사용자 ${userId} | 갱신 필요 레코드: ${records.length}개`)

    // 4. 종목별로 중복 제거 (symbol 우선, 없으면 title 기준)
    const stockMap = new Map<string, { title: string; symbol: string | null; recordIds: string[] }>()
    for (const record of records) {
      const key = record.symbol || record.title
      if (stockMap.has(key)) {
        stockMap.get(key)!.recordIds.push(record.id)
      } else {
        stockMap.set(key, {
          title: record.title,
          symbol: record.symbol,
          recordIds: [record.id]
        })
      }
    }
    const uniqueStocks = Array.from(stockMap.values())

    console.log(`[Update Rates] 사용자 ${userId} | 업데이트 대상: ${uniqueStocks.length}개 종목, ${records.length}개 레코드`)

    // 5. 각 종목별로 CAGR 계산 및 업데이트
    let updatedCount = 0
    const updateResults: { title: string; newRate: number | null }[] = []

    for (const stock of uniqueStocks) {
      // 심볼 획득 (저장된 symbol 우선, 없으면 title로 검색)
      let symbol = stock.symbol
      if (!symbol) {
        symbol = await getSymbolFromTitle(supabase, stock.title)
      }

      if (!symbol) {
        console.log(`[Update Rates] ${stock.title} | 심볼 조회 실패, 건너뜀`)
        updateResults.push({ title: stock.title, newRate: null })
        continue
      }

      // CAGR 계산
      const newRate = await calculateCAGR(symbol)
      updateResults.push({ title: stock.title, newRate })

      if (newRate === null) {
        console.log(`[Update Rates] ${stock.title} (${symbol}) | CAGR 계산 실패`)
        continue
      }

      console.log(`[Update Rates] ${stock.title} (${symbol}) | 새 수익률: ${newRate}%`)

      // 해당 종목의 모든 레코드 업데이트
      for (const recordId of stock.recordIds) {
        const record = records.find(r => r.id === recordId)
        if (!record) continue

        const newFinalAmount = calculateFinalAmount(
          record.monthly_amount,
          record.period_years,
          newRate
        )

        const { error: updateError } = await supabase
          .from('records')
          .update({
            annual_rate: newRate,
            final_amount: newFinalAmount,
            rate_updated_at: new Date().toISOString() // 레코드별 갱신일 업데이트
          })
          .eq('id', recordId)

        if (!updateError) {
          updatedCount++
        }
      }
    }

    const duration = Date.now() - startTime
    console.log(`[Update Rates] 사용자 ${userId} | 완료: ${updatedCount}개 레코드 업데이트 (${duration}ms)`)

    return NextResponse.json({
      success: true,
      updated: true,
      message: '수익률이 업데이트되었습니다.',
      updatedStocks: uniqueStocks.length,
      updatedRecords: updatedCount,
      results: updateResults,
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('[Update Rates] 오류:', error)
    return NextResponse.json(
      { error: '수익률 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

// 갱신 필요 여부만 체크하는 GET 엔드포인트 (레코드 기반)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 })
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const lastMonthEndISO = getLastMonthEndISO()

    // 갱신이 필요한 레코드가 있는지 확인
    const { data: needsUpdateRecords, count, error } = await supabase
      .from('records')
      .select('id, title, is_custom_rate, rate_updated_at', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_custom_rate', false)
      .or(`rate_updated_at.is.null,rate_updated_at.lt.${lastMonthEndISO}`)

    console.log(`[Update Rates Check] 갱신 필요 레코드:`, needsUpdateRecords)

    if (error) {
      console.error(`[Update Rates Check] 쿼리 오류:`, error)
      throw error
    }

    const needsUpdate = (count || 0) > 0

    return NextResponse.json({
      needsUpdate,
      recordsToUpdate: count || 0,
      lastMonthEnd: lastMonthEndISO
    })

  } catch (error) {
    console.error('[Update Rates Check] 오류:', error)
    return NextResponse.json(
      { error: '갱신 여부 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
