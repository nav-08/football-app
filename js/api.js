import { supabaseClient } from './config.js';
import { state, saveLocalCache } from './state.js';

export async function fetchAllTournamentData() {
  const [tRes, mRes, sRes, rRes, uRes, gRes, pRes, vRes, prRes] = await Promise.all([
    supabaseClient.from('tournaments').select('*').order('id', { ascending: false }),
    supabaseClient.from('matches').select('*').eq('tournament_id', state.currentTournamentId).order('id', { ascending: true }),
    supabaseClient.from('squads').select('*').eq('tournament_id', state.currentTournamentId).order('id', { ascending: true }),
    supabaseClient.from('rules').select('*').eq('tournament_id', state.currentTournamentId).order('id', { ascending: true }),
    supabaseClient.from('updates').select('*').eq('tournament_id', state.currentTournamentId).order('created_at', { ascending: false }),
    supabaseClient.from('goals').select('*').eq('tournament_id', state.currentTournamentId).order('created_at', { ascending: false }),
    supabaseClient.from('photos').select('*').eq('tournament_id', state.currentTournamentId).order('created_at', { ascending: false }),
    supabaseClient.from('votes').select('*').eq('tournament_id', state.currentTournamentId).order('created_at', { ascending: false }),
    supabaseClient.from('predictions').select('*').eq('tournament_id', state.currentTournamentId).order('created_at', { ascending: false })
  ]);

  if (tRes.data && tRes.data.length > 0) {
    state.tournaments = tRes.data;
    localStorage.setItem('rupa_tournaments_cache', JSON.stringify(state.tournaments));
  }

  state.matches = mRes.data || [];
  state.squads = sRes.data || [];
  state.rules = rRes.data || [];
  state.updates = uRes.data || [];
  state.goals = gRes.data || [];
  state.photos = pRes.data || [];
  state.votes = vRes.data || [];
  state.predictions = prRes.data || [];

  saveLocalCache();
}

export function setupRealtime(onDataUpdate) {
  supabaseClient
    .channel('public-schema-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'squads' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'rules' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'updates' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'goals' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'votes' }, () => onDataUpdate())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'predictions' }, () => onDataUpdate())
    .subscribe();
}
