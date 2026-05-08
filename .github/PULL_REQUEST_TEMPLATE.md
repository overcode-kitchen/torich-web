<!--
  PR 작성 가이드는 CONTRIBUTING.md, 운영 룰은 CLAUDE.md 참고.
-->

## 변경 사항

<!-- 무엇을, 왜 바꿨는지 1~3줄 -->

## 영향 범위 / 롤백

<!-- 배포 영향도와 롤백 방법 -->

## 호환성 체크리스트

- [ ] **Supabase 스키마 Breaking Change 없음** (컬럼 삭제·이름변경·타입변경·NOT NULL 추가·RLS 강화 X)
- [ ] **Next.js API Route Breaking Change 없음** (필드 삭제/이름변경/타입변경/경로변경 X)
- [ ] **마이그레이션 포함 시**: 작업 전 팀 공지 완료 + 타임스탬프 파일명 사용
- [ ] **마이그레이션 포함 시**: `supabase gen types` 재생성 완료
- [ ] **Edge Function 변경 시**: `supabase functions deploy <함수명>` 배포 완료
- [ ] **`capacitor.config.ts`의 `server.url`** 이 주석 처리된 상태인지 확인
- [ ] **구버전 앱 호환성** 확인 완료 (구버전 앱 + 신버전 DB 조합에서 안전한가?)
- [ ] 필수 env/설정 변경 사항 `.env.example` 에 반영
- [ ] 로컬 핵심 시나리오 테스트 완료
- [ ] (배포 직전) 스모크 체크리스트 통과 — 로그인/핵심 조회·저장/푸시 알림·딥링크
