/**
 * build:app 전에 실행: Next와 동일한 우선순위로 .env를 읽고 번들에 구워질 값들을 검증합니다.
 *
 * 우선순위가 Next와 어긋나면 "검사는 통과했는데 번들에는 다른 값이 구워지는" 상태가 되고,
 * 그 결과물은 앱스토어에 올린 뒤에야 드러난다. 그래서 로드 순서를 Next와 일치시키고,
 * 최종 해석된 값과 그 출처 파일을 항상 출력한다.
 *
 * 검사 대상:
 * - NEXT_PUBLIC_API_URL: 로컬 주소가 구워지면 배포된 앱에서 API가 전부 실패한다.
 * - NEXT_PUBLIC_GA_ID:   비어 있으면 layout.tsx의 `GA_ID && <GoogleAnalytics/>` 가드가
 *                        태그를 통째로 떨어뜨리는데, 빌드는 에러 없이 성공한다. 실제로
 *                        v1.4.0까지 앱 계측이 이 방식으로 조용히 사라진 이력이 있다.
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

/**
 * Next의 로드 순서(우선순위 낮음 → 높음). dotenv는 override로 뒤에 읽은 값이 이기므로
 * 이 배열의 뒤쪽이 곧 우선순위가 높은 파일이다. 쉘 환경변수는 이 모두를 이긴다.
 */
const ENV_FILES = ['.env', '.env.production', '.env.local', '.env.production.local'];

const API_KEY = 'NEXT_PUBLIC_API_URL';
const GA_KEY = 'NEXT_PUBLIC_GA_ID';

/** 개발용 GA 속성. 이 값이 릴리즈 번들에 구워지면 운영 데이터가 Dev 속성으로 흘러간다. */
const GA_DEV_ID = 'G-C8E4VZ883Y';

/**
 * 파일들을 Next 순서대로 읽으면서 **키마다** 마지막으로 값을 바꾼 파일을 기록한다.
 * 값이 실제로 어느 파일에서 왔는지 알려줘야 사용자가 고칠 파일을 정확히 찾는다.
 */
const fileEnv = {};
const sources = {};

for (const file of ENV_FILES) {
  const before = { ...fileEnv };
  config({ path: resolve(root, file), processEnv: fileEnv, override: true });
  for (const key of Object.keys(fileEnv)) {
    if (fileEnv[key] !== before[key]) {
      sources[key] = file;
    }
  }
}

/** 쉘 환경변수가 최우선 (Next 동작과 동일). */
function resolveEnv(key) {
  const fromShell = process.env[key]?.trim();
  if (fromShell) {
    return { value: fromShell, source: '쉘 환경변수' };
  }
  return { value: fileEnv[key]?.trim(), source: sources[key] ?? null };
}

function fail(lines) {
  console.error('');
  for (const line of lines) {
    console.error(line);
  }
  console.error('');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// NEXT_PUBLIC_API_URL
// ─────────────────────────────────────────────────────────────

const { value: url, source: apiSource } = resolveEnv(API_KEY);

if (!url) {
  fail([
    `[build:app] ${API_KEY}가 비어 있습니다.`,
    '  다음 파일 중 하나에 설정 후 다시 실행하세요:',
    '  - .env.local (있으면 .env.production보다 우선합니다)',
    '  - .env.production (Git에 커밋하지 않음)',
    '  예: NEXT_PUBLIC_API_URL=https://api.example.com',
  ]);
}

let parsed;
try {
  parsed = new URL(url);
} catch {
  fail([
    `[build:app] ${API_KEY}가 올바른 URL이 아닙니다: ${url}  (출처: ${apiSource})`,
    '  네이티브 빌드는 상대 경로로 API를 호출할 수 없어 절대 URL이 필요합니다.',
  ]);
}

if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
  fail([
    `[build:app] ${API_KEY}는 http/https여야 합니다: ${url}  (출처: ${apiSource})`,
  ]);
}

