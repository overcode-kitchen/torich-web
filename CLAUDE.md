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
