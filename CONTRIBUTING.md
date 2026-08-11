# 기여 가이드

> 🚀 **처음이라면 [docs/workflow.md](docs/workflow.md) 부터 읽으세요.**
> 이슈 등록부터 배포까지의 흐름을, **사람이 하는 일과 자동으로 되는 일**로 나눠 한 장에 정리해 뒀습니다.
> 이 문서는 그 규칙들의 **배경과 예외**를 다루는 참고 문서입니다.

토리치 협업 규칙을 정리한 문서입니다. 코드 자체에 적용되는 **아키텍처/스키마 호환성 룰** 은 [CLAUDE.md](CLAUDE.md) 에 있고, 이 문서는 **사람 간 협업 절차** (브랜치 전략, 배포, 환경 설정 등) 를 다룹니다.

---

## 브랜치 전략

브랜치 두 개의 뜻만 기억하면 된다.

| 브랜치 | 뜻 |
|--------|------|
| `main` | **지금 앱스토어에 있는 것** |
| `integration` | **다음에 낼 것** |
| `type/이슈번호-설명` | 이슈 하나짜리 작업 브랜치 (`fix/58-chart-loss`). **머지하면 지운다** |
| `hotfix/<버전>` | 급한 수정 (`hotfix/1.2.1`). 머지하면 지운다 |

```
평소     :  type/이슈번호-설명 ──▶ integration ──▶ main  + 태그 v1.3.0
급할 때  :  main ──▶ hotfix/1.2.1 ──▶ main  + 태그 v1.2.1 ──▶ integration에 합치기
```

오래 사는 브랜치는 `main`·`integration` 둘뿐이다. 작업 브랜치는 이슈마다 새로 판다 — 이슈 하나당 브랜치 하나라 PR 범위가 명확해지고, 브랜치 이름의 번호로 [board.yml](.github/workflows/board.yml)이 카드를 `진행중`으로 옮긴다.

### 규칙은 하나 — 급한 수정은 `main`에서 시작하고, 끝나면 `integration`에 합친다

- **`main`에서 시작하는 이유**: `integration`에는 아직 안 내보낼 다음 버전 기능이 섞여 있다. 거기서 잘라 배포하면 검증 안 된 기능이 딸려 나간다.
- **`integration`에 합치는 이유**: 안 하면 다음 배포에서 그 버그가 되살아난다.

```bash
git checkout integration && git pull && git merge origin/main && git push origin integration
```

합치기를 빠뜨렸는지는 `.github/workflows/release.yml` 이 릴리스마다 자동으로 검사한다. 누락되면 이슈가 자동으로 생기므로 외울 필요는 없다.

### 1.3.0 만드는 중에 1.2.1 급한 수정이 생겼을 때

1. 하던 작업은 작업 브랜치에 커밋해두고 둔다 (`git stash` 도 됨)
2. `git checkout main && git pull && git checkout -b hotfix/1.2.1`
3. 고쳐서 `main` 으로 PR → 머지 → 버전 올리고 태그 `v1.2.1` push
4. 위의 합치기 명령 실행
5. 하던 작업으로 돌아간다

`v1.2.1` 을 배포해도 `v1.3.0` 마일스톤은 그대로 굴러간다. 4번에서 충돌이 나면 `integration` 쪽 최신 코드를 살리되, 이 수정이 고친 동작이 남아 있는지만 확인한다.

### `main` 머지 원칙

