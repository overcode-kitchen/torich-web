import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// CAGR 계산 함수 (지난달 말일 기준, 정확히 10년)
async function calculateCAGR(symbol: string): Promise<number | null> {
  try {
    const { default: YahooFinanceClass } = require('yahoo-finance2')
    const yahooFinance = new YahooFinanceClass({
      suppressNotices: ['ripHistorical', 'yahooSurvey']
    })

    // 지난달 말일 기준 설정
    const today = new Date()
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // 조회 기간: 정확히 10년 (120개월)
    const endYear = lastMonthEnd.getFullYear()
    const endMonth = lastMonthEnd.getMonth()
    
    // 시작: 10년 전 다음 달 1일
    const startDate = new Date(endYear - 10, endMonth + 1, 1)
    // 종료: 지난달 말일 다음날
    const endDate = new Date(endYear, endMonth + 1, 1)

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

    // 안전장치: 범위를 벗어난 데이터 제거
    const currentYearMonth = today.getFullYear() * 12 + today.getMonth()
    const targetStartYearMonth = (endYear - 10) * 12 + (endMonth + 1)
    
    // 시작 데이터가 목표 시작월보다 이전이면 제거
    while (historicalData.length > 0) {
      const firstData = historicalData[0]
      const firstDate = new Date(firstData.date)
      const firstYearMonth = firstDate.getFullYear() * 12 + firstDate.getMonth()
      
      if (firstYearMonth < targetStartYearMonth) {
        historicalData.shift()
      } else {
        break
      }
    }
    
    // 마지막 데이터가 현재 월 이상이면 제거
    let lastData = historicalData[historicalData.length - 1]
    let lastDataDate = new Date(lastData.date)
    let lastDataYearMonth = lastDataDate.getFullYear() * 12 + lastDataDate.getMonth()
    
    if (lastDataYearMonth >= currentYearMonth) {
      historicalData.pop()
      lastData = historicalData[historicalData.length - 1]
      lastDataDate = new Date(lastData.date)
      lastDataYearMonth = lastDataDate.getFullYear() * 12 + lastDataDate.getMonth()
    }

    if (historicalData.length < 2) {
      return null
    }

    // CAGR 계산
    const firstData = historicalData[0]
    const initialPrice = firstData.close
    const finalPrice = lastData.close

    if (!initialPrice || !finalPrice) {
      return null
    }

    const firstDate = new Date(firstData.date)
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
    console.error(`[CRON] ${symbol} CAGR 계산 실패:`, error)
    return null
  }
}

// 만기 금액 재계산 함수
function calculateFinalAmount(monthlyAmount: number, periodYears: number, annualRate: number): number {
  const R = annualRate / 100
  const monthlyRate = R / 12
  const totalMonths = periodYears * 12
  // 기납입액 기준 월복리 계산
  const finalAmount = monthlyAmount * ((Math.pow(1 + monthlyRate, totalMonths) - 1) / monthlyRate) * (1 + monthlyRate)
  return Math.round(finalAmount)
}

// 종목명 -> Yahoo Finance 심볼 매핑 (Supabase stocks 테이블 활용)
async function getSymbolFromTitle(supabase: any, title: string): Promise<string | null> {
  // stocks 테이블에서 name으로 symbol 조회
  const { data, error } = await supabase
    .from('stocks')
    .select('symbol')
    .eq('name', title)
    .single()

  if (error || !data) {
    console.warn(`[CRON] 종목 심볼 조회 실패: ${title}`)
    return null
  }

  return data.symbol
}

