# 네이티브 앱(OAuth) 리다이렉트 설정

iOS 앱에서 구글 로그인 시 **인앱 브라우저**로 OAuth 후 **앱으로 복귀**하는 방식입니다.

## 1. Supabase 리다이렉트 URL 허용

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Authentication** → **URL Configuration**
3. **Redirect URLs**에 추가:
   - `torich://login-callback`
   - 또는 와일드카드: `torich://**`

OAuth 완료 후 Supabase가 `torich://login-callback?code=...` 로 리다이렉트하면, OS가 토리치 앱을 엽니다.

## 2. iOS 구현 요약

- **capacitor.config.ts**: `launchUrl: 'torich://'` (참고용), **Info.plist**에 URL 스킴 `torich` 등록
- **구글 로그인 (네이티브)**: `skipBrowserRedirect: true`, `redirectTo: 'torich://login-callback'` → Supabase가 반환한 URL을 **Browser.open()**으로 인앱 브라우저에서 오픈
- **appUrlOpen** 수신 시: **Browser.close()** → **exchangeCodeForSession(code)** → `/` 또는 `/login?error=...` 로 이동

## 3. 동작 흐름

1. 앱에서 "Google로 계속하기" 탭
2. **인앱 브라우저**가 열리고 구글 로그인 진행
3. Supabase가 `torich://login-callback?code=...` 로 리다이렉트
4. OS가 토리치 앱을 열고 `appUrlOpen` 이벤트 발생
5. `AuthDeepLinkHandler`가 **Browser.close()** 후 `exchangeCodeForSession(code)` → `/` 로 이동 (실패 시 `/login?error=...`)

## 4. 에러 시

- 로그인 취소/실패 시 `torich://login-callback?error=...` 로 앱 복귀 → `/login?error=...` 로 이동

## 5. 무한 리다이렉트 / PKCE code verifier not found

- **무한 리다이렉트**: 같은 launch URL을 한 번만 처리하고, `sessionStorage`에 처리 완료 URL을 저장해 재진입 시 스킵합니다. 새로 구글 로그인을 시도하면 플래그를 비웁니다.
- **PKCE code verifier not found**: 네이티브 앱에서는 Supabase Auth 스토리지를 **Capacitor Preferences**로 두어, 인앱 브라우저 복귀 후 WebView가 다시 로드되어도 code verifier가 유지되도록 했습니다 (`utils/supabase/client.ts`에서 네이티브일 때만 적용).
- **Browser.close() "No active window"**: 콜백이 `getLaunchUrl()`(앱 콜드 스타트)로 들어온 경우에는 인앱 브라우저가 없으므로 `Browser.close()`를 호출하지 않습니다. `appUrlOpen`으로 들어온 경우에만 호출합니다.
