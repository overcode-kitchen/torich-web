# Projects 보드 세팅 (1회성)

보드 자체는 CLI로 만들 수 있지만 **내장 자동화(Workflows) 토글은 웹 UI에서만 켤 수 있다.** 아래 순서대로 한 번만 하면 이후 손댈 일이 없다. 10분이면 끝난다.

일상 운영 규칙은 [CONTRIBUTING.md의 "이슈 · 릴리스 관리"](../CONTRIBUTING.md#이슈--릴리스-관리) 참고.

---

## 1. 보드 생성

<https://github.com/orgs/overcode-kitchen/projects> → **New project** → **Board** 템플릿 → 이름 `토리치`.

Organization 레벨에 만든다. 저장소 레벨 프로젝트는 나중에 저장소가 늘면 옮겨야 한다.

## 2. Status 컬럼 4개로 맞추기

기본 생성되는 `Todo` / `In Progress` / `Done` 을 아래로 바꾸고 하나를 추가한다.
(컬럼 헤더 `···` → **Edit details** 로 이름 변경, 맨 오른쪽 **+** 로 추가)

| 컬럼 | 의미 |
|---|---|
| `신규` | 마일스톤에 잡혀 있으나 아직 아무도 안 잡음 |
| `진행중` | assignee가 붙어 작업 중 |
| `배포대기` | `integration`에 머지됨. 코드는 들어갔지만 사용자에게는 아직 안 나감 |
| `완료` | `main` 배포 완료 |

`배포대기`가 이 팀에 꼭 필요한 컬럼이다. 다음 릴리스에 무엇이 나가는지가 이 컬럼 그대로다.

## 3. 자동화 토글 3개

보드 우측 상단 `···` → **Workflows**. 아래 3개만 켜고 나머지는 끈 채로 둔다.

| Workflow | 설정 |
|---|---|
| **Item added to project** | Status → `신규` |
| **Pull request merged** | Status → `배포대기` |
| **Issue closed** | Status → `완료` |

여기에 GitHub Actions를 쓰지 말 것. 내장 워크플로로 충분하고, Actions로 하면 토큰 권한 관리가 따라붙는다.

## 4. 이슈 자동 등록

같은 Workflows 화면의 **Auto-add to project** → 저장소 `overcode-kitchen/torich-web` 선택 → 필터는 `is:issue` 로 둔다.

이제 이슈를 만들면 자동으로 보드의 `신규`에 들어간다. PR까지 보드에 넣으면 2인 팀에서는 카드가 두 배가 되어 오히려 안 보인다. 이슈만 넣는다.

## 5. 뷰 2개

- **기본 뷰(Board)**: `Group by: Status`, `Filter: milestone:v1.2.1` — 이번 배포에 집중
- **두 번째 뷰(Table)**: `Filter: -milestone:*` 로 이름 `백로그` — 마일스톤 없는 것만. 여기 쌓인 걸 다음 버전 계획 때 끌어온다

---

## 이미 세팅된 것 (CLI로 완료됨)

- 라벨 6개: `feat` `fix` `refactor` `docs` `app-update-required` `hotfix`
- 이슈 템플릿: `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`
- 마일스톤 `v1.2.1` (**due date는 배포 예정일로 직접 설정할 것** — [milestones](https://github.com/overcode-kitchen/torich-web/milestones))
- `.github/workflows/ci.yml` — PR 시 타입 체크 + 린트
- `.github/workflows/release.yml` — `v*` 태그 push 시 릴리스 노트 생성 + 마일스톤 close
- `.github/release.yml` — 릴리스 노트 라벨별 분류 규칙

## 추천 저장소 설정

**Settings → General**

- Merge button: **Squash merge만 허용**. 2인 팀에서 개인 브랜치의 중간 커밋까지 `integration`에 남길 이유가 없다.
- **Automatically delete head branches** 켜기.

**Settings → Rules → Rulesets** (선택)

`main` 브랜치에 대해 "Require status checks to pass" → `verify` 지정. 직접 push로 운영에 사고를 내는 경로를 막는다. 2인 팀이라 리뷰 필수까지는 과하다.
