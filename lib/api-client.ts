const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * 요청 상한(ms).
 *
 * 지하철·엘리베이터처럼 요청은 나갔는데 응답이 끝내 오지 않는 네트워크에서, 호출부가
 * 무한정 매달리지 않게 한다. 이 클라이언트를 쓰는 곳은 시세·검색 API뿐이라 5초면 넉넉하고,
 * 세 호출부 모두 실패를 이미 폴백(캐시·에러 상태)으로 처리한다.
 */
const REQUEST_TIMEOUT_MS = 5000;

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
