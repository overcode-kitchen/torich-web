# 알림(Notifications) 기능 상세 분석

토리치(Torich) 앱의 알림 기능 전체를 실제 구현 코드 기반으로 분석한 문서입니다. 알림함, 알림 설정, FCM 토큰 등록, 5개 Edge Function 인프라까지 한 줄씩 읽어 정리했습니다.

> 인프라 셋업(Webhook/pg_cron 등록 절차)은 [docs/notification-infra.md](../notification-infra.md)를 참조하세요. 이 문서는 **코드 동작**을 설명합니다.

---

## 1. 기능 개요 — 알림 종류

알림은 모두 `scheduled_notifications` 테이블에 행으로 예약되고, `send-push` Edge Function이 매분 폴링하여 FCM으로 발송합니다. 행을 구분하는 컬럼은 `notification_type`이며, 코드상 다음 세 가지 값이 사용됩니다.

| `notification_type` | 의미 | 생성 함수 | `record_id` |
|---|---|---|---|
| `reminder` | 납입(매수)일 리마인더 (사전 알림 포함) | `schedule-notification`, `reschedule-notifications` (둘 다 `buildNotificationRows`) | 실제 record UUID |
| `re_reminder` | 어제 납입일을 놓친 record에 대한 미완료 재알림 | `schedule-re-reminders` | 실제 record UUID |
| `service_announcement` | 운영 공지사항 푸시 | `send-announcement` | sentinel UUID `00000000-0000-0000-0000-000000000001` |
| `goal_deadline` | 목적 마감일 알림 (D-7 / D-1 / 당일) | `schedule-goal-notifications` | **`null`** (대신 `goal_id`에 목적 UUID) |

`send-push`는 `notification_type` 자체로 분기하지 않고 **`goal_id` → `record_id` 순서로 존재 여부**를 보고 GA 이벤트 라벨을 정합니다 (`goal_id` 있으면 `goal_deadline`, 없고 `record_id`가 있으면 `monthly_reminder`, 둘 다 없으면 `announcement`). 즉 `re_reminder`도 GA상으로는 `monthly_reminder`로 집계됩니다.

### 1.1 목적 마감일 알림 (`goal_deadline`)

`schedule-goal-notifications`가 pg_cron으로 매일 KST 00:20에 돌면서, 아래 조건을 모두 만족하는 목적을 찾아 **그날 발송할 알림만** 예약합니다.

- `target_date`가 있고, 오늘로부터 **7일 / 1일 / 0일** 남음
- `notification_enabled = true`, `archived_at IS NULL`, `completed_at IS NULL`
- 소유 사용자의 `notification_global_enabled`가 `false`가 아님 (`user_settings` 행이 없으면 기본 ON으로 간주)

record 알림과 다른 점:

| | record 알림 | 목적 마감일 알림 |
|---|---|---|
| 예약 시점 | 납입일 전체를 미리 선예약 | **당일 것만** 매일 예약 |
| 주말·공휴일 보정 | `notification_skip_weekend_holiday` 적용 | **적용하지 않음** — 마감일은 고정 날짜라 다음 영업일로 미루면 마감일을 넘겨 알리게 됨 |
| 사전 알림 설정 | `notification_pre_reminder` 따름 | 고정 D-7/D-1/당일 (목적 수정 화면 안내 문구와 일치) |
| 중복 방지 | `upsert(onConflict: record_id,scheduled_at,token)` | 기존 행을 조회해 **코드에서 필터 후 insert** (partial unique index는 PostgREST `onConflict`로 지정 불가) |
| 취소 처리 | `send-push`가 `records.notification_enabled = false`인 행 삭제 | `send-push`가 알림 OFF·보관·달성된 목적의 pending 행 삭제 (동일 패턴) |

> 본문에 진척률(`62% 모았어요`)은 넣지 않았습니다. 진척 계산이 클라이언트(`useGoalProgress`)에만 있어 서버(Deno)에 중복 구현하면 두 값이 어긋날 수 있기 때문입니다. 필요하면 계산을 공용화한 뒤 별도로 추가합니다.

> 코드상 또 다른 타입 흔적: `user_settings.notification_streak_enabled` 컬럼이 DB에는 존재하나(`database.types.ts:334`), 클라이언트 설정 상태(`NotificationSettingsState`)와 Edge Function 어디에서도 사용되지 않습니다. 미연동/레거시 컬럼입니다.

---

## 2. 클라이언트 알림 설정

알림 설정은 두 레벨로 나뉩니다.

- **전역 on/off** (`user_settings.notification_global_enabled`) — `useGlobalNotification` 훅, `/settings`의 "전체 알림" 스위치
- **상세 설정** (`/settings/notifications` 페이지) — 기본 시간, 사전 알림, 미완료 재알림, 주말·공휴일 보정, 공지 푸시
- **레코드별 on/off** (`records.notification_enabled`) — `useNotificationToggle`, 투자 상세 화면 (3·5절에서 다룸)

### 2.1 상세 설정 화면 구조

`/settings/notifications` (`app/settings/notifications/page.tsx`)는 `useNotificationSettings` 훅의 값/액션을 그대로 `NotificationSettingsView`에 전달합니다. 뷰는 두 섹션으로 구성됩니다.

- **투자 리마인더** 섹션 (`NotificationReminderSection.tsx`)
  - **기본 알림 시간** — `TimePicker`, `defaultTime` (예 `'09:00'`)
  - **기본 사전 알림** — 드롭다운, `PreReminderOption`
  - **미완료 재알림** — `Switch`, `reReminderOn`
  - **주말·공휴일은 다음 평일에** — `Switch`, `skipWeekendHolidayOn`
- **서비스 알림** 섹션 (`NotificationServiceSection.tsx`)
  - **공지사항 푸시** — `Switch`, `serviceAnnouncementsOn`. 설명: "OFF로 설정하면 인앱 알림함에서만 확인할 수 있어요." (단, 4절 참고 — 현재 인앱 알림함은 스텁)

### 2.2 사전 알림 옵션 — 6종 (프롬프트의 4종보다 많음)

`PreReminderOption`은 `app/hooks/types/useNotificationSettings.ts:1`에 다음 6개로 정의됩니다.

