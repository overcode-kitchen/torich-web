# 네이티브 앱(OAuth) 리다이렉트 설정

iOS/Android 앱에서 구글 로그인 시, 로그인 완료 후 **앱으로 복귀**하려면 아래 설정이 필요합니다.

## 1. Supabase 리다이렉트 URL 허용

Supabase 대시보드에서 커스텀 스킴을 허용해야 합니다.

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Authentication** → **URL Configuration**
3. **Redirect URLs**에 다음을 추가:
   - `torich://auth/callback`
   - 또는 와일드카드: `torich://**`

이렇게 해야 OAuth 후 Supabase가 `torich://auth/callback?code=...` 로 리다이렉트하고, iOS/Android가 해당 URL로 앱을 엽니다.

## 2. iOS (현재 구현)

- **Info.plist**에 URL 스킴 `torich`가 등록되어 있습니다.
- 구글 로그인 시 `redirectTo: 'torich://auth/callback'` 로 열고, 앱이 열리면 `AuthDeepLinkHandler`가 `code`를 받아 세션으로 교환한 뒤 홈(또는 `next`)으로 이동합니다.

## 3. 동작 흐름

1. 앱에서 "Google로 계속하기" 탭
2. Safari(또는 인앱 브라우저)에서 구글 로그인
3. Supabase가 `torich://auth/callback?code=...` 로 리다이렉트
4. OS가 토리치 앱 실행
5. `AuthDeepLinkHandler`가 `code`로 세션 교환 후 `/` 로 이동 (실패 시 `/login?error=...`)

## 4. 에러 시

- 로그인 취소 또는 실패 시 `torich://auth/callback?error=...` 로 돌아옵니다.
- 앱이 열리고 `/login?error=...` 로 이동하므로, 필요 시 로그인 화면에서 `error` 쿼리 파라미터를 읽어 사용자에게 안내할 수 있습니다.
