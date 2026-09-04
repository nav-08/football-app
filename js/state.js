export const state = {
  isAdminLoggedIn: false,
  currentTournamentId: parseInt(localStorage.getItem('rupa_active_tournament_id')) || 2,
  tournaments: JSON.parse(localStorage.getItem('rupa_tournaments_cache')) || [
    { id: 2, name: 'Rupa Super Cup 2.0', season: 'Season 2', location: 'Arizona Sports Arena (06 Sept 2026, 9:00 PM Onwards)' },
    { id: 1, name: 'Rupa Super Cup', season: 'Season 1', location: 'The Playyard, Guwahati' }
  ],
  matches: [],
  squads: [],
  rules: [],
  goals: [],
  updates: [],
  photos: [],
  votes: [],
  predictions: []
};

export function loadLocalCache() {
  const localCache = JSON.parse(localStorage.getItem('rupa_cache_v2_' + state.currentTournamentId)) || {};
  state.matches = localCache.matches || [];
  state.squads = localCache.squads || [];
  state.rules = localCache.rules || [];
  state.goals = localCache.goals || [];
  state.updates = localCache.updates || [];
  state.photos = localCache.photos || [];
  state.votes = localCache.votes || [];
  state.predictions = localCache.predictions || [];
}

export function saveLocalCache() {
  localStorage.setItem('rupa_cache_v2_' + state.currentTournamentId, JSON.stringify({
    matches: state.matches,
    squads: state.squads,
    rules: state.rules,
    goals: state.goals,
    updates: state.updates,
    photos: state.photos,
    votes: state.votes,
    predictions: state.predictions
  }));
}