```
'none' | 'same_day' | '1d' | '2d' | '3d' | '1w'
```

UI 라벨 (`NotificationReminderSection.tsx:27-34`): `없음 / 당일 / 1일 전 / 2일 전 / 3일 전 / 1주일 전`.

> 주의: 프롬프트에는 `none/1d/3d/1w`만 언급되어 있으나 **실제 코드는 `same_day`(당일), `2d`(2일 전)도 지원**합니다. Edge Function `parsePreReminderToDays`도 이 6종을 모두 일수로 변환합니다 (5절).

### 2.3 상태 모델과 기본값

`NotificationSettingsState` (`app/hooks/types/useNotificationSettings.ts:3-9`)와 기본값 (`app/utils/notification-settings.ts:4-10`):

| 상태 키 | 기본값 | DB 컬럼 |
|---|---|---|
| `defaultTime` | `'09:00'` | `notification_default_time` |
| `preReminder` | `'1d'` | `notification_pre_reminder` |
| `reReminderOn` | `true` | `notification_re_reminder_enabled` |
| `serviceAnnouncementsOn` | `true` | `notification_service_announcement_enabled` |
| `skipWeekendHolidayOn` | `false` | `notification_skip_weekend_holiday` |

전역 토글(`notification_global_enabled`)은 이 상태 모델에 포함되지 않고 별도 훅(`useGlobalNotification`)이 관리합니다.

### 2.4 저장 흐름 (user_settings)

**로드** — `useNotificationSettingsData` (`app/hooks/notification/useNotificationSettingsData.ts`):
- `userId`가 없으면 `loading=false`로 종료.
- `user_settings`에서 `select('*').eq('user_id', userId).single()`.
- 에러 코드가 `PGRST116`(행 없음)이 **아닐 때만** 토스트 에러 노출 → 신규 유저(행 없음)는 조용히 기본값 사용.
- 데이터가 있으면 `mapDbDataToSettings`로 변환. 각 컬럼은 `?? 기본값`/`|| 기본값`으로 null-방어 (`notification-settings.ts:15-23`).

**저장** — `useNotificationSettings` (`app/hooks/notification/useNotificationSettings.ts`):
- `updateSettings`/`createToggle`이 **낙관적 업데이트** 방식. 로컬 상태를 먼저 바꾸고 동시에 `updateDB(partial)` 호출 (`useNotificationSettings.ts:30-46`).
- `updateDB`는 변경된 부분만 `mapSettingsToDbUpdates`로 컬럼 매핑 후 `user_settings.upsert(updates, { onConflict: 'user_id' })` (`useNotificationSettings.ts:16-28`). `upsert`이므로 신규 유저 첫 변경 시 행이 생성됨.
- 실패 시 `toastError(TOAST_MESSAGES.notificationSettingsSaveFailed)`. (단, **로컬 상태 롤백은 없음** — 낙관적 업데이트만 하고 실패 시 토스트만 띄움. `useGlobalNotification`/`useNotificationToggle`과 달리 되돌리지 않음.)
- 토글 3종(`toggleReReminder`, `toggleServiceAnnouncements`, `toggleSkipWeekendHoliday`)은 `createToggle`로 생성되어 boolean을 반전 후 저장.

**이 저장이 Edge Function을 깨우는 지점**: `user_settings`의 UPDATE는 Database Webhook → `reschedule-notifications`를 호출합니다(9절). 단 그 함수는 `notification_default_time` 또는 `notification_pre_reminder`가 실제로 바뀐 경우에만 재예약하고, 재알림/공지/주말보정 토글만 바꾼 경우엔 `old_record` 비교로 스킵합니다(`reschedule-notifications/index.ts:64-76`).

### 2.5 전역 on/off (useGlobalNotification)

`app/hooks/notification/useGlobalNotification.ts`:
- 마운트 시 `user_settings.notification_global_enabled`를 조회, 기본 `true`.
- `toggleNotification`: 상태 반전 → `user_settings.upsert({ user_id, notification_global_enabled: next }, { onConflict: 'user_id' })`.
- 실패 시 **롤백**(`setNotificationOn(!next)`) + 토스트.
- **ON으로 바뀌면 `registerFCMToken(user)`를 즉시 호출** (`useGlobalNotification.ts:52-55`) — 켜는 순간 토큰 등록을 보장.
- 사용처: `/settings` 페이지의 "전체 알림" 스위치(`SettingsView.tsx:109-117`), 투자 상세 뷰(`InvestmentDetailView.tsx:57`, 전역 OFF면 레코드별 토글을 가리는 용도).

---

## 3. FCM 토큰 등록 (useFCMToken, NotificationProvider)

### 3.1 NotificationProvider — 마운트와 권한

`providers/NotificationProvider.tsx`는 `app/layout.tsx:75`에서 앱 전체를 감쌉니다(`AuthProvider > ThemeProvider > NotificationProvider > InvestmentsProvider`). 두 개의 `useEffect`로 동작합니다.

**Effect 1 — 네이티브 권한 + 리스너 (1회, user 무관)** (`NotificationProvider.tsx:24-80`):
- `Capacitor.isNativePlatform()`이 아니면 즉시 return (웹은 권한/리스너 셋업 안 함).
- `track("notification_permission_prompt")` → `FirebaseMessaging.requestPermissions()`.
- `permission.receive !== 'granted'`이면 `track("notification_permission_denied")` 후 종료.
- 허용 시 `track("notification_permission_granted")`.
- `PushNotifications.removeAllListeners()` 후 두 리스너 등록: `pushNotificationReceived`, `pushNotificationActionPerformed` — **둘 다 현재 `console.log`만 하고 화면 이동/딥링크 처리는 없음**.
- 성공 시 `setPushReady(true)`. cleanup에서 `cancelled=true`, `setPushReady(false)`, 리스너 제거.

**Effect 2 — 로그인 사용자 FCM 등록** (`NotificationProvider.tsx:83-93`):
- `user?.id`가 없으면 return.
- 네이티브인데 `pushReady`가 아직 false면 return (권한/리스너 준비를 기다림).
- 조건 충족 시 `registerFCMToken(u)` 호출. 의존성은 `[user?.id, pushReady, registerFCMToken]`.

