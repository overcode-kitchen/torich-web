/**
 * build:app 전에 실행: Next와 동일한 우선순위로 .env를 읽고 NEXT_PUBLIC_API_URL 존재를 검증합니다.
 * @see https://nextjs.org/docs/app/building-your-application/configuring/environment-variables
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

config({ path: resolve(root, '.env') });
config({ path: resolve(root, '.env.local'), override: true });
config({ path: resolve(root, '.env.production'), override: true });
config({ path: resolve(root, '.env.production.local'), override: true });

const url = process.env.NEXT_PUBLIC_API_URL?.trim();
if (!url) {
  console.error('');
  console.error('[build:app] NEXT_PUBLIC_API_URL가 비어 있습니다.');
  console.error('  다음 파일 중 하나에 설정 후 다시 실행하세요:');
  console.error('  - .env.production (권장, Git에 커밋하지 않음)');
  console.error('  - .env.production.local');
  console.error('  예: NEXT_PUBLIC_API_URL=https://api.example.com');
  console.error('');
  process.exit(1);
}

console.log('[build:app] NEXT_PUBLIC_API_URL 로드 확인 완료');
