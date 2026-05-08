# 알림 인프라 셋업 가이드

알림 시스템(예약/재예약/공지/미완료 재알림)이 의존하는 **Supabase Database Webhook** 과 **pg_cron** 설정을 정리한 문서입니다.  
클라이언트에서 Edge Function을 직접 호출하면 네트워크/배포 환경에 따라 `FunctionsFetchError`가 발생할 수 있으므로, **반드시 아래 웹훅을 설정**해야 합니다.

---

## 1. Supabase Dashboard에서 Webhook 추가

1. [Supabase Dashboard](https://supabase.com/dashboard) → 프로젝트 선택
2. **Database** → **Webhooks** → **Create a new hook**
3. 아래처럼 **네 개**의 Webhook을 만듭니다.

### Webhook 1: records INSERT (새 투자 시 알림 예약)

| 항목 | 값 |
|------|-----|
| **Name** | `schedule-notification-on-insert` (임의) |
| **Table** | `records` |
| **Events** | **Insert** 만 체크 |
| **Type** | Supabase Edge Functions |
| **Function** | `schedule-notification` |
| **HTTP Headers** | `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

### Webhook 2: records UPDATE (알림 OFF → ON 시 재예약)

| 항목 | 값 |
|------|-----|
| **Name** | `schedule-notification-on-update` (임의) |
| **Table** | `records` |
| **Events** | **Update** 만 체크 |
| **Type** | Supabase Edge Functions |
| **Function** | `schedule-notification` |
| **HTTP Headers** | `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

### Webhook 3: user_settings UPDATE (기본 알림 시간/사전 알림 변경 시 재예약)

| 항목 | 값 |
|------|-----|
| **Name** | `reschedule-notifications-on-settings-update` (임의) |
| **Table** | `user_settings` |
| **Events** | **Update** 만 체크 |
| **Type** | Supabase Edge Functions |
| **Function** | `reschedule-notifications` |
| **HTTP Headers** | `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

### Webhook 4: service_announcements INSERT (공지사항 푸시 예약)

| 항목 | 값 |
|------|-----|
| **Name** | `send-announcement-on-insert` (임의) |
| **Table** | `service_announcements` |
| **Events** | **Insert** 만 체크 |
| **Type** | Supabase Edge Functions |
| **Function** | `send-announcement` |
| **HTTP Headers** | `Authorization`: `Bearer <SUPABASE_SERVICE_ROLE_KEY>` |

- **Service Role Key**는 Dashboard → **Settings** → **API** → **Project API keys** 에서 확인합니다.
- Webhook 2: `records` UPDATE 시 `schedule-notification`이 호출되며, 알림 ON으로 바뀐 record에 대해 재예약됩니다.
- Webhook 3: `user_settings`의 `notification_default_time` 또는 `notification_pre_reminder`가 변경되면 해당 유저의 모든 pending 알림을 삭제한 뒤 새 설정으로 배치 재예약합니다.
- Webhook 4: `service_announcements`에 INSERT 시 `send-announcement`가 호출되어, `notification_service_announcement_enabled = true` 인 유저만 `scheduled_notifications`에 공지 행이 들어갑니다. (record_id는 공지 전용 sentinel UUID 사용.)

## 2. 동작 요약

- **records INSERT**: 새 record 생성 시 해당 투자에 대한 납입일 알림이 `scheduled_notifications`에 등록됩니다.
- **records UPDATE**: `records.notification_enabled`를 false에서 true로 변경하면, 해당 record에 대한 예약이 다시 생성됩니다. (알림 ON 시 재등록)
- **user_settings UPDATE**: 기본 알림 시간(`notification_default_time`) 또는 기본 사전 알림(`notification_pre_reminder`) 변경 시, 해당 유저의 기존 pending 알림을 **배치 삭제**한 뒤 **배치 insert**로 새 설정에 맞게 재예약합니다.
- **service_announcements INSERT**: Dashboard SQL Editor에서 `insert into service_announcements (title, body) values ('제목', '내용');` 실행 시 Webhook으로 `send-announcement`가 호출되고, 공지 푸시 ON 유저만 `scheduled_notifications`에 예약됩니다. 실제 발송은 기존 `send-push` cron이 처리합니다.
- 알림 **OFF** 시에는 앱에서 `scheduled_notifications`의 pending 행을 삭제하며, 웹훅만으로는 처리하지 않습니다.

## 3. 웹훅을 설정하지 않았을 때

- **records INSERT만 설정한 경우**: 새 투자 추가 시에는 알림이 예약되지만, 알림을 OFF 했다가 다시 ON 해도 재예약이 되지 않습니다.
- **records UPDATE 웹훅까지 설정한 경우**: 알림 ON 시 재예약이 서버(웹훅)에서 처리되므로, Capacitor/네이티브 환경에서도 `FunctionsFetchError` 없이 동작합니다.
- **user_settings UPDATE 웹훅을 설정하지 않은 경우**: 설정 화면에서 기본 알림 시간/사전 알림을 바꿔도, 이미 예약된 알림은 이전 설정 그대로 유지됩니다. 새로 추가되는 투자만 새 설정이 적용됩니다.

### 미완료 재알림 (schedule-re-reminders) – pg_cron

**미완료 재알림**은 Webhook이 아니라 **pg_cron**으로 매일 한 번 호출됩니다.

- **Edge Function**: `schedule-re-reminders`
- **스케줄**: 매일 **KST 00:10** (UTC 15:10) → `10 15 * * *`
- **동작**: 어제가 납입일인데 `payment_history`에 완료 기록이 없는 (record, user)에 대해, 당일 기본 알림 시간에 재알림 1회를 `scheduled_notifications`에 예약 (`notification_type: 're_reminder'`). 중복 방지는 `(record_id, scheduled_at, token)` unique + `ignoreDuplicates`로 처리.

**pg_cron 등록 방법**은 아래 [6. pg_cron 등록](#6-pg_cron-등록-미완료-재알림) 섹션을 참고하세요. (Vault 시크릿 저장 후 `cron.schedule` 실행.)

### 공통 모듈

예약 로직은 `supabase/functions/_shared/notification-schedule.ts`에 있으며, `schedule-notification`, `reschedule-notifications`, `schedule-re-reminders`에서 재사용합니다. 배포 시 해당 경로가 함께 포함됩니다.

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

## 5. 배포 및 테이블 생성

### Edge Function 배포

```bash
supabase functions deploy send-announcement
supabase functions deploy send-push
```

프로젝트를 지정할 때:

```bash
supabase functions deploy send-announcement --project-ref <프로젝트-ref>
supabase functions deploy send-push --project-ref <프로젝트-ref>
```

### service_announcements 테이블 생성

아직 테이블이 없다면 Supabase **SQL Editor**에서 아래를 실행합니다.

```sql
create table if not exists service_announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  created_at timestamptz not null default now()
);
alter table service_announcements enable row level security;
create policy "Allow read for authenticated"
  on service_announcements for select to authenticated using (true);