즉 토큰 등록 경로는 NotificationProvider 한 곳으로 통합되어 있고(주석 `useFCMToken.ts:19`), 추가로 전역 알림을 켤 때 `useGlobalNotification`에서도 호출됩니다.

### 3.2 useFCMToken — 등록 게이트

`app/hooks/notification/useFCMToken.ts`의 `registerFCMToken(user)`:
1. `user`가 없으면 false.
2. `isGlobalNotificationEnabled(user)`가 false면 등록 스킵 (전역 OFF면 토큰을 저장하지 않음).
3. `Capacitor.isNativePlatform()`로 플랫폼 결정: 네이티브 → `'ios'`, 아니면 `'web'`.
4. `deviceId`: 네이티브는 `getNativeDeviceId()`, 웹은 `getOrCreateWebDeviceId()`.
5. 토큰: 네이티브는 `getNativeFCMToken()`, 웹은 `getWebFCMToken()`.
6. 토큰 없으면 false. 있으면 `saveTokenToDB(...)`.

### 3.3 토큰/디바이스 ID 획득 (app/utils/fcm-token.ts)

> `useFCMToken`은 얇은 래퍼이며 실제 로직은 `app/utils/fcm-token.ts`에 있습니다 (프롬프트 목록 외 파일이지만 핵심).

- **`getNativeDeviceId`** — `@capacitor/device`의 `Device.getId().identifier`. 실패 시 `generateUUID()`.
- **`getOrCreateWebDeviceId`** — `localStorage['device_id']` 재사용, 없으면 UUID 생성·저장. SSR(`window` 없음) 시 임시 UUID.
- **`getNativeFCMToken`** — `PushNotifications.register()` 후 `FirebaseMessaging.getToken().token`.
- **`getWebFCMToken`** — `Notification.requestPermission()` → 미허용 시 null. `getMessaging(app)` 초기화 후, **`NEXT_PUBLIC_FIREBASE_VAPID_KEY`가 없으면 조용히 null 반환** (웹 푸시 미사용 시). 있으면 `getToken(messaging, { vapidKey })`.
- **`generateUUID`** — `crypto` 미사용, `Math.random` 기반 UUID v4 문자열.

### 3.4 DB 저장 (saveTokenToDB)

`fcm-token.ts:121-159`:
- **중복 호출 스킵**: 모듈 변수 `lastSavedPushFingerprint`가 `userId|deviceId|token`과 같으면 DB 호출 없이 true 반환 (Capacitor 브리지/네트워크 절약).
- `user_push_tokens.upsert({ user_id, token, platform, device_id }, { onConflict: 'user_id, device_id' })` — **유저+디바이스 조합당 1행**. 같은 디바이스에서 토큰이 갱신되면 token 컬럼이 덮어써짐.
- 성공 시 fingerprint 갱신.

`firebase.ts`는 `firebaseConfig`(전부 `NEXT_PUBLIC_FIREBASE_*` 환경변수)로 앱을 1회 초기화하고 `app`을 export. 중복 초기화 방지(`getApps().length === 0`).

### 3.5 분석 이벤트

`track`(`app/lib/analytics.ts`)은 GA4로 보내는 얇은 래퍼이며 별도 이벤트 enum이 없습니다. 알림 관련으로 호출되는 이벤트:
- `notification_permission_prompt` / `notification_permission_granted` / `notification_permission_denied` — NotificationProvider 권한 흐름.
- `notification_open` (`{ source: 'push' | 'in_app' }`) — 알림함 페이지 진입 시 (`app/notifications/page.tsx:54-57`, URL `?source=push`면 push).
- `notification_sent` — **서버사이드**, `send-push`가 발송 성공 시 GA Measurement Protocol로 직접 전송(6절).

---

## 4. 알림함 (useNotificationInbox) — 현재 스텁

**현재 인앱 알림함은 완전한 스텁입니다.** 실제 알림 데이터를 가져오지 않습니다.

`app/hooks/notification/useNotificationInbox.ts`:
- `NotificationItem` 타입(`id, title, body?, readAt?, createdAt`)과 `formatNotificationTime`(상대 시간 포맷) 유틸 제공.
- `useNotificationInbox()`는 **항상 `{ notifications: [], unreadCount: 0 }`를 반환** (`useNotificationInbox.ts:35-39`). 주석: "스텁: 실제 API 없음. 추후 연동 시 여기서 fetch/구독".

이 스텁의 영향:
- **`/notifications` 페이지** (`app/notifications/page.tsx`) — `notifications`가 항상 비어 있어 "아직 알림이 없어요" 빈 상태만 표시. 단, **개발 환경(`NODE_ENV==='development'`)에서 `?demo=1`** 쿼리면 하드코딩된 `MOCK_NOTIFICATIONS` 3건을 보여줌. "알림 예시보기" 버튼도 dev에서만 노출.
- **대시보드 종 아이콘** (`app/components/DashboardSections/NotificationInbox.tsx`) — `unreadCount`가 항상 0이라 빨간 배지가 절대 표시되지 않음. 클릭 시 `/notifications`로 이동.

> 즉 "공지 OFF면 인앱 알림함에서만 확인"이라는 설정 설명(2.1)은 **아직 구현되지 않은 미래 동작**입니다. 현재는 알림함에 아무것도 쌓이지 않습니다. 추후 연동 시 이 훅만 수정하면 페이지·배지가 함께 동작하도록 설계되어 있습니다.

---

## 5. 알림 예약 흐름 (Edge Function 5종)

모든 함수는 `Deno.serve`로 구동되며 `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`로 service-role 클라이언트를 만듭니다. 예약 로직은 `_shared/notification-schedule.ts`에 공통화되어 있습니다.

### 5.0 공통 모듈 핵심 함수 (`_shared/notification-schedule.ts`)

