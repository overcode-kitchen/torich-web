const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 요청 상한(ms).
 *
 * 지하철·엘리베이터처럼 요청은 나갔는데 응답이 끝내 오지 않는 네트워크에서, 호출부가
 * 무한정 매달리지 않게 한다.
 *
 * 값이 넉넉한 이유: 이 상한은 납입 시세 캡처뿐 아니라 종목 검색·수익률 조회에도 함께
 * 걸린다. 캡처는 실패해도 안전하지만(captured_* NULL + monthly_amount 폴백), 검색과
 * 수익률은 사용자가 화면에서 곧바로 겪는 실패가 된다. /api/stock이 Supabase 조회와
 * yahooFinance.quote()를 직렬로 돌고 여기에 서버리스 콜드 스타트까지 겹치면 5초는
 * 빠듯하다. 캡처가 늦어지는 건 이제 문제가 아니다 — 체크 저장은 이미 끝나 있다(#90).
 */
const REQUEST_TIMEOUT_MS = 8000;

function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return cap?.isNativePlatform?.() === true;
}

function isAbsoluteHttpUrl(u: string): boolean {
  return /^https?:\/\//i.test(u);
}

export async function apiClient(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE_URL}${endpoint}`;

  if (isNativeApp() && !isAbsoluteHttpUrl(url)) {
    console.error(
      '❌ Native 빌드 실패: NEXT_PUBLIC_API_URL 환경변수가 누락되어 상대 경로로 API를 호출할 수 없습니다.',
    );
    throw new Error(
      'NEXT_PUBLIC_API_URL이 설정되지 않아 네이티브 환경에서 API를 호출할 수 없습니다.',
    );
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    // 호출부가 직접 signal을 넘겼다면 그쪽 의도를 존중한다.
    signal: options?.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