export async function GET(request: Request) {
  const startTime = Date.now()
  
  // Cron 보안 검증 (Vercel Cron Secret)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // 개발 환경에서는 허용
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. is_custom_rate가 false인 레코드 조회 (symbol 포함)
    const { data: records, error: fetchError } = await supabase
      .from('records')
      .select('id, title, symbol, monthly_amount, period_years')
      .eq('is_custom_rate', false)

    if (fetchError) {
      throw new Error(`레코드 조회 실패: ${fetchError.message}`)
    }

    if (!records || records.length === 0) {
      return NextResponse.json({
        success: true,
        message: '업데이트할 레코드가 없습니다.',
        updatedStocks: 0,
        updatedRecords: 0,
        duration: `${Date.now() - startTime}ms`
      })
    }

    // 2. 종목 중복 제거 (symbol 우선, 없으면 title 기준)
    // Map으로 관리: key = symbol || title, value = { title, symbol, recordIds }
    const stockMap = new Map<string, { title: string; symbol: string | null; recordIds: string[] }>()
    
    for (const record of records) {
      // symbol이 있으면 symbol을 키로, 없으면 title을 키로 사용
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
    console.log(`[CRON] 업데이트 대상 종목: ${uniqueStocks.length}개`)

    // 3. 각 종목별로 CAGR 계산 (병렬 처리, 최대 5개씩 배치)
    const BATCH_SIZE = 5
    const results: { title: string; newRate: number | null; symbol: string | null; recordIds: string[] }[] = []

    for (let i = 0; i < uniqueStocks.length; i += BATCH_SIZE) {
      const batch = uniqueStocks.slice(i, i + BATCH_SIZE)
      
      const batchResults = await Promise.all(
        batch.map(async (stock) => {
          // 심볼 획득 우선순위: 1) 저장된 symbol, 2) title로 조회
          let symbol = stock.symbol
          
          if (!symbol) {
            // Fallback: title로 심볼 조회
            symbol = await getSymbolFromTitle(supabase, stock.title)
          }
          
          if (!symbol) {
            console.warn(`[CRON] ${stock.title}: 심볼 없음 (스킵)`)
            return { title: stock.title, newRate: null, symbol: null, recordIds: stock.recordIds }
          }
          
          const newRate = await calculateCAGR(symbol)
          console.log(`[CRON] ${stock.title} (${symbol}): ${newRate !== null ? `${newRate}%` : '실패'}`)
          return { title: stock.title, newRate, symbol, recordIds: stock.recordIds }
        })
      )
      
      results.push(...batchResults)
    }

    // 4. 각 종목별로 레코드 업데이트 (병렬 처리)
    let totalUpdatedRecords = 0
    let successfulStocks = 0

    // 모든 업데이트 작업을 배열로 준비
    const updateTasks: { recordId: string; record: typeof records[0]; newRate: number }[] = []

    for (const result of results) {
      if (result.newRate === null) continue
      
      // 해당 종목의 모든 레코드 찾기 (recordIds 사용)
      for (const recordId of result.recordIds) {
        const record = records.find(r => r.id === recordId)
        if (record) {
          updateTasks.push({ recordId, record, newRate: result.newRate })
        }
      }
      
      successfulStocks++
    }

    console.log(`[CRON] 업데이트 대상 레코드: ${updateTasks.length}개`)

    // 배치 단위로 병렬 처리 (20개씩)
    const UPDATE_BATCH_SIZE = 20

    for (let i = 0; i < updateTasks.length; i += UPDATE_BATCH_SIZE) {
      const batch = updateTasks.slice(i, i + UPDATE_BATCH_SIZE)
      
      const batchResults = await Promise.all(
        batch.map(async ({ recordId, record, newRate }) => {
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
              updated_at: new Date().toISOString()
            })
            .eq('id', recordId)

          if (updateError) {
            console.error(`[CRON] 레코드 업데이트 실패 (${recordId} - ${record.title}):`, updateError)
            return false
          }
          return true
        })
      )

      totalUpdatedRecords += batchResults.filter(Boolean).length
    }

    const duration = Date.now() - startTime

    console.log(`[CRON] 완료 - 종목: ${successfulStocks}개, 레코드: ${totalUpdatedRecords}개, 소요시간: ${duration}ms`)

    return NextResponse.json({
      success: true,
      message: '수익률 일괄 업데이트 완료',
      updatedStocks: successfulStocks,
      updatedRecords: totalUpdatedRecords,
      totalStocks: uniqueStocks.length,
      failedStocks: uniqueStocks.length - successfulStocks,
      duration: `${duration}ms`
    })

  } catch (error) {
    console.error('[CRON] 배치 작업 오류:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        duration: `${Date.now() - startTime}ms`
      },
      { status: 500 }
    )
  }
}