**`generatePaymentDates(startDate, periodYears, investmentDays)`** (`:92-115`):
- `effectivePeriodYears = periodYears > 0 ? periodYears : HABIT_DEFAULT_YEARS(=10)` — **적립형(period_years null/0)은 10년 치를 선예약**하고 reschedule 잡으로 갱신.
- `start`부터 `addYears(start, effectivePeriodYears)` 전까지 월 단위로 순회하며, 각 달의 `investmentDays`(예 `[15, 25]`)에 대해 `isValidDate`로 실재 날짜만 push (2월 30일 등 무효 날짜 제외). 정렬 후 반환.

**`parsePreReminderToDays(preReminder)`** (`:153-162`) — 사전 알림 문자열 → 일수:
```
'none' | 'same_day' | '0'  → 0
'1d'   | '1'               → 1
'2d'   | '2'               → 2
'3d'   | '3'               → 3
'1w'   | '7'               → 7
그 외 숫자 파싱, 실패 시 0 (음수는 0으로 clamp)
```
즉 `none`과 `same_day`는 둘 다 0일(당일)로 취급되며, 발송 타이틀/본문에서만 "오늘 매수일" 문구로 갈립니다.

**`calculateScheduledAt(paymentDateStr, preReminder, defaultTime, skipWeekendHoliday=false)`** (`:168-184`):
- `baseDate = paymentDate − preDays`.
- `skipWeekendHoliday`이면 `baseDate`(YYYY-MM-DD)를 `adjustToNextBusinessDateStringKST`로 보정(10절). 보정되면 그 날짜로 교체.
- `setTime(baseDate, defaultTime)`로 시·분·초 설정. **이 값은 KST로 해석되는 Date**.

**`kstToUTC(kstDate)`** (`:61-65`) — 시간에서 9시간(KST_OFFSET_HOURS)을 빼서 UTC Date로 변환. 예약은 항상 UTC ISO 문자열로 저장.

**`buildNotificationRows(record, userSettings, tokens, existingScheduledAts, now)`** (`:190-246`) — 한 record의 예약 행 목록:
1. `generatePaymentDates`로 납입일 전부 산출.
2. `isShareMode = unit_type==='shares' && monthly_shares>0`로 금액/주수 분기.
3. 타이틀: `preDays===0`이면 `오늘 "{title}" 매수일이에요`, 아니면 `"{title}" 매수일이 {preDays}일 남았어요`.
4. 각 납입일마다 `calculateScheduledAt` → `kstToUTC` → ISO 문자열(`scheduledAtUTCStr`).
   - **`scheduledAtUTC <= now`이면 skip** (과거 시각 제외).
   - **`existingScheduledAts.has(scheduledAtUTCStr)`이면 skip** (이미 예약된 시각 제외).
5. 본문: 금액/주수 텍스트가 있으면 `오늘 {M월 D일}이 매수일이에요. {금액} 매수 잊지 마세요!`(당일) / `{preDays}일 뒤인 {M월 D일}에 {금액} 매수 예정이에요`. 금액이 없으면 `{M월 D일} 매수일을 확인해 주세요`.
6. **토큰마다 한 행씩** 생성 (`status: 'pending'`, `notification_type: 'reminder'`).
   - 금액 포맷: `formatAmountForPush` — `N억 N만원`/`N만원`/`N원` (`:124-141`).

### 5.1 schedule-notification (records INSERT/UPDATE)

- **트리거**: Database Webhook — `records` 테이블 **Insert** 및 **Update** (notification-infra.md Webhook 1·2). 헤더 `Authorization: Bearer <SERVICE_ROLE_KEY>`.
- **입력**: 웹훅 payload `record`(id, user_id, title, start_date, period_years, investment_days, notification_enabled?, monthly_amount?, unit_type?, monthly_shares?).
- **로직** (`schedule-notification/index.ts`):
  1. payload·record 검증. `notification_enabled === false`면 예약 스킵하고 200 (`:72-78`). → 레코드별 알림 OFF면 새 예약 안 함.
  2. `investment_days`가 비었거나 배열 아니면 200 스킵.
  3. `user_settings`에서 `notification_global_enabled, notification_default_time, notification_pre_reminder, notification_skip_weekend_holiday` 조회. 설정 없으면 200, **전역 OFF면 200 스킵**.
  4. 기존 `scheduled_notifications`의 `(record_id, scheduled_at)`를 `existingScheduledAts` Set으로 수집 (중복 회피용).
  5. `user_push_tokens` 조회. 없으면 200 스킵.
  6. `buildNotificationRows(...)`로 행 생성. 0건이면 200(All duplicates).
  7. `scheduled_notifications.upsert(notifications, { onConflict: 'record_id,scheduled_at,token', ignoreDuplicates: true })`.
- **출력**: `{ success, scheduled_count }`.
- **핵심**: 알림 OFF→ON으로 UPDATE되면 이 함수가 재호출되어 재예약됨(Update 웹훅). OFF로 끄는 처리는 이 함수가 아니라 클라이언트(`useNotificationToggle`)가 pending 행을 삭제(2·11절).

### 5.2 reschedule-notifications (user_settings UPDATE) — 9절에서 상세

### 5.3 schedule-re-reminders (pg_cron) — 7절에서 상세

### 5.4 send-announcement (service_announcements INSERT) — 8절에서 상세

---

## 6. 발송 흐름 (send-push)

