#!/usr/bin/env bash
# Stop 훅: 작업 종료 시 타입체크를 실행해 타입 에러를 Claude 에 피드백한다.
# - stop_hook_active 가 true 면 즉시 종료 (무한 루프 방지, 필수)
# - typecheck 스크립트가 있으면 실행, 없으면 tsc --noEmit 시도, 둘 다 없으면 조용히 종료
# - 타입 에러 시 결과를 stderr 로 출력하고 exit 2 → Claude 가 피드백으로 받음
set -uo pipefail

PAYLOAD="$(cat)"

# 무한 루프 방지: stop_hook_active 가 true 면 즉시 종료 (필수)
ACTIVE="$(printf '%s' "$PAYLOAD" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{const j=JSON.parse(s);process.stdout.write(j.stop_hook_active?"1":"")}catch(e){process.stdout.write("")}})' 2>/dev/null)"
[ -n "$ACTIVE" ] && exit 0

# 프로젝트 루트로 이동
ROOT="${CLAUDE_PROJECT_DIR:-$(pwd)}"
cd "$ROOT" 2>/dev/null || exit 0
[ -f package.json ] || exit 0

# 패키지 매니저 자동 감지 (lock 파일 기준)
if [ -f pnpm-lock.yaml ]; then PM="pnpm"
elif [ -f yarn.lock ]; then PM="yarn"
elif [ -f package-lock.json ]; then PM="npm"
else PM="npm"; fi

# typecheck 스크립트 존재 확인
HAS_TC="$(node -e 'try{const p=require("./package.json");process.stdout.write((p.scripts&&p.scripts.typecheck)?"1":"")}catch(e){process.stdout.write("")}' 2>/dev/null)"

if [ -n "$HAS_TC" ]; then
  # 1순위: package.json 의 typecheck 스크립트
  case "$PM" in
    pnpm) CMD="pnpm run typecheck" ;;
    yarn) CMD="yarn typecheck" ;;
    npm)  CMD="npm run typecheck" ;;
  esac
elif [ -f tsconfig.json ]; then
  # 2순위: typecheck 스크립트가 없으면 tsc --noEmit 시도
  case "$PM" in
    pnpm) CMD="pnpm exec tsc --noEmit" ;;
    yarn) CMD="yarn tsc --noEmit" ;;
    npm)  CMD="npx --no-install tsc --noEmit" ;;
  esac
else
  # typecheck 스크립트도 tsconfig.json 도 없으면 조용히 종료
  exit 0
fi

OUTPUT="$(eval "$CMD" 2>&1)"
STATUS=$?
if [ "$STATUS" -ne 0 ]; then
  echo "타입체크 실패 — 아래 타입 에러를 확인하고 수정해 주세요:" >&2
  echo "$OUTPUT" >&2
  exit 2
fi
exit 0
