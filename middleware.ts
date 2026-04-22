import { type NextRequest, NextResponse } from 'next/server';

/** Capacitor·로컬 웹뷰·프로덕션 웹 출처 (필요 시 CORS_ALLOWED_ORIGINS 환경변수로 추가) */
const DEFAULT_ALLOWED_ORIGINS = [
  'capacitor://localhost',
  'http://localhost',
  'https://localhost',
  'https://torich.vercel.app',
] as const;

const CORS_METHODS = 'GET,POST,OPTIONS,PUT,PATCH,DELETE';
const CORS_HEADERS =
  'Content-Type, Authorization, X-Requested-With, Accept';

function buildAllowedOriginSet(): Set<string> {
  const extra =
    process.env.CORS_ALLOWED_ORIGINS?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return new Set<string>([...DEFAULT_ALLOWED_ORIGINS, ...extra]);
}

function applyCorsHeaders(
  headers: Headers,
  origin: string | null,
  allowed: Set<string>,
): boolean {
  if (!origin || !allowed.has(origin)) {
    return false;
  }
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Vary', 'Origin');
  return true;
}

export function middleware(request: NextRequest) {
  const allowed = buildAllowedOriginSet();
  const origin = request.headers.get('origin');

  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    applyCorsHeaders(headers, origin, allowed);
    headers.set('Access-Control-Allow-Methods', CORS_METHODS);
    headers.set('Access-Control-Allow-Headers', CORS_HEADERS);
    headers.set('Access-Control-Max-Age', '86400');
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  const corsApplied = applyCorsHeaders(response.headers, origin, allowed);
  if (corsApplied) {
    response.headers.set('Access-Control-Allow-Methods', CORS_METHODS);
    response.headers.set('Access-Control-Allow-Headers', CORS_HEADERS);
  }
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