- **트리거**: **pg_cron 매분 폴링** (`*/1 * * * *` 권장; 함수 상단 주석 `send-push/index.ts:2` "pg_cron으로 1분마다 호출"). pg_net으로 함수 HTTP 호출.
- **필수 env**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`. **옵셔널**: `GA_MEASUREMENT_ID`, `GA_API_SECRET`(둘 다 있을 때만 GA 송신).
- **로직** (`send-push/index.ts`):
  1. env 검증. `FIREBASE_SERVICE_ACCOUNT_JSON`을 `JSON.parse`로 유효성 검사.
  2. `getGoogleAccessToken(serviceAccountJson)` — `google_jwt_sa` 라이브러리로 scope `firebase.messaging`의 OAuth2 access token 발급 (`:41-53`).
  3. **조회**: `scheduled_notifications`에서 `status='pending'` AND `scheduled_at <= now()` 인 행을 `scheduled_at` 오름차순 **최대 100건** (`:160-166`). → 한 번 실행에 100건 상한.
  4. **OFF된 record 정리**: 조회된 행의 `record_id`(null/빈 문자열 제외)를 모아 `records`에서 `notification_enabled=false`인 id를 찾고, 그 record들의 pending 행을 **삭제**한 뒤 발송 대상에서 제외 (`:187-219`). record_id가 없는 공지(sentinel)·null은 그대로 발송.
  5. **발송 루프**: 각 알림을 `sendFCMPush(projectId, accessToken, token, title, body)`로 FCM HTTP v1 (`https://fcm.googleapis.com/v1/projects/{projectId}/messages:send`, body `{ message: { token, notification: { title, body } } }`).
     - 성공 → `status='sent', sent_at=now()` 업데이트, `results.sent++`. 이후 GA `notification_sent` 송신(아래).
     - 실패 → `status='failed'` 업데이트, `results.failed++`. **무효/만료 토큰이면 `user_push_tokens`에서 해당 token 삭제** (`:308-324`).
     - 예외(throw) → `status='failed'`로 처리.
- **무효 토큰 판정** (`isTokenInvalidFcmError`, `:26-35`): FCM 에러 `status`가 `NOT_FOUND`/`UNREGISTERED`이거나, `INVALID_ARGUMENT`이면서 `details[].errorCode`가 `UNREGISTERED`/`INVALID_ARGUMENT`일 때 true. 파싱 실패 시 토큰 삭제하지 않음(보수적).
- **GA4 이벤트** (`:269-288`): `gaMeasurementId && gaApiSecret`일 때만. `record_id`가 있으면 `notification_type: 'monthly_reminder'`, 없으면 `'announcement'`. `sendGAEvent`로 Measurement Protocol 송신, **실패해도 try/catch로 메인 흐름 영향 없음**. (`re_reminder`도 record_id가 있으므로 GA상 `monthly_reminder`.)
- **출력**: `{ success, processed_count, sent, failed }`.

`sendGAEvent` (`_shared/ga-mp.ts`): `rawUserId`를 SHA-256 해시하여 `client_id`/`user_id` 양쪽에 사용, 모든 이벤트에 `platform: 'server'`, `engagement_time_msec: '1'` 자동 포함. 비-200 응답 시 throw.

---

## 7. 재알림 (schedule-re-reminders)

- **트리거**: **pg_cron 매일 KST 00:10 (UTC 15:10)** → cron `10 15 * * *` (함수 주석 및 notification-infra.md 6.2).
- **로직** (`schedule-re-reminders/index.ts`):
  1. `yesterdayStr = getYesterdayKSTString(now)` — 현재 UTC를 KST로 보정 후 하루 빼서 어제 날짜(KST, YYYY-MM-DD) 산출 (`:22-26`).
  2. `records`에서 `notification_enabled=true`인 행 전부 조회 (`id, user_id, title, start_date, period_years, investment_days, unit_type, monthly_shares`).
  3. **어제가 유효 납입일인 record만 필터**: 각 record에 `generatePaymentDates`를 돌려 `toDateString(d) === yesterdayStr`인 날짜가 있는지 확인 (`:103-113`). (`toDateString`은 로컬 날짜 기준 포맷이며, `generatePaymentDates`가 로컬 자정 Date를 만들므로 KST 환경에서 일치.)
  4. **완료 판정**: `payment_history`에서 `payment_date=yesterdayStr` AND `record_id in (대상)` 조회 → `completedRecordIds` Set. 여기 없는 record만 `missedRecords`로 유지 (`:129-149`).
  5. **유저 설정 게이트**: `missedRecords`의 user들의 `user_settings` 조회. `notification_global_enabled===true` **그리고** `notification_re_reminder_enabled===true`인 user만 `enabledUserIds`에. 각 user의 `defaultTime`(없으면 `'09:00'`), `skipWeekendHoliday` 저장 (`:165-200`).
  6. `user_push_tokens` 조회(대상 user만), user별 토큰 맵 구성.
  7. **재알림 행 생성** (`:239-275`): 발송 시각은 **오늘(KST)** `defaultTime`. `skipWeekendHoliday`면 `adjustToNextBusinessDateStringKST(todayKSTStr)`로 보정한 날짜에 발송. `getKSTDateTimeAsUTC(sendDateStr, defaultTime)`로 UTC 변환.
     - 본문: 주수 모드면 `{title} - 어제 {monthly_shares}주 매수일을 놓치셨어요. 오늘 완료해 주세요.`, 아니면 `{title} - 매수일이 지났어요. 오늘 완료해 주세요.`
     - 타이틀은 record `title` 그대로. 토큰마다 한 행, `notification_type: 're_reminder'`.
  8. **배치 upsert** (`BATCH_INSERT_SIZE=500`): `onConflict: 'record_id,scheduled_at,token', ignoreDuplicates: true`.
- **출력**: `{ success, scheduled_count, records_with_re_reminder, yesterday }`.
- 각 단계에서 대상 0건이면 일찍 200 반환(`records_checked` 포함).

---

## 8. 공지 (send-announcement)

- **트리거**: Database Webhook — `service_announcements` **Insert** (notification-infra.md Webhook 4). 운영자가 SQL Editor에서 `insert into service_announcements (title, body) values (...)` 실행 시 발화.
- **입력**: payload `record`(id, title, body?, created_at).
- **로직** (`send-announcement/index.ts`):
  1. `record.id`·`record.title` 없으면 400. `bodyText = body ?? ''`, `scheduledAt = created_at ?? now()` → **공지는 생성 즉시(과거 시각) 예약되므로 다음 매분 폴링에서 바로 발송**.
  2. `user_settings`에서 `notification_global_enabled=true` **AND** `notification_service_announcement_enabled=true`인 `user_id` 전부 조회 (`:54-58`). → 공지 푸시 ON + 전역 ON 유저만.
  3. 대상 user들의 `user_push_tokens` 조회. 없으면 200.
  4. **sentinel record_id** `ANNOUNCEMENT_RECORD_ID_SENTINEL = '00000000-0000-0000-0000-000000000001'` (`:10`)로 행 생성. 토큰마다 한 행, `notification_type: 'service_announcement'`.
  5. **배치 upsert** (500): `onConflict: 'record_id,scheduled_at,token', ignoreDuplicates: true`.
