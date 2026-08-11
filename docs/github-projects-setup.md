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

## 3. 자동화 토글

보드 우측 상단 `···` → **Workflows**. 아래 2개만 켜고 나머지는 끈다.

| Workflow | 설정 |
|---|---|
| **Item added to project** | Status → `신규` |
| **Item closed** | Status → `완료` |

> 🚫 **`Pull request merged`는 켜지 말 것.** 이 내장 워크플로는 **보드에 올라온 PR 카드**의 상태를 바꾼다. 우리 보드는 이슈만 올리므로(PR까지 올리면 2인 팀에 카드가 두 배가 된다) 발동할 대상이 없다. 켜두면 "동작하고 있다"고 착각하게 된다.

`진행중` → `배포대기` 이동은 [.github/workflows/board.yml](../.github/workflows/board.yml)이 처리한다. "연결된 이슈를 옮기는" 내장 워크플로가 없어서 직접 만들었다. 아래 토큰 설정이 필요하다.

### `PROJECT_TOKEN` 시크릿 (board.yml 동작에 필수)

`GITHUB_TOKEN`은 **조직 Projects에 쓸 수 없다.** 별도 PAT가 필요하다.

1. <https://github.com/settings/personal-access-tokens/new> → **Fine-grained token**
   - Resource owner: **overcode-kitchen** (개인 계정이 아니다)
   - Expiration: 1년
   - **Organization permissions** → **Projects: Read and write**
   - Repository permissions는 건드리지 않아도 된다
2. 조직 승인이 필요하다는 안내가 뜨면 Owner가 승인한다
3. <https://github.com/overcode-kitchen/torich-web/settings/secrets/actions> → **New repository secret**
   - Name: `PROJECT_TOKEN`
   - Secret: 발급받은 토큰

> **토큰이 두 개인 이유.** `PROJECT_TOKEN` 은 보드 카드를 옮기는 데만 쓴다. 이슈 **라벨** 수정은 저장소 권한이 필요하므로 Actions가 자동으로 주는 `GITHUB_TOKEN` 이 담당한다. 한쪽 권한만으로는 둘 다 못 한다 — 실제로 `PROJECT_TOKEN` 하나로 처리하려다 라벨이 조용히 안 바뀌는 문제를 겪었다.

토큰이 없어도 CI는 실패하지 않는다. 경고만 남기고 넘어가므로, 만료됐을 때 배포가 막히지는 않는다 (대신 카드가 안 움직인다).

> ⚠️ **`Closes #N`은 커밋 메시지에 쓴다.** 깃헙은 PR의 base가 기본 브랜치(`main`)일 때만 닫기 링크를 만든다. `integration` 대상 PR에서 `Closes #N`은 단순 언급으로만 남아 링크가 생기지 않는다. `board.yml`은 그래서 제목·본문·커밋 메시지를 직접 파싱하고, `main` 머지 시 이슈가 닫히는 것도 **커밋 메시지**가 담당한다.

## 4. 이슈 자동 등록

같은 Workflows 화면의 **Auto-add to project** → 저장소 `overcode-kitchen/torich-web` 선택 → 필터는 `is:issue` 로 둔다.

이제 이슈를 만들면 자동으로 보드의 `신규`에 들어간다. PR까지 보드에 넣으면 2인 팀에서는 카드가 두 배가 되어 오히려 안 보인다. 이슈만 넣는다.

## 5. 뷰 2개

- **기본 뷰(Board)**: `Group by: Status`, `Filter: milestone:"<지금 준비 중인 버전>"` — 이번 배포에 집중. 릴리스할 때마다 이 필터의 버전만 바꾼다
- **두 번째 뷰(Table)**: `Filter: -milestone:*` 로 이름 `백로그` — 마일스톤 없는 것만. 여기 쌓인 걸 다음 버전 계획 때 끌어온다

---

## 이미 세팅된 것 (CLI로 완료됨)

- 라벨: 작업 종류 6개(`feat` `fix` `refactor` `docs` `chore` `style` — 커밋 type과 동일) + 상태 2개(`진행중` `배포대기` — board.yml이 자동 관리)
- 이슈 템플릿: `.github/ISSUE_TEMPLATE/feature.yml`, `bug.yml`
- 마일스톤 `v1.3.0` — **due date는 배포 예정일로 직접 설정할 것** ([milestones](https://github.com/overcode-kitchen/torich-web/milestones)). patch 마일스톤(`v1.2.1` 등)은 급한 수정이 실제로 생겼을 때 만든다
- `.github/workflows/ci.yml` — PR 시 타입 체크 + 린트
- `.github/workflows/release.yml` — `v*` 태그 push 시 릴리스 노트 생성 + back-merge 검사 + 마일스톤 close
- `.github/release.yml` — 릴리스 노트 라벨별 분류 규칙

## 추천 저장소 설정

**Settings → General → Pull Requests**

- ☑️ **Allow squash merging** — 이슈 브랜치 → `integration` 용. 중간 커밋을 남기지 않는다
- ☑️ **Allow merge commits** — `integration` → `main`, `hotfix/*` → `main` 용
- ☐ **Automatically delete head branches** — **꺼 둔다**

> 🚫 **auto-delete를 켜면 안 된다.** 이슈 브랜치(`type/이슈번호-설명`)는 일회용이라 지워져도 되지만, **이 옵션은 머지된 PR의 head를 예외 없이 지운다.** `integration` → `main` 을 머지하면 `integration` 이 head라서 **`integration` 자체가 사라진다.** (실제로 한 번 겪었고 `main` 기준으로 복구했다.)
>
> 이슈 브랜치는 머지 화면의 **Delete branch** 버튼으로 그때그때 지운다. 클릭 한 번이라 자동화할 값어치가 없고, `integration` 을 잃는 위험이 훨씬 크다.

> ⚠️ **Squash만 허용하면 안 된다.** `integration` → `main` 을 squash로 머지하면 `main` 에 원본과 다른 새 커밋 하나가 생겨 두 브랜치가 영구히 갈라진다. 다음 릴리스마다 back-merge 충돌이 나고, `release.yml` 의 누락 검사도 계속 걸린다. **브랜치 간 머지(`integration`·`hotfix` → `main`)는 반드시 merge commit으로 한다.**

**Settings → Rules → Rulesets** (선택)

`main` 브랜치에 대해 "Require status checks to pass" → `verify` 지정. 직접 push로 운영에 사고를 내는 경로를 막는다. 2인 팀이라 리뷰 필수까지는 과하다.
