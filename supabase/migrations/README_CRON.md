# pg_cron으로 Edge Function 호출 (미완료 재알림 등)

`schedule-re-reminders`는 **pg_cron**으로 매일 호출됩니다.  
Supabase에서는 **pg_cron** + **pg_net**으로 HTTP 요청을 보내 Edge Function을 호출합니다.

## 사전 준비

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

## 미완료 재알림 cron 등록 (매일 KST 00:10 = UTC 15:10)

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

## cron 작업 제거

```sql
select cron.unschedule('schedule-re-reminders-daily');
```
