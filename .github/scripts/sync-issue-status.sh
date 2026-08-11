#!/usr/bin/env bash
# 이슈의 보드 Status와 이슈 라벨을 함께 맞춘다.
#
# 보드 Status는 Projects 안에서만 보이고, 저장소 Issues 리스트에는 나오지 않는다.
# 그래서 같은 정보를 라벨로도 복사해 둔다. 라벨은 손으로 붙이지 않는다 —
# 상태가 바뀌는 시점(assign, PR 머지, 이슈 닫힘)에 이 스크립트가 양쪽을 함께 바꾼다.
#
# 사용법:
#   sync-issue-status.sh <목표상태> <이슈번호>...
#
#   목표상태: 신규 | 진행중 | 배포대기 | 완료
#             '완료'는 보드 이동을 내장 워크플로(Item closed)가 이미 처리하므로
#             여기서는 상태 라벨만 떼어낸다.
#
# 환경변수:
#   GH_TOKEN          (필수) 조직 Projects 쓰기 권한이 있는 PAT
#   ONLY_FROM         (선택) 카드가 이 상태일 때만 옮긴다.
#                     예) assign은 '신규'일 때만 '진행중'으로 — 이미 배포대기인
#                     이슈에 담당자를 붙였다고 진행중으로 되돌리면 안 된다.
#   PROJECT_OWNER     조직명 (기본 overcode-kitchen)
#   PROJECT_NUMBER    프로젝트 번호 (기본 2)
set -euo pipefail

TARGET="${1:-}"
shift || true
ISSUES="$*"

: "${PROJECT_OWNER:=overcode-kitchen}"
: "${PROJECT_NUMBER:=2}"

# 상태를 나타내는 라벨 전체 목록. 하나만 붙어 있어야 하므로 먼저 다 떼고 다시 붙인다.
STATUS_LABELS="진행중 배포대기"

if [ -z "$TARGET" ] || [ -z "$ISSUES" ]; then
  echo "사용법: $0 <목표상태> <이슈번호>..." >&2
  exit 1
fi

# 보드 한 칸 때문에 CI가 빨개지면 안 된다. 토큰이 없으면 경고만 남기고 통과시킨다.
if [ -z "${GH_TOKEN:-}" ]; then
  echo "::warning::PROJECT_TOKEN 시크릿이 없어 상태 동기화를 건너뛴다."
  exit 0
fi

owner="${GITHUB_REPOSITORY%/*}"
repo="${GITHUB_REPOSITORY#*/}"

# --- 라벨 동기화 -------------------------------------------------------------
# 보드보다 먼저 처리한다. 라벨은 저장소 권한만 있으면 되므로,
# Projects 권한 문제로 아래가 실패하더라도 리스트에서는 상태가 보인다.
#
# ⚠️ 토큰이 다르다. PROJECT_TOKEN은 조직 Projects 권한만 가지고 발급했기 때문에
#    gh issue edit(저장소 Issues 쓰기)은 통하지 않는다. Actions가 자동으로 주는
#    GITHUB_TOKEN을 REPO_TOKEN으로 받아 라벨에만 쓴다.
LABEL_TOKEN="${REPO_TOKEN:-$GH_TOKEN}"

sync_labels() {
  local number="$1" keep="$2" args="" current=""

  [ -n "$keep" ] && args="--add-label $keep"

  # 붙어 있지도 않은 라벨을 떼려 하면 gh가 에러를 내므로, 실제로 붙은 것만 뗀다.
  current=$(GH_TOKEN="$LABEL_TOKEN" gh issue view "$number" --repo "$GITHUB_REPOSITORY" \
    --json labels --jq '[.labels[].name] | join(",")' 2>/dev/null || echo "")

  for l in $STATUS_LABELS; do
    [ "$l" = "$keep" ] && continue
    case ",$current," in
      *",$l,"*) args="$args --remove-label $l" ;;
    esac
  done

  if [ -z "$args" ]; then
    echo "#$number 라벨 그대로 (${keep:-없음})"
    return 0
  fi

  # 실패를 삼키지 않는다. 조용히 넘어가면 보드만 바뀌고 라벨은 안 바뀐 채로
  # 워크플로가 초록불이 되어, 어긋난 걸 아무도 모른다.
  # shellcheck disable=SC2086
  if GH_TOKEN="$LABEL_TOKEN" gh issue edit "$number" --repo "$GITHUB_REPOSITORY" $args >/dev/null 2>&1; then
    echo "#$number 라벨 → ${keep:-(없음)}"
  else
    echo "::warning::#$number 라벨 수정 실패. 워크플로가 REPO_TOKEN(=GITHUB_TOKEN)을 넘기는지, permissions에 issues:write가 있는지 확인할 것."
  fi
}