- 실험성/대규모 리팩토링은 `integration` 에서 충분히 검증 후 반영.
- 긴급 수정도 최소 [PR 체크리스트](#pr-체크리스트) 통과 후 머지.

---

## 이슈 · 릴리스 관리

기획/디자인/프론트 경계 없이 2명이 움직이므로, 도구는 **Issue · Milestone · Projects 보드 하나**로 끝낸다.

| 개념 | 도구 |
|---|---|
| 앱 버전 (`v1.3.0`) + 배포 예정일 | **Milestone** (due date = 배포일) |
| 그 버전에 넣을 작업 | 해당 마일스톤에 붙은 **Issue** |
| 담당자 | Issue Assignee (직접 self-assign) |
| 신규 / 진행중 / 완료 | **Projects 보드**의 Status |

보드 최초 세팅 방법은 [docs/github-projects-setup.md](docs/github-projects-setup.md) 참고 (1회성).

### 버전 규칙

| 버전 | 언제 | 어디서 만드나 |
|---|---|---|
| `1.2.1` (patch) | 급한 수정 | `main` |
| `1.3.0` (minor) | 새 기능·개선 | `integration` |

**마일스톤 = 앱 버전이다.** 마일스톤 두 개가 동시에 열려 있는 게 정상이고, 이슈를 만들 때 **"지금 나가야 하나"** 만 판단하면 알아서 갈린다.

버전 값은 세 군데를 함께 올린다.

| 위치 | 예시 | 규칙 |
|---|---|---|
| `package.json` 의 `version` | `1.2.1` | **단일 소스** |
| `MARKETING_VERSION` (`ios/App/App.xcodeproj/project.pbxproj`) | `1.2.1` | package.json과 항상 동일 |
| `CURRENT_PROJECT_VERSION` (같은 파일) | `4` | **버전과 무관하게 심사 제출할 때마다 +1.** 되돌리면 안 됨 |

### 이슈 작성

- 제목은 커밋 컨벤션과 동일하게: `fix(stats): 손실이 차트에서 0으로 표시됨`
- 템플릿 2종(기능 / 버그)이 자동으로 뜨고, 라벨도 자동으로 붙는다.
- **작업 종류 라벨은 커밋 type과 1:1이다** — `feat` `fix` `refactor` `docs` `chore` `style`. 템플릿이 알아서 붙인다.
- **`진행중`·`배포대기` 라벨은 손대지 않는다.** 보드 Status를 복사한 것이고 [board.yml](.github/workflows/board.yml)이 자동으로 붙였다 뗀다.
- 지금 나갈 게 정해진 작업은 마일스톤을 지정한다. 언젠가 해야 하지만 버전을 못 박을 수 없는 것은 비워둔다 — 보드의 `백로그` 뷰가 모아 보여주고, 다음 버전 계획 때 끌어온다.

### 한 사이클 · 릴리스 절차

→ **[docs/workflow.md](docs/workflow.md)** 에 단계별로 정리돼 있다. 절차를 두 곳에 적으면 반드시 어긋나므로 여기서는 반복하지 않는다.

아래는 그 절차가 **왜 그렇게 생겼는지**에 대한 배경이다.

#### `배포대기` 상태가 따로 있는 이유

`integration` 머지로는 이슈가 닫히지 않는다. 이건 의도한 동작이다 — **"코드는 들어갔지만 사용자에게는 아직 안 나간"** 상태가 이 저장소에는 실재하기 때문이다. iOS 앱은 심사를 거쳐야 사용자에게 닿는다. 다음 배포에 무엇이 나가는지가 이 컬럼에 그대로 보인다.

#### 심사 지연을 감안한다

앱 심사에 며칠 걸린다. 급한 장애일수록 **서버에서 우회할 수 있는지 먼저 검토**하는 게 빠를 때가 많다. 앱 재빌드가 필요한 수정과 그렇지 않은 수정을 구분해서 판단한다.

---

## 마이그레이션 작업 협업 규칙

두 명 이상이 동시에 마이그레이션을 작성하면 적용 순서 충돌이 발생합니다.

- 마이그레이션 파일 생성 **전에** 팀에 공지한다.
- 파일명은 Supabase CLI 표준 타임스탬프 형식 사용: `20260426153000_add_market_to_records.sql`.
- 마이그레이션 포함 PR은 머지 전 상대방 확인 필수.
- 마이그레이션 적용 후 `supabase gen types typescript --project-id <프로젝트ID> > types/database.types.ts` 실행 — 타입 동기화 누락 시 런타임까지 에러가 잡히지 않음.

스키마 호환성 규칙(어떤 변경이 금지/허용되는지)은 [CLAUDE.md의 "Supabase / API 호환성" 섹션](CLAUDE.md) 참고.

---

## 머지 전 호환성 확인

- **백엔드/스키마 변경 시**: 구버전 앱의 쿼리·요청이 깨지지 않는지 확인.
- **프론트 변경 시**: 현재 운영 API/스키마와 충돌이 없는지 확인.
- 머지 판단 기준: **"지금 운영 앱 사용자에게 안전한가?"**

---

## 로컬 환경

키 구성은 [`.env.example`](.env.example) 을 기준으로 통일합니다. "내 로컬에서만 되는 상태" 를 만들지 않습니다.

**파일은 두 개를 만듭니다.** 키 구성은 같고 값만 다릅니다.

```bash
cp .env.example .env.development.local    # pnpm dev 에서만 읽힘
cp .env.example .env.production           # pnpm build:app 에서만 읽힘
```

> 🚫 **`.env.local` 은 만들지 마세요.**
> dev·build 양쪽에서 읽히고 `.env.production` 보다 **우선**하기 때문에, 개발용 값이 앱 번들에 조용히 구워집니다. 빌드는 성공하고 경고도 없어서 **앱스토어에 올린 뒤에야 드러납니다.** 이 저장소에서 실제로 두 번 발생했습니다 (잘못된 API 주소가 구워짐, Dev GA 속성으로 운영 데이터 유입).
> 자세한 우선순위는 [CLAUDE.md의 "앱 빌드 환경변수" 섹션](CLAUDE.md) 참고.

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 서비스 Role Key (서버 전용). `.env.production` 에서는 비워둡니다 |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase 설정 |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 측정 ID (dev/prod 속성 분리) |
| `NEXT_PUBLIC_API_URL` | `pnpm build:app` 빌드 시 필수 |

---

## 테스트 운영 방식

- **일상**: 각자 로컬에서 테스트.
- **통합**: 주 1~2회 `integration` 기준으로 TestFlight 내부 배포 후 실기기 검증.
- **운영 배포 전**: 핵심 시나리오 스모크 테스트 필수.

> 푸시 알림은 시뮬레이터에서 테스트 불가 — **실기기(TestFlight) 필수**.

### 배포 전 스모크 체크리스트

- [ ] 로그인/토큰 갱신 정상
- [ ] 핵심 조회 API (Supabase 직접 쿼리 포함) 정상
- [ ] 핵심 저장/수정 API 정상
- [ ] 푸시 알림/딥링크 등 네이티브 연동 포인트 정상
- [ ] 주요 에러 처리 (네트워크 실패/권한 거부) 정상

---

## PR 체크리스트

PR 본문 템플릿은 [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md) 에 있어, **PR 생성 시 자동으로 채워집니다**. 항목을 채우고 체크박스를 확인한 뒤 머지하세요.

---

## 공통 원칙

- "빠른 개발" 보다 **"운영 호환성"** 우선.
- iOS 앱은 즉시 업데이트되지 않는다는 전제를 항상 유지.
- Supabase 스키마와 Next.js API 모두 **추가 중심으로 진화**, 삭제/변경은 버전 전환 절차 후 진행.

> **요약**: 2인 팀은 `integration + 로컬 테스트` 로 운영하되, Supabase 스키마·API 하위호환을 지키고, 마이그레이션은 사전 공지 + 타입 재생성까지 세트로 처리하며, 주기적 TestFlight 통합 검증을 수행한다.
