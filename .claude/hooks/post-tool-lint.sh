#!/usr/bin/env bash
# PostToolUse 훅: 방금 수정된 TS/JS 파일 "하나"만 lint 한다.
# - 전체 lint(npm run lint)는 레포 전역의 기존 부채(빌드 산출물·기존 any 등)까지 끌어와
#   이번 변경과 무관한 차단을 일으키므로, 변경된 파일 하나만 검사한다.
# - 경고는 차단하지 않고 에러만 차단한다(--quiet). eslint 는 에러>0 일 때만 exit≠0.
# - 대상 확장자(.ts/.tsx/.js/.jsx)가 아니면 조용히 종료.
# - lint 에러 시 결과를 stderr 로 출력하고 exit 2 → Claude 가 피드백으로 받음.
set -uo pipefail

# stdin 으로 들어온 훅 페이로드에서 수정된 파일 경로를 추출
PAYLOAD="$(cat)"
FILE_PATH="$(printf '%s' "$PAYLOAD" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);const t=j.tool_input||{};process.stdout.write(t.file_path||t.path||"")}catch(e){process.stdout.write("")}})' 2>/dev/null)"

# 대상 확장자만 처리 (그 외에는 조용히 종료)
case "$FILE_PATH" in
  *.ts|*.tsx|*.js|*.jsx) ;;
  *) exit 0 ;;
esac

# 프로젝트 루트로 이동
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$ROOT" 2>/dev/null || exit 0

# eslint 바이너리가 없으면 조용히 종료
[ -x node_modules/.bin/eslint ] || exit 0

# 변경 파일 하나만 lint (경고는 숨기고 에러만 → 에러 있을 때만 차단)
OUTPUT="$(node_modules/.bin/eslint "$FILE_PATH" --quiet 2>&1)"
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
  echo "lint 실패 ($FILE_PATH) — 아래 문제를 확인하고 수정해 주세요:" >&2
  echo "$OUTPUT" >&2
  exit 2
fi
exit 0
