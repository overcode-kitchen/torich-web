#!/usr/bin/env bash
# 보드 Status를 읽어 이슈 라벨을 맞춘다. 방향은 항상 보드 → 라벨이다.
#
# 왜 필요한가:
#   보드에서 카드를 드래그해도 GitHub은 저장소 워크플로에 알려주지 않는다.
#   Projects v2의 카드 이동은 Actions 트리거로 존재하지 않기 때문이다
#   (organization 웹훅으로만 나간다). 그래서 주기적으로 훑어 맞춘다.
#
#   assign·PR 머지처럼 이벤트가 있는 경로는 sync-issue-status.sh가 즉시 처리하고,
#   이 스크립트는 드래그처럼 이벤트가 없는 경로를 뒤늦게 따라잡는 백스톱이다.
#
# 환경변수:
#   GH_TOKEN          (필수) 조직 Projects 읽기 권한이 있는 PAT
#   REPO_TOKEN        (권장) 저장소 Issues 쓰기 권한이 있는 토큰. 라벨 수정에만 쓴다.
#                     PROJECT_TOKEN은 조직 Projects 권한만 있어 gh issue edit이 통하지 않는다.
#   PROJECT_OWNER     조직명 (기본 overcode-kitchen)
#   PROJECT_NUMBER    프로젝트 번호 (기본 2)
#   DRY_RUN           1이면 바꾸지 않고 차이만 출력한다
set -euo pipefail

: "${PROJECT_OWNER:=overcode-kitchen}"
: "${PROJECT_NUMBER:=2}"
LABEL_TOKEN="${REPO_TOKEN:-${GH_TOKEN:-}}"

if [ -z "${GH_TOKEN:-}" ]; then
  echo "::warning::PROJECT_TOKEN 시크릿이 없어 동기화를 건너뛴다."
  exit 0
fi

# 열린 이슈만 대상으로 한다. 닫힌 이슈는 리스트에서 이미 구분되고,
# 상태 라벨은 닫히는 시점에 sync-issue-status.sh가 떼어낸다.
items=$(gh api graphql --paginate -f query='
  query($owner:String!, $number:Int!, $endCursor:String){
    organization(login:$owner){
      projectV2(number:$number){
        items(first:100, after:$endCursor){
          pageInfo{ hasNextPage endCursor }
          nodes{
            fieldValueByName(name:"Status"){
              ... on ProjectV2ItemFieldSingleSelectValue { name }
            }
            content{
              ... on Issue {
                number
                state
                labels(first:30){ nodes{ name } }
              }
            }
          }
        }
      }
    }
  }' -f owner="$PROJECT_OWNER" -F number="$PROJECT_NUMBER" \
  --jq '.data.organization.projectV2.items.nodes[]
        | select(.content.number != null and .content.state == "OPEN")
        | "\(.content.number)\t\(.fieldValueByName.name // "신규")\t\([.content.labels.nodes[].name] | map(select(. == "진행중" or . == "배포대기")) | join(","))"')

if [ -z "$items" ]; then
  echo "보드에 열린 이슈가 없다."
  exit 0
fi

changed=0
while IFS=$'\t' read -r number board labels; do
  [ -z "$number" ] && continue

  # 보드 상태에 대응하는 라벨. 신규·완료는 상태 라벨을 붙이지 않는다.
  case "$board" in
    진행중|배포대기) want="$board" ;;
    *)              want="" ;;
  esac

  [ "$labels" = "$want" ] && continue

  changed=$((changed + 1))
  echo "#$number  보드=$board  라벨=[${labels:-없음}] → [${want:-없음}]"

  [ "${DRY_RUN:-}" = "1" ] && continue

  # 붙어 있지도 않은 라벨을 떼려 하면 gh가 에러를 내므로, 실제로 붙은 것만 뗀다.
  args=""
  [ -n "$want" ] && args="--add-label $want"
  for l in 진행중 배포대기; do
    [ "$l" = "$want" ] && continue
    case ",$labels," in
      *",$l,"*) args="$args --remove-label $l" ;;
    esac
  done

  # shellcheck disable=SC2086
  GH_TOKEN="$LABEL_TOKEN" gh issue edit "$number" --repo "$GITHUB_REPOSITORY" $args >/dev/null 2>&1 || \
    echo "::warning::#$number 라벨 수정 실패. REPO_TOKEN(=GITHUB_TOKEN)이 넘어오는지, permissions에 issues:write가 있는지 확인할 것."
done <<< "$items"

if [ "$changed" -eq 0 ]; then
  echo "모두 일치한다. 바꿀 것 없음."
else
  echo "$changed 건 처리."
fi