```

## 6. pg_cron 등록 (미완료 재알림)

`schedule-re-reminders`는 **pg_cron**으로 매일 호출됩니다.  
Supabase에서는 **pg_cron** + **pg_net**으로 HTTP 요청을 보내 Edge Function을 호출합니다.

### 6.1 사전 준비

1. **Dashboard** → **Project Settings** → **API**에서 확인:
   - Project URL (예: `https://xxxx.supabase.co`)
   - Service Role Key (비공개, cron용으로 사용)

2. **Vault에 시크릿 저장** (SQL Editor에서 1회 실행):

```sql
-- 프로젝트 URL (따옴표 안을 본인 프로젝트 URL로 변경)
select vault.create_secret('https://YOUR_PROJECT_REF.supabase.co', 'schedule_re_reminders_project_url');

-- Service Role Key (따옴표 안을 본인 Service Role Key로 변경)
select vault.create_secret('YOUR_SERVICE_ROLE_KEY', 'schedule_re_reminders_service_role_key');
```

3. **확장 활성화** (아직 안 했다면):

```sql
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
```

### 6.2 미완료 재알림 cron 등록 (매일 KST 00:10 = UTC 15:10)

아래 SQL을 **SQL Editor**에서 실행합니다.  
(이미 시크릿 이름을 다르게 저장했다면 `decrypted_secrets`의 `name` 값을 맞춰 주세요.)

```sql
select cron.schedule(
  'schedule-re-reminders-daily',
  '10 15 * * *',
  $$
  select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'schedule_re_reminders_project_url') || '/functions/v1/schedule-re-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'schedule_re_reminders_service_role_key')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

- **스케줄**: `10 15 * * *` = 매일 **UTC 15:10** = **KST 00:10** (다음날).
- 등록 후 **Dashboard** → **Database** → **Cron Jobs**에서 확인할 수 있습니다.

### 6.3 cron 작업 제거

```sql
select cron.unschedule('schedule-re-reminders-daily');
```
