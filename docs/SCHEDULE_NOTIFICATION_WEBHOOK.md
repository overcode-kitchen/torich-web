# schedule-notification Database Webhook 설정

알림 예약(및 알림 ON 시 재예약)은 **Database Webhook**으로 Edge Function `schedule-notification`을 호출합니다.  
클라이언트에서 Edge Function을 호출하면 네트워크/배포 환경에 따라 `FunctionsFetchError`가 발생할 수 있으므로, **반드시 아래 웹훅을 설정**해야 합니다.

## 1. Supabase Dashboard에서 Webhook 추가

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Database** → **Webhooks** → **Create a new hook**
3. 아래처럼 **두 개**의 Webhook을 만듭니다.

### Webhook 1: INSERT (새 투자 시 알림 예약)

| 항목 | 값 |
|------|-----|
| **Name** | `schedule-notification-on-insert` (임의) |
| **Table** | `records` |
| **Events** | **Insert** 만 체크 |
| **Type** | Supabase Edge Functions |
| **Function** | `schedule-notification` |
| **HTTP Headers** | `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

### Webhook 2: UPDATE (알림 OFF → ON 시 재예약)

| 항목 | 값 |
|------|-----|
| **Name** | `schedule-notification-on-update` (임의) |
| **Table** | `records` |
| **Events** | **Update** 만 체크 |
| **Type** | Supabase Edge Functions |
| **Function** | `schedule-notification` |
| **HTTP Headers** | `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

- **Service Role Key**는 Dashboard → **Settings** → **API** → **Project API keys** 에서 확인합니다.
- UPDATE 웹훅은 `notification_enabled`가 `false` → `true`로 바뀔 때만 재예약 로직을 수행합니다.

## 2. 동작 요약

- **INSERT**: 새 record 생성 시 해당 투자에 대한 납입일 알림이 `scheduled_notifications`에 등록됩니다.
- **UPDATE**: `records.notification_enabled`를 false에서 true로 변경하면, 같은 Edge Function이 호출되어 해당 record에 대한 예약이 다시 생성됩니다. (알림 ON 시 재등록)
- 알림 **OFF** 시에는 앱에서 `scheduled_notifications`의 pending 행을 삭제하며, 웹훅만으로는 처리하지 않습니다.

## 3. 웹훅을 설정하지 않았을 때

- **INSERT만 설정한 경우**: 새 투자 추가 시에는 알림이 예약되지만, 알림을 OFF 했다가 다시 ON 해도 재예약이 되지 않습니다.
- **UPDATE 웹훅까지 설정한 경우**: 알림 ON 시 재예약이 서버(웹훅)에서 처리되므로, Capacitor/네이티브 환경에서도 `FunctionsFetchError` 없이 동작합니다.

## 4. scheduled_notifications 테이블 – Unique 제약 (중복 INSERT 방지)

같은 `record_id`로 웹훅이 여러 번 호출될 때(재시도, 동시 호출 등) **23505 unique constraint 위반**을 막기 위해, Edge Function은 `upsert(..., { onConflict: 'record_id,scheduled_at,token', ignoreDuplicates: true })`를 사용합니다.  
이를 위해 아래 unique 제약이 **반드시** 필요합니다.

### Supabase에서 확인·설정 방법

1. **Dashboard** → **Table Editor** → `scheduled_notifications` 테이블 선택  
2. **Table** 설정 또는 **SQL Editor**에서 아래를 확인합니다.

### 필요한 제약

- **Unique constraint** 컬럼: `(record_id, scheduled_at, token)`  
  - 하나의 레코드·예약 시각·푸시 토큰 조합당 행이 하나만 있어야 합니다.

### 제약이 없을 때 추가하는 SQL

Supabase **SQL Editor**에서 실행:

```sql
-- 기존에 (record_id, scheduled_at, token) 조합이 중복된 행이 있으면 먼저 정리한 뒤 실행하세요.
ALTER TABLE scheduled_notifications
ADD CONSTRAINT scheduled_notifications_record_id_scheduled_at_token_key
UNIQUE (record_id, scheduled_at, token);
```

- 이미 같은 이름의 제약이 있거나, 컬럼 구성이 다른 unique가 있으면 에러가 납니다.  
- 그럴 때는 **Table Editor** → `scheduled_notifications` → **Constraints**에서 기존 unique 제약 이름/컬럼을 확인한 뒤,  
  Edge Function의 `onConflict` 문자열을 해당 컬럼에 맞게 수정하거나, 위 제약을 추가할 수 있으면 추가합니다.