- **출력**: `{ success, announcement_id, scheduled_count }`.
- **sentinel의 의미**: `record_id`가 실제 record가 아닌 고정 UUID라서, `send-push`의 "OFF된 record 정리" 로직(`records`에서 조회)에 걸리지 않고(존재하지 않는 id), GA 라벨은 `announcement`로 분류됨. `scheduled_notifications.record_id`는 nullable이며 goals FK만 가짐(`goal_id`) — record FK 제약은 없어 sentinel 삽입 가능.

---

## 9. 재예약 (reschedule-notifications)

- **트리거**: Database Webhook — `user_settings` **Update** (notification-infra.md Webhook 3).
- **로직** (`reschedule-notifications/index.ts`):
  1. `record.user_id` 없으면 400.
  2. **변경 감지(선택적 최적화)**: `old_record`가 있으면 `notification_default_time` 또는 `notification_pre_reminder`가 실제 바뀌었는지 비교. **둘 다 안 바뀌었으면 스킵**하고 200 (`:64-76`). → 재알림/공지/주말보정 토글만 바꾼 경우 재예약 안 함.
  3. `user_settings`에서 4개 컬럼(global/default_time/pre_reminder/skip_weekend_holiday) 재조회. **전역 OFF면 스킵** 200.
  4. 해당 유저의 `records` 중 `notification_enabled=true`인 행 조회. `investment_days` 유효한 것만 `validRecords`.
  5. **유효 record가 0건이면**: 해당 유저의 pending 알림을 전부 삭제하고 200 (재예약할 게 없으니 정리만).
  6. **배치 삭제**: `scheduled_notifications`에서 `user_id=userId AND status='pending'` 전부 삭제 (`:159-163`). → 기존 예약을 싹 지우고 새로 만드는 방식.
  7. `user_push_tokens` 없으면 0건 예약 완료 200.
  8. 각 `validRecords`에 `buildNotificationRows(...)`(공통 `existingScheduledAts`/`now` 공유)로 행 누적.
  9. **배치 upsert** (500): `onConflict: 'record_id,scheduled_at,token', ignoreDuplicates: true`.
- **출력**: `{ success, scheduled_count, records_processed }`.
- **주의(코드 vs buildNotificationRows)**: 이 함수의 `scheduleRecord` 구성(`:194-204`)에는 `unit_type`/`monthly_shares`를 **넣지 않습니다**(주석상 `monthly_amount`까지만 매핑). 따라서 재예약된 reminder 본문은 주수 모드여도 금액 모드 문구로 생성됩니다. (반면 `schedule-notification`은 unit_type/monthly_shares를 모두 전달.) — 코드 그대로의 동작이며, 재예약 트리거가 시간/사전알림 변경에 한정되어 영향은 제한적.

---

## 10. 주말/공휴일 처리 (korean-holidays)

`_shared/korean-holidays.ts` — KST(UTC+9) 기준 영업일 보정.

- **공휴일 데이터**: `KOREAN_HOLIDAYS_KST`는 `YYYY-MM-DD` 문자열 `Set`. **2026~2030년**까지 하드코딩(대체공휴일 포함). 주석: "매년 말 다음 해 공휴일을 추가해 주어야 한다" → **2031년 이후는 공휴일 미반영(주말만 보정)**, 운영상 연 1회 갱신 필요.
- **`isWeekendKST(date)`** — KST 보정 후 요일 0(일)/6(토).
- **`isKoreanHoliday(date)`** — `toKSTDateString` 후 Set 조회.
- **`isNonBusinessDayKST`** = 주말 OR 공휴일.
- **`adjustToNextBusinessDayKST(date)`** — 비영업일이면 다음 영업일까지 하루씩 +UTCDate. **최대 14일 탐색**(연속 공휴일+주말 안전 마진), 시·분·초 보존.
- **문자열 버전** (예약 로직이 실제 사용): `isNonBusinessDateStringKST(dateStr)`, `adjustToNextBusinessDateStringKST(dateStr)` — `YYYY-MM-DD` 입력, 비영업일이면 다음 영업일 문자열 반환, 14일 상한. `Date.UTC(y, m-1, d)`로 요일을 계산해 KST 요일과 일치시킴.

**연결 지점**: `calculateScheduledAt`(reminder)과 `schedule-re-reminders`(재알림)가 `skipWeekendHoliday=true`일 때 `adjustToNextBusinessDateStringKST`를 호출. 사용자의 `notification_skip_weekend_holiday` 설정으로 on/off.

---

## 11. 중복 방지 제약

- **DB Unique 제약**: `scheduled_notifications`에 `(record_id, scheduled_at, token)` UNIQUE가 **반드시** 필요 (notification-infra.md §4). 제약 이름 권장: `scheduled_notifications_record_id_scheduled_at_token_key`.
- **`ignoreDuplicates`**: 모든 예약 함수(`schedule-notification`, `reschedule-notifications`, `schedule-re-reminders`, `send-announcement`)가 `upsert(rows, { onConflict: 'record_id,scheduled_at,token', ignoreDuplicates: true })` 사용. 웹훅 재시도·동시 호출로 같은 조합이 들어와도 **23505 위반 없이 조용히 무시**.
- **함수 내부 추가 방어**: `buildNotificationRows`는 호출 전 `existingScheduledAts` Set으로 이미 예약된 시각을 미리 거르고, 과거 시각도 제외(5.0절 4단계).
- 즉 **DB 제약(필수) + ignoreDuplicates(앱) + Set 사전필터(함수)** 3중으로 중복을 막습니다. (`record_id`가 sentinel/실제값이고 scheduled_at·token 조합이 같으면 1행.)

---

## 12. 사용 훅·함수 표

