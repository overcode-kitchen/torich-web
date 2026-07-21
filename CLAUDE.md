# 토리치 프로젝트 가이드 (CLAUDE.md)

## Language
- Always respond in Korean (한국어로 응답)

## Commit Convention
형식: `type(scope): 한글 설명 + 평서 종결형 어미(~함/~음)`. 외부 파일을 참조하지 않는, 이 저장소의 단일 기준.
- **type**: `feat` `fix` `style` `refactor` `chore` `docs`
- **scope**: 변경 도메인·화면 (`home` `goal` `stats` `investment` `faq` `calendar` `layout` `navigation` 등)
- **예시**: `fix(stats): 손실 데이터가 차트에서 음수 영역으로 표시되도록 수정함`

---

# 운영 컨텍스트 (반드시 인지)

코드 변경의 영향 반경을 판단하기 위해 항상 아래를 전제한다.

- iOS 앱은 Capacitor **로컬 번들** 방식 (`webDir: 'out'`, 정적 export).
- `main` 배포 시 **웹/서버는 즉시 반영되지만, 출시된 iOS 앱은 사용자가 업데이트해야 반영된다.**
- 클라이언트가 Supabase SDK로 **DB에 직접 접근** → **스키마가 곧 API**, 스키마 변경 = Breaking Change.
- 운영 중에는 항상 **`구버전 앱 + 신버전 DB/API`** 조합이 존재한다고 가정한다.
- 머지 기준: **"지금 운영 앱 사용자에게 안전한가?"**

---

# Supabase / API 호환성 (CRITICAL)

## Supabase 스키마 — Breaking Change 금지
- **금지**: 기존 컬럼 삭제·이름변경·타입변경 / 기존 컬럼에 `NOT NULL` 추가(기존 행 파괴) / RLS 강화(조회 범위 축소)
- **허용**: 새 컬럼 추가(`DEFAULT` 필수) / 새 테이블 / `NOT NULL`→`NULL` 완화 / 인덱스 추가
- **구조 변경 시 순서 고정**: ① 새 구조 추가(구 스펙 병행) → ② 앱 업데이트 배포 확인 → ③ 구 스펙 제거

## Next.js API Route — Breaking Change 금지
- **금지**: 기존 필드 삭제·이름변경·타입변경, 엔드포인트 경로/요청 형식 변경
- **허용**: 새 필드 추가, 새 엔드포인트 추가

## 마이그레이션
- 파일명은 **Supabase CLI 타임스탬프** 형식 (예: `20260426153000_add_market_to_records.sql`)
- 작성 후 반드시 타입 재생성: `supabase gen types typescript --project-id <ID> > types/database.types.ts`

---

# 빌드 함정

- **`build:app` 실패 복구**: 빌드 중 `app/api`·`app/auth`를 `server-routes.backup/`으로 임시 이동한다. 중간 실패 시 복구되지 않은 채 남으므로 발견 즉시 수동 복구:
  ```bash
  mv server-routes.backup/api app/api && mv server-routes.backup/auth app/auth && rm -rf server-routes.backup
  ```
- **`capacitor.config.ts`의 `server.url` 커밋 금지**: 주석 해제된 `server.url`이 배포되면 운영 앱이 로컬 서버를 바라본다. PR 머지 전 diff 필수 확인.

`loggingBehavior` 도 동일하게 `'production'` 으로 유지된 채 머지되어야 한다. `'debug'` 로 커밋 금지.

## 앱 빌드 환경변수 — `.env.local`이 `.env.production`을 이긴다 (CRITICAL)

`NEXT_PUBLIC_*` 값은 **빌드 시점에 번들에 문자열로 구워진다.** 잘못된 값이 들어가면 배포 후 앱에서만 드러나고, 재빌드·재심사 외에는 되돌릴 방법이 없다.

Next의 우선순위는 아래와 같다. **위쪽이 이긴다.**

| 순위 | 출처 |
|---|---|
| 1 | 쉘 환경변수 (`FOO=bar npm run build:app`) |
| 2 | `.env.production.local` |
| 3 | **`.env.local`** |
| 4 | `.env.production` |
| 5 | `.env` |

`.env.local`이 `.env.production`보다 **위**라는 게 핵심이다. `.env.production`에 운영 값을 넣어도, **같은 키가 `.env.local`에도 있으면 `.env.local`이 구워진다.** `.env.local`에 없는 키(예: GA ID)만 `.env.production` 값이 실제로 쓰인다.

`.env.local`의 `NEXT_PUBLIC_API_URL`은 로컬 개발용 `http://localhost:3000`으로 두는 게 보통이므로, 이 키가 정확히 위 함정에 해당한다.

### 릴리즈·심사 빌드는 쉘 환경변수로 넘긴다 (권장)

`.env.local`을 고쳤다 되돌리는 방식은 되돌리기를 잊는 순간 로컬 주소가 새어 나간다. 우선순위 1위인 쉘 환경변수를 쓰면 파일을 건드리지 않는다.

```bash
NEXT_PUBLIC_API_URL=https://torich.vercel.app npm run build:app
```

`scripts/verify-app-build-env.mjs`가 빌드 전에 해석된 값과 **출처 파일**을 출력하고, 로컬 주소(`localhost`·루프백·사설 IP)면 빌드를 중단한다. 실기기 로컬 테스트 목적이라면 `ALLOW_LOCAL_API_URL=1`로만 우회한다.

