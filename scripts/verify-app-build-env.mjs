/**
 * build:app 전에 실행: Next와 동일한 우선순위로 .env를 읽고 NEXT_PUBLIC_API_URL을 검증합니다.
 *
 * 우선순위가 Next와 어긋나면 "검사는 통과했는데 번들에는 다른 값이 구워지는" 상태가 되고,
 * 그 결과물은 앱스토어에 올린 뒤에야 API 실패로 드러난다. 그래서 로드 순서를 Next와 일치시키고,
 * 최종 해석된 값과 그 출처 파일을 항상 출력한다.
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

const KEY = 'NEXT_PUBLIC_API_URL';

/** 값이 실제로 어느 파일에서 왔는지 추적해 사용자가 고칠 파일을 정확히 알려준다. */
const fileEnv = {};
let source = null;

for (const file of ENV_FILES) {
  const before = fileEnv[KEY];
  config({ path: resolve(root, file), processEnv: fileEnv, override: true });
  if (fileEnv[KEY] !== before) {
    source = file;
  }
}

// 쉘에서 넘긴 값이 최우선 (Next 동작과 동일)
const fromShell = process.env[KEY]?.trim();
const url = fromShell || fileEnv[KEY]?.trim();
if (fromShell) {
  source = '쉘 환경변수';
}

function fail(lines) {
  console.error('');
  for (const line of lines) {
    console.error(line);
  }
  console.error('');
  process.exit(1);
}

if (!url) {
  fail([
    `[build:app] ${KEY}가 비어 있습니다.`,
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
    `[build:app] ${KEY}가 올바른 URL이 아닙니다: ${url}  (출처: ${source})`,
    '  네이티브 빌드는 상대 경로로 API를 호출할 수 없어 절대 URL이 필요합니다.',
  ]);
}

if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
  fail([
    `[build:app] ${KEY}는 http/https여야 합니다: ${url}  (출처: ${source})`,
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
    `[build:app] ${KEY}가 로컬 주소입니다: ${url}`,
    `  출처: ${source}`,
    '',
    '  이 값이 그대로 번들에 구워지면 배포된 앱에서 주식 검색·시세·수익률 갱신이 모두 실패합니다.',
    `  ${source}의 ${KEY}를 운영 주소(예: https://torich.vercel.app)로 바꾼 뒤 다시 실행하세요.`,
    '',
    '  실기기 로컬 테스트 목적이라면: ALLOW_LOCAL_API_URL=1 npm run build:app',
  ]);
}

if (isLocal) {
  console.warn(`[build:app] ⚠️  로컬 주소로 빌드합니다: ${url} (출처: ${source}) — 배포·심사용으로 쓰지 마세요.`);
} else {
  console.log(`[build:app] ${KEY} = ${url} (출처: ${source})`);
}
