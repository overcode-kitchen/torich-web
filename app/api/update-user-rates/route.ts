import { NextResponse } from 'next/server'

// [비활성화됨] 시스템 수익률(10년 CAGR) 자동 갱신 엔드포인트
//
// 예상 수익률은 제품에서 제거됐고(a3c6acc), 갱신 결과를 표시하는 화면이 하나도 없다.
// 그런데도 이 라우트는 홈 진입마다 Yahoo Finance를 호출하며 상장폐지·데이터 부족 종목에서
// 오류를 냈다. 계산을 전부 걷어내고 "갱신할 것 없음"만 돌려주는 스텁으로 남긴다.
//
// 라우트 자체를 지우지 않는 이유: 출시된 구버전 앱이 홈 진입마다 이 경로를 호출한다.
// 404가 나면 앱 쪽에서 불필요한 실패 처리가 돌기 때문에, 응답 스키마를 그대로 유지한다.
// 앱 최소 지원 버전이 올라가 이 경로를 부르는 앱이 없어지면 파일째 삭제할 것.

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 })
    }
  } catch {
    // 본문이 없거나 JSON이 아니어도 실패로 취급하지 않는다 (어차피 하는 일이 없다)
  }

  return NextResponse.json({
    success: true,
    updated: false,
    message: '이미 최신 상태입니다.',
    updatedStocks: 0,
    updatedRecords: 0,
    results: [],
    duration: '0ms'
  })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId가 필요합니다.' }, { status: 400 })
  }

  // needsUpdate=false 이므로 구버전 앱도 뒤이은 POST를 보내지 않는다.
  return NextResponse.json({
    needsUpdate: false,
    recordsToUpdate: 0
  })
}