| 훅/함수 | 파일 | 역할 |
|---|---|---|
| `useNotificationSettings` | `app/hooks/notification/useNotificationSettings.ts` | 상세 설정 상태 + 저장 액션(낙관적 upsert) |
| `useNotificationSettingsData` | `app/hooks/notification/useNotificationSettingsData.ts` | user_settings 로드 → state |
| `useGlobalNotification` | `app/hooks/notification/useGlobalNotification.ts` | 전역 on/off, ON 시 토큰 등록 |
| `useNotificationToggle` | `app/hooks/notification/useNotificationToggle.ts` | 레코드별 `records.notification_enabled` 토글, OFF 시 pending 삭제 |
| `useFCMToken` | `app/hooks/notification/useFCMToken.ts` | 토큰 발급·저장 오케스트레이션(게이트) |
| `useNotificationInbox` | `app/hooks/notification/useNotificationInbox.ts` | **스텁** (빈 배열). + `formatNotificationTime` 유틸 |
| `NotificationProvider` | `providers/NotificationProvider.tsx` | 권한 요청/리스너 + 로그인 시 토큰 등록 |
| `mapDbDataToSettings`/`mapSettingsToDbUpdates` | `app/utils/notification-settings.ts` | DB↔state 매핑, `defaultNotificationSettings` |
| `saveTokenToDB`/`getWebFCMToken`/`getNativeFCMToken`/`isGlobalNotificationEnabled` | `app/utils/fcm-token.ts` | 토큰 획득·저장·전역설정 확인 |
| `buildNotificationRows`/`generatePaymentDates`/`calculateScheduledAt`/`parsePreReminderToDays`/`kstToUTC` | `supabase/functions/_shared/notification-schedule.ts` | 공통 예약 로직 |
| `adjustToNextBusinessDateStringKST` 등 | `supabase/functions/_shared/korean-holidays.ts` | 영업일 보정 |
| `sendGAEvent` | `supabase/functions/_shared/ga-mp.ts` | 서버 GA4 Measurement Protocol |
| `track` | `app/lib/analytics.ts` | 클라이언트 GA4 이벤트 |

**Edge Function 트리거 요약**

| 함수 | 트리거 | 주기/이벤트 | 출력 핵심 |
|---|---|---|---|
| `schedule-notification` | DB Webhook | records INSERT/UPDATE | `scheduled_count` |
| `reschedule-notifications` | DB Webhook | user_settings UPDATE | `scheduled_count, records_processed` |
| `send-announcement` | DB Webhook | service_announcements INSERT | `announcement_id, scheduled_count` |
| `schedule-re-reminders` | pg_cron | 매일 KST 00:10 (`10 15 * * *`) | `scheduled_count, records_with_re_reminder` |
| `send-push` | pg_cron | 매분 | `processed_count, sent, failed` |

---

## 13. 관련 DB 테이블·컬럼

출처: `types/database.types.ts`.

### scheduled_notifications (`:195-247`)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | string | 대상 유저 |
| `record_id` | string \| null | 실제 record UUID / 공지 sentinel / null |
| `goal_id` | string \| null | goals FK. `goal_deadline` 알림에만 채워지고, 이때 `record_id`는 `null` |
| `token` | string | FCM 토큰 |
| `title` / `body` | string | 푸시 내용 |
| `scheduled_at` | string(ts) | 발송 예정 UTC |
| `sent_at` | string \| null | 발송 완료 시각 |
| `status` | string | `pending` / `sent` / `failed` |
| `notification_type` | string | `reminder` / `re_reminder` / `service_announcement` |
| `created_at` | string \| null | |
| **UNIQUE** | | `(record_id, scheduled_at, token)` (DB 제약, 11절) |

### user_settings — 알림 컬럼 (`:328-360`)
| 컬럼 | 타입 | state 매핑 |
|---|---|---|
| `notification_global_enabled` | boolean \| null | 전역 토글(별도 훅) |
| `notification_default_time` | string \| null | `defaultTime` |
| `notification_pre_reminder` | string \| null | `preReminder` |
| `notification_re_reminder_enabled` | boolean \| null | `reReminderOn` |
| `notification_service_announcement_enabled` | boolean \| null | `serviceAnnouncementsOn` |
| `notification_skip_weekend_holiday` | boolean \| null | `skipWeekendHolidayOn` |
| `notification_streak_enabled` | boolean \| null | **미사용(연동 없음)** |

### user_push_tokens (`:296-325`)
| 컬럼 | 타입 | 비고 |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | string | |
| `token` | string | FCM 토큰 |
| `platform` | string | `'ios'` / `'web'` |
| `device_id` | string \| null | UNIQUE 키 일부 |
| `created_at`/`updated_at` | string \| null | |
| **onConflict** | | `(user_id, device_id)` (앱 upsert 기준) |

### service_announcements (`:248-268`)
| 컬럼 | 타입 |
|---|---|
| `id` | uuid (PK) |
| `title` | string |
| `body` | string \| null |
| `created_at` | string |

### records — 알림 관련
- `notification_enabled` (boolean) — 레코드별 알림 on/off. `useNotificationToggle`이 토글, 예약 함수들이 게이트로 사용.
- 예약에 쓰이는 필드: `start_date`, `period_years`, `investment_days`, `monthly_amount`, `unit_type`, `monthly_shares`, `title`.

### payment_history
- `record_id`, `payment_date` — `schedule-re-reminders`의 어제 완료 판정에 사용.

---

## 14. 배포 주의 (supabase functions deploy)

CLAUDE.md "Edge Function 배포" 원칙: 함수 변경은 **별도 배포까지 끝내야 완료**. `_shared/*`를 고치면 그것을 import하는 함수들을 **모두 재배포**해야 반영됩니다.

```bash
# 단건
supabase functions deploy send-push
supabase functions deploy send-announcement
supabase functions deploy schedule-notification
supabase functions deploy reschedule-notifications
supabase functions deploy schedule-re-reminders

# 프로젝트 지정
supabase functions deploy <함수명> --project-ref <프로젝트-ref>
```

