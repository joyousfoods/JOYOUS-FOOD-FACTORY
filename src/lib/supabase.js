import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const formatSupabaseUrl = (url) => {
  if (!url) return '';
  if (url.includes('your-project-id')) return url;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.supabase.co')) {
      return `https://${url}`;
    }
    return `https://${url}.supabase.co`;
  }
  return url;
};

const supabaseUrl = formatSupabaseUrl(rawUrl);

export const getSupabaseConfigError = () => {
  if (!supabaseUrl || supabaseUrl.includes('your-project-id')) {
    return 'Supabase URL (VITE_SUPABASE_URL) is not configured in environment variables.';
  }
  if (!supabaseAnonKey || supabaseAnonKey.includes('your-anon-key')) {
    return 'Supabase Anon Key (VITE_SUPABASE_ANON_KEY) is not configured in environment variables.';
  }
  try {
    new URL(supabaseUrl);
  } catch {
    return `Invalid Supabase URL format: "${supabaseUrl}". Must be a valid URL like https://your-project.supabase.co`;
  }
  return null;
};

export const isSupabaseConfigured = () => {
  return getSupabaseConfigError() === null;
};

let clientInstance = null;
if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    clientInstance = null;
  }
}

export const supabase = clientInstance;


