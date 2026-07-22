#!/usr/bin/env bash
# PostToolUse 훅: TS/JS 파일이 수정되면 lint 를 실행한다.
# - 대상 확장자(.ts/.tsx/.js/.jsx)가 아니면 조용히 종료
# - package.json 에 lint 스크립트가 없으면 조용히 종료 (에러 내지 않음)
# - lint 실패 시 결과를 stderr 로 출력하고 exit 2 → Claude 가 피드백으로 받음
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
[ -f package.json ] || exit 0

# lint 스크립트 존재 확인 (없으면 조용히 종료)
HAS_LINT="$(node -e 'try{const p=require("./package.json");process.stdout.write((p.scripts&&p.scripts.lint)?"1":"")}catch(e){process.stdout.write("")}' 2>/dev/null)"
[ -n "$HAS_LINT" ] || exit 0

# 패키지 매니저 자동 감지 (lock 파일 기준)
if [ -f pnpm-lock.yaml ]; then PM="pnpm"
elif [ -f yarn.lock ]; then PM="yarn"
elif [ -f package-lock.json ]; then PM="npm"
else PM="npm"; fi

# lock 파일이 있어도 그 매니저가 설치돼 있지 않을 수 있다.
# 확인 없이 실행하면 "command not found"가 lint 실패로 둔갑해,
# 있지도 않은 린트 에러를 찾게 만든다. node_modules는 이미 있으므로 npx로 폴백한다.
if ! command -v "$PM" >/dev/null 2>&1; then PM="npm"; fi

# 변경된 파일만 lint (전체 프로젝트 검사 대신 해당 파일만)
case "$PM" in
  pnpm) CMD="pnpm exec eslint \"$FILE_PATH\"" ;;
  yarn) CMD="yarn exec eslint \"$FILE_PATH\"" ;;
  npm)  CMD="npx --no-install eslint \"$FILE_PATH\"" ;;
esac

OUTPUT="$(eval "$CMD" 2>&1)"
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
  echo "lint 실패 — 아래 문제를 확인하고 수정해 주세요:" >&2
  echo "$OUTPUT" >&2
  exit 2
fi
exit 0
