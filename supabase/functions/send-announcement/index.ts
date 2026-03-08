// Supabase Edge Function: send-announcement
// service_announcements 테이블 INSERT 시 Database Webhook으로 호출되어,
// notification_service_announcement_enabled = true 인 유저만 scheduled_notifications에 공지 행을 넣습니다.
//
// Webhook: service_announcements, Insert. Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>
/// <reference path="../../../types/supabase-deno.d.ts" />

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANNOUNCEMENT_RECORD_ID_SENTINEL = '00000000-0000-0000-0000-000000000001'
const BATCH_INSERT_SIZE = 500

interface AnnouncementWebhookPayload {
  type: string
  table: string
  record: {
    id: string
    title: string
    body?: string | null
    created_at: string
  }
  old_record: null
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Missing environment variables' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const payload: AnnouncementWebhookPayload = await req.json()

    if (!payload.record?.id || !payload.record?.title) {
      console.error('Invalid payload: missing record.id or record.title')
      return new Response(
        JSON.stringify({ error: 'Invalid payload' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { id: announcementId, title, body, created_at: createdAt } = payload.record
    const bodyText = body ?? ''
    const scheduledAt = createdAt ?? new Date().toISOString()

    // 1. notification_service_announcement_enabled = true (및 전역 알림 ON) 유저 조회
    const { data: settingsRows, error: settingsError } = await supabase
      .from('user_settings')
      .select('user_id')
      .eq('notification_global_enabled', true)
      .eq('notification_service_announcement_enabled', true)

    if (settingsError) {
      console.error('Error fetching user_settings:', settingsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch user settings' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const userIds = (settingsRows ?? []).map((r) => r.user_id)
    if (userIds.length === 0) {
      console.log('No users with service announcement push enabled')
      return new Response(
        JSON.stringify({
          success: true,
          announcement_id: announcementId,
          scheduled_count: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 2. 해당 유저들의 push token 조회
    const { data: tokens, error: tokensError } = await supabase
      .from('user_push_tokens')
      .select('user_id, token, platform')
      .in('user_id', userIds)

    if (tokensError) {
      console.error('Error fetching user_push_tokens:', tokensError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch push tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const tokenList = (tokens ?? []) as Array<{ user_id: string; token: string; platform: string }>
    if (tokenList.length === 0) {
      console.log('No push tokens for announcement-enabled users')
      return new Response(
        JSON.stringify({
          success: true,
          announcement_id: announcementId,
          scheduled_count: 0,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // 3. scheduled_notifications에 insert (record_id = sentinel, notification_type = service_announcement)
    const rows = tokenList.map((t) => ({
      user_id: t.user_id,
      record_id: ANNOUNCEMENT_RECORD_ID_SENTINEL,
      token: t.token,
      title,
      body: bodyText,
      scheduled_at: scheduledAt,
      status: 'pending',
      notification_type: 'service_announcement',
    }))

    for (let i = 0; i < rows.length; i += BATCH_INSERT_SIZE) {
      const chunk = rows.slice(i, i + BATCH_INSERT_SIZE)
      const { error: insertError } = await supabase
        .from('scheduled_notifications')
        .upsert(chunk, {
          onConflict: 'record_id,scheduled_at,token',
          ignoreDuplicates: true,
        })

      if (insertError) {
        console.error('Error inserting announcement notifications:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to schedule announcement' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(
      `Scheduled ${rows.length} announcement notifications (announcement_id=${announcementId})`
    )

    return new Response(
      JSON.stringify({
        success: true,
        announcement_id: announcementId,
        scheduled_count: rows.length,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