/** localhost·루프백·사설 IP 판별. 이 주소가 번들에 구워지면 배포된 앱에서 API가 전부 실패한다. */
function isLocalHostname(hostname) {
  const h = hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local')) return true;
  if (h === '::1' || h === '0.0.0.0') return true;

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.\d{1,3}\.\d{1,3}$/);
  if (!v4) return false;

  const a = Number(v4[1]);
  const b = Number(v4[2]);
  if (a === 127 || a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;
  return false;
}

const isLocal = isLocalHostname(parsed.hostname);

// 실기기 로컬 테스트(Mac IP 지정)는 정당한 용도라 완전 차단 대신 명시적 탈출구를 둔다.
// 기본값이 '차단'이어야 실수로 로컬 주소가 심사 빌드에 들어가지 않는다.
if (isLocal && process.env.ALLOW_LOCAL_API_URL !== '1') {
  fail([
    `[build:app] ${API_KEY}가 로컬 주소입니다: ${url}`,
    `  출처: ${apiSource}`,
    '',
    '  이 값이 그대로 번들에 구워지면 배포된 앱에서 주식 검색·시세·수익률 갱신이 모두 실패합니다.',
    `  ${apiSource}의 ${API_KEY}를 운영 주소(예: https://torich.vercel.app)로 바꾼 뒤 다시 실행하세요.`,
    '',
    '  실기기 로컬 테스트 목적이라면: ALLOW_LOCAL_API_URL=1 npm run build:app',
  ]);
}

if (isLocal) {
  console.warn(`[build:app] ⚠️  로컬 주소로 빌드합니다: ${url} (출처: ${apiSource}) — 배포·심사용으로 쓰지 마세요.`);
} else {
  console.log(`[build:app] ${API_KEY} = ${url} (출처: ${apiSource})`);
}

// ─────────────────────────────────────────────────────────────
// NEXT_PUBLIC_GA_ID
// ─────────────────────────────────────────────────────────────

const { value: gaId, source: gaSource } = resolveEnv(GA_KEY);

// app/layout.tsx가 `GA_ID && <GoogleAnalytics/>`라, 값이 없으면 측정 태그가 번들에서
// 통째로 사라지는데 빌드는 성공한다. 사후에 알아채려면 앱스토어 심사를 한 번 더 기다려야 하므로
// 여기서 막는다.
if (!gaId) {
  fail([
    `[build:app] ${GA_KEY}가 비어 있습니다.`,
    '',
    '  이대로 빌드하면 app/layout.tsx의 가드가 <GoogleAnalytics />를 렌더하지 않아,',
    '  번들에 측정 ID가 한 글자도 들어가지 않습니다. 빌드는 성공하고 앱도 정상 동작하므로',
    '  계측이 죽은 사실은 스토어에 올린 뒤에야 드러납니다.',
    '',
    '  .env.production에 설정 후 다시 실행하세요:',
    '  예: NEXT_PUBLIC_GA_ID=G-SC1LBTD65X   # Torich Prod',
  ]);
}

// 릴리즈 번들에 Dev 속성이 들어가면 운영 사용자의 행동이 개발용 속성에 쌓여
// 두 데이터가 모두 못 쓰게 된다. 기본값을 '차단'으로 두고 탈출구만 남긴다.
if (gaId === GA_DEV_ID && process.env.ALLOW_DEV_GA_ID !== '1') {
  fail([
    `[build:app] ${GA_KEY}가 개발용 속성입니다: ${gaId}`,
    `  출처: ${gaSource}`,
    '',
    '  이 값이 번들에 구워지면 운영 사용자 데이터가 Torich Dev 속성으로 흘러갑니다.',
    `  ${gaSource ?? '.env.production'}의 ${GA_KEY}를 운영 속성(G-SC1LBTD65X)으로 바꾼 뒤 다시 실행하세요.`,
    '',
    '  개발 속성으로 계측을 시험할 목적이라면: ALLOW_DEV_GA_ID=1 npm run build:app',
  ]);
}

if (gaId === GA_DEV_ID) {
  console.warn(`[build:app] ⚠️  개발용 GA 속성으로 빌드합니다: ${gaId} (출처: ${gaSource}) — 배포·심사용으로 쓰지 마세요.`);
} else {
  console.log(`[build:app] ${GA_KEY} = ${gaId} (출처: ${gaSource})`);
}
