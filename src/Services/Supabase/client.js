import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

function isRefreshTokenRecoveryError(error) {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('invalid refresh token') ||
    message.includes('refresh token not found') ||
    message.includes('refresh_token_not_found')
  );
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

if (supabase) {
  supabase.auth.getSession().then(async ({ error }) => {
    if (!error || !isRefreshTokenRecoveryError(error)) {
      return;
    }

    try {
      // If a user is still resolvable, keep the current auth state.
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        return;
      }
    } catch (_error) {
      // Fall through to local sign-out cleanup.
    }

    // Clear only local auth state when token recovery is definitively invalid.
    supabase.auth.signOut({ scope: 'local' }).catch(() => {});
  });
}