- `_shared/notification-schedule.ts` 또는 `korean-holidays.ts` 수정 시 → `schedule-notification`, `reschedule-notifications`, `schedule-re-reminders` 모두 재배포. `ga-mp.ts` 수정 시 → `send-push` 재배포.
- **필수 시크릿**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`(자동), `FIREBASE_PROJECT_ID`, `FIREBASE_SERVICE_ACCOUNT_JSON`. **옵셔널**: `GA_MEASUREMENT_ID`, `GA_API_SECRET`(`supabase secrets set ...`).
- **인프라 선행 작업**: 4개 Webhook(records INSERT/UPDATE, user_settings UPDATE, service_announcements INSERT) + pg_cron 2개(send-push 매분, schedule-re-reminders 매일) + Vault 시크릿 + `(record_id, scheduled_at, token)` UNIQUE 제약. 미설정 시 영향은 notification-infra.md §3·§7 참조.
- **공휴일 데이터 연 1회 갱신**: `korean-holidays.ts`는 2030년까지만 등록 → 매년 말 다음 해 공휴일을 추가하고 관련 3개 함수 재배포.
- **스키마=API 원칙(CLAUDE.md)**: `scheduled_notifications`/`user_settings`/`user_push_tokens` 컬럼은 Breaking Change 금지. 새 알림 타입/컬럼은 추가만(DEFAULT 필수).

---

## 15. 파일 경로 인덱스 (file_path:line)

### 클라이언트 — 페이지/컴포넌트
- `app/notifications/page.tsx:22` — 데모용 MOCK_NOTIFICATIONS / `:48` `useNotificationInbox` / `:54-57` `notification_open` 트래킹 / `:59-60` `?demo=1` 분기
- `app/settings/notifications/page.tsx:10-17` — `useNotificationSettings` 액션 → `NotificationSettingsView`
- `app/settings/page.tsx:14` — `useGlobalNotification` (전역 토글)
- `app/components/SettingsSections/NotificationSettingsView.tsx:32-51` — 투자 리마인더/서비스 알림 두 섹션
- `app/components/SettingsSections/NotificationReminderSection.tsx:14` `PreReminderOption` 6종 / `:27-34` 라벨 / `:51-127` 시간·사전알림·재알림·주말보정 UI
- `app/components/SettingsSections/NotificationServiceSection.tsx:24-28` — 공지 푸시 스위치
- `app/components/SettingsSections/SettingsView.tsx:108-122` — "전체 알림" 스위치 + "알림 상세 설정" 링크(`/settings/notifications`)
- `app/components/DashboardSections/NotificationInbox.tsx:9` — 종 아이콘 배지(unreadCount, 현재 항상 0)

### 클라이언트 — 훅/유틸/프로바이더
- `providers/NotificationProvider.tsx:24-80` — 네이티브 권한/리스너 / `:83-93` 로그인 시 토큰 등록
- `app/hooks/notification/useNotificationSettings.ts:16-28` `updateDB` upsert / `:30-46` 낙관적 업데이트 / `:48-58` setter·toggle
- `app/hooks/notification/useNotificationSettingsData.ts:22-41` — user_settings 로드(PGRST116 무시)
- `app/hooks/notification/useGlobalNotification.ts:33-56` — 전역 토글 + ON 시 `registerFCMToken`
- `app/hooks/notification/useNotificationToggle.ts:35-67` — 레코드 토글, OFF 시 pending 삭제(`:56-65`)
- `app/hooks/notification/useFCMToken.ts:25-62` — 등록 게이트(전역설정 확인·플랫폼 분기)
- `app/hooks/notification/useNotificationInbox.ts:31-40` — **스텁** / `:14-26` `formatNotificationTime`
- `app/hooks/types/useNotificationSettings.ts:1-18` — 타입 정의
- `app/utils/notification-settings.ts:4-10` 기본값 / `:15-23` `mapDbDataToSettings` / `:28-41` `mapSettingsToDbUpdates`
- `app/utils/fcm-token.ts:121-159` `saveTokenToDB`(fingerprint 스킵, onConflict user_id,device_id) / `:85-116` `getWebFCMToken`(VAPID 없으면 null) / `:164-183` `isGlobalNotificationEnabled`
- `app/lib/analytics.ts:26-35` `track` / `app/layout.tsx:75` NotificationProvider 마운트
- `lib/firebase.ts:13` — Firebase app 1회 초기화

### Edge Functions
- `supabase/functions/_shared/notification-schedule.ts:92-115` `generatePaymentDates` / `:153-162` `parsePreReminderToDays` / `:168-184` `calculateScheduledAt` / `:190-246` `buildNotificationRows` / `:61-65` `kstToUTC` / `:35` `HABIT_DEFAULT_YEARS=10`
- `supabase/functions/_shared/korean-holidays.ts:11-75` 공휴일 Set(2026~2030) / `:134-143` `adjustToNextBusinessDateStringKST`
- `supabase/functions/_shared/ga-mp.ts:36-64` `sendGAEvent`
- `supabase/functions/schedule-notification/index.ts:72-78` notification_enabled=false 스킵 / `:122-128` 전역 OFF 스킵 / `:203-208` upsert ignoreDuplicates
- `supabase/functions/send-push/index.ts:160-166` pending 조회(100건) / `:187-219` OFF record 정리 / `:59-105` `sendFCMPush`(HTTP v1) / `:26-35` 무효토큰 판정 / `:308-324` 토큰 삭제 / `:269-288` GA notification_sent
- `supabase/functions/schedule-re-reminders/index.ts:22-26` 어제(KST) / `:103-113` 어제 납입일 필터 / `:129-149` 완료 판정 / `:190-200` 재알림 ON 유저 / `:239-275` 재알림 행 / `:289-306` 배치 upsert
- `supabase/functions/send-announcement/index.ts:10` sentinel UUID / `:54-58` 공지 ON 유저 / `:108-118` sentinel 행 생성 / `:120-136` 배치 upsert
- `supabase/functions/reschedule-notifications/index.ts:64-76` 변경 감지 스킵 / `:96-102` 전역 OFF 스킵 / `:159-163` pending 배치 삭제 / `:194-213` 재생성 / `:228-244` 배치 upsert

### DB 타입
- `types/database.types.ts:195-247` scheduled_notifications / `:248-268` service_announcements / `:296-325` user_push_tokens / `:328-360` user_settings 알림 컬럼

### 인프라 문서(대조)
- `docs/notification-infra.md` — Webhook 4종, pg_cron 등록, UNIQUE 제약, 배포 절차
