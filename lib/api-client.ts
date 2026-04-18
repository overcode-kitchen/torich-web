const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
