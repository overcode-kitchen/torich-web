/**
 * Type declarations for Supabase Edge Functions (Deno).
 * Edge Functions run on Deno; these satisfy the IDE/TypeScript in the Next.js project.
 */
declare module 'https://esm.sh/@supabase/supabase-js@2' {
  export function createClient(
    supabaseUrl: string,
    supabaseKey: string,
    options?: Record<string, unknown>
  ): import('@supabase/supabase-js').SupabaseClient
}

declare module 'https://deno.land/x/google_jwt_sa@v0.2.5/mod.ts' {
  export function getToken(
    serviceAccountJson: string,
    options: { scope: string[] }
  ): Promise<{ access_token: string }>
}

declare namespace Deno {
  function serve(handler: (req: Request) => Promise<Response> | Response): void
  const env: { get(key: string): string | undefined }
}

