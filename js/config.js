export const SUPABASE_URL = 'https://hnmqqycvigjemosajdov.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhubXFxeWN2aWdqZW1vc2FqZG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3NDE5NjEsImV4cCI6MjEwMTMxNzk2MX0.QFNTPe38DR-ab5ilU2aCKPcz1cbfj5gdg4DlmBZmWK4';

// Use global supabase instance from CDN
export const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function getAdminPassword() {
  return localStorage.getItem('rupa_admin_pass') || 'admin123';
}