빌드 후 번들을 직접 확인하는 게 최종 관문이다.

```bash
grep -ro "localhost:3000" out/ | wc -l   # 반드시 0
```

## macOS 한글 경로 + CocoaPods UTF-8

작업 경로에 한글이 포함되어 있을 경우 (예: `Team/overcord-kitchen/...`) `pod install` 단계에서 `Encoding::CompatibilityError` 가 발생한다. `~/.zshrc` 에 아래를 영구 등록한다.

```bash
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
```

---

# Capacitor 정적 Export 라우팅 정책 (CRITICAL)

iOS 앱은 `output: 'export'` 로 빌드한 정적 파일을 Capacitor WebView가 로드하는 구조이다. **빌드 시점에 prebuild되지 않은 경로는 운영 앱에서 404 → 루트 폴백으로 메인 화면 리다이렉트로 보인다.** 모든 페이지/네비게이션은 이 제약을 전제로 설계한다.

## 동적 세그먼트(`[param]`) 신규 추가 금지 (원칙)

- ❌ **금지**: `app/**/[id]/page.tsx`, `app/**/[slug]/page.tsx` 형태의 새 동적 세그먼트
- ✅ **권장**: 정적 경로 + `useSearchParams` 로 식별자 전달
  - 예: `/goal/detail?id=abc` (정적 1개 페이지로 모든 ID 처리)
  - ❌ `/goal/[id]` (모든 ID를 빌드 시점에 알 수 없으므로 사용 불가)

### 예외: 값 집합이 빌드 시점에 확정 가능한 경우만 허용
- 허용 예: `[locale]` (값이 `['ko','en']` 로 한정)
- 이 경우 반드시 `generateStaticParams` 로 모든 값을 명시한다.

### 동적 세그먼트가 꼭 필요할 때 — 분리 패턴 강제
페이지가 `'use client'` 인데 `generateStaticParams` 도 export 해야 한다면 두 파일로 분리한다 (`'use client'` 파일은 서버 export를 가질 수 없음).

```
app/foo/[id]/
  page.tsx          # 서버 컴포넌트, generateStaticParams + <FooClient/> 렌더만
  FooClient.tsx     # 'use client', 실제 로직
```

`dynamicParams = true` 는 `output: 'export'` 와 호환되지 않으므로 사용 금지.

## 페이지 신규 작성 시 라우팅 체크리스트

새 페이지를 만들 때 아래 순서로 자문한다.

1. URL에 식별자(id, slug 등)가 필요한가?
   - 필요 없음 → 정적 경로(`/foo`) 그대로 작성
   - 필요함 → 2번
2. 식별자 값 집합을 빌드 시점에 모두 알 수 있는가?
   - YES → `[param]` + `generateStaticParams` 로 전체 명시
   - NO → **반드시 정적 경로 + query param 패턴** (`/foo/detail?id=xxx`)
3. `router.push` / `router.replace` / `<Link>` 의 모든 대상 경로가 빌드 산출물(`out/`)에 존재하는지 확인 ( `npm run build:app` 후 `ls out/` 검증)

## 기존 동적 라우트를 query param으로 전환할 때

이미 운영 앱에 박힌 deeplink/푸시 페이로드가 구 경로(`/goal/[id]`)를 가리킬 수 있으므로, 라우팅 변경은 **운영 컨텍스트 섹션의 "구버전 앱 + 신버전 API" 원칙**을 그대로 따른다. 필요 시 client-side에서 구 경로 → 신 경로로 redirect 하는 처리 추가.

## 머지 전 라우팅 점검 체크리스트

- [ ] 새로 추가/수정한 페이지가 `app/**/[*]/` 형태인가? → 정적 경로 + query param으로 대체 가능한지 재검토
- [ ] `npm run build:app` 산출물 `out/` 에 모든 진입 경로의 HTML이 존재하는가
- [ ] `server-routes.backup/` 폴더가 워킹 트리에 남아 있지 않은가
- [ ] `git status` 에 `app/api/*`, `app/auth/*` 가 deleted로 떠 있지 않은가
- [ ] `capacitor.config.ts` 의 `server.url` 이 주석 처리 + `loggingBehavior: 'production'` 인가
- [ ] `grep -ro "localhost:3000" out/ | wc -l` 이 **0** 인가 (아카이빙 직전 필수)
- [ ] `[build:app] NEXT_PUBLIC_API_URL = ...` 출력의 값과 출처가 운영 기준으로 찍혔는가

---

# Edge Function 배포

`supabase/functions/`의 함수는 코드 변경 후 **별도 배포**로 반영된다. 함수 변경이 포함된 작업은 배포까지 끝내야 완료다.
→ `supabase functions deploy <함수명>`

---

# 상세 문서 (작업 시 필독)

긴 상세 규칙은 아래로 분리했다. 해당 작업을 할 때 반드시 읽는다.

- **[docs/architecture.md](docs/architecture.md)** — 파일 구조·네이밍·커스텀 훅 패턴·파일 크기 규칙·새 페이지/리팩터링 순서. *(페이지 생성·구조 변경 시 필독)*
- **[docs/design-system.md](docs/design-system.md)** — 디자인 바이브·컬러 3-Layer·다크모드·차트 색·shadcn·아이콘·이미지 변환 워크플로우. *(UI 작업 시 필독)*
- **[docs/coding-style.md](docs/coding-style.md)** — 기술 스택 제약·코딩 스타일·경로/컴포넌트 규칙·한국어 처리.