case "$TARGET" in
  진행중|배포대기) keep_label="$TARGET" ;;
  *)              keep_label="" ;;   # 신규·완료는 상태 라벨 없음
esac

for number in $ISSUES; do
  sync_labels "$number" "$keep_label"
done

# 완료는 보드 이동을 내장 워크플로가 처리한다. 라벨만 정리하고 끝낸다.
if [ "$TARGET" = "완료" ]; then
  exit 0
fi

# --- 보드 Status 동기화 ------------------------------------------------------
# 필드·옵션 ID는 이름으로 조회한다. 하드코딩하면 보드를 손볼 때마다 조용히 깨진다.
meta=$(gh api graphql -f query='
  query($owner:String!,$number:Int!){
    organization(login:$owner){
      projectV2(number:$number){
        id
        field(name:"Status"){
          ... on ProjectV2SingleSelectField { id options { id name } }
        }
      }
    }
  }' -f owner="$PROJECT_OWNER" -F number="$PROJECT_NUMBER")

project_id=$(echo "$meta" | jq -r '.data.organization.projectV2.id // empty')
field_id=$(echo "$meta" | jq -r '.data.organization.projectV2.field.id // empty')
option_id=$(echo "$meta" | jq -r --arg n "$TARGET" \
  '.data.organization.projectV2.field.options[]? | select(.name==$n) | .id')

if [ -z "$project_id" ] || [ -z "$option_id" ]; then
  echo "::warning::보드에서 '$TARGET' 상태를 찾지 못했다. 컬럼 이름을 바꿨다면 워크플로의 상태 이름도 함께 바꿀 것."
  exit 0
fi

for number in $ISSUES; do
  card=$(gh api graphql -f query='
    query($owner:String!,$repo:String!,$n:Int!){
      repository(owner:$owner,name:$repo){
        issue(number:$n){
          projectItems(first:20){
            nodes{
              id
              project{ id }
              fieldValueByName(name:"Status"){
                ... on ProjectV2ItemFieldSingleSelectValue { name }
              }
            }
          }
        }
      }
    }' -f owner="$owner" -f repo="$repo" -F n="$number" \
    --jq ".data.repository.issue.projectItems.nodes[]? | select(.project.id==\"$project_id\") | \"\(.id) \(.fieldValueByName.name // \"\")\"" || true)

  item_id="${card%% *}"
  current="${card#* }"

  if [ -z "$item_id" ]; then
    echo "#$number 는 보드에 없어 건너뛴다."
    continue
  fi

  # ONLY_FROM이 지정되면 그 상태에서만 옮긴다. 뒤로 되돌아가는 것을 막는다.
  if [ -n "${ONLY_FROM:-}" ] && [ "$current" != "$ONLY_FROM" ]; then
    echo "#$number 는 '$current' 상태라 건너뛴다 (ONLY_FROM=$ONLY_FROM)."
    continue
  fi

  if [ "$current" = "$TARGET" ]; then
    echo "#$number 는 이미 '$TARGET' 이다."
    continue
  fi

  gh api graphql --silent -f query='
    mutation($p:ID!,$i:ID!,$f:ID!,$o:String!){
      updateProjectV2ItemFieldValue(
        input:{projectId:$p, itemId:$i, fieldId:$f, value:{singleSelectOptionId:$o}}
      ){ projectV2Item{ id } }
    }' -f p="$project_id" -f i="$item_id" -f f="$field_id" -f o="$option_id"

  echo "#$number 보드 → $TARGET"
done
