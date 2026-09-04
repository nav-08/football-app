import { supabaseClient, getAdminPassword } from './config.js';
import { state, loadLocalCache } from './state.js';
import { fetchAllTournamentData, setupRealtime } from './api.js';
import { renderAllUI } from './ui.js';

// Expose handlers globally for HTML onclick triggers
window.app = {
  switchTab(tab) {
    const allTabs = ['matches', 'awards', 'squads', 'gallery', 'info'];
    allTabs.forEach(t => {
      const sec = document.getElementById(`sec-${t}`);
      const btn = document.getElementById(`tab-${t}`);
      if (sec) sec.classList.add('hidden');
      if (btn) btn.classList.remove('active-tab');
    });

    const activeSec = document.getElementById(`sec-${tab}`);
    const activeBtn = document.getElementById(`tab-${tab}`);
    if (activeSec) activeSec.classList.remove('hidden');
    if (activeBtn) activeBtn.classList.add('active-tab');
  },

  openTournamentPicker() {
    const overlay = document.getElementById('tournament-selector-overlay');
    overlay.classList.remove('hidden');
    overlay.classList.add('flex');
  },

  selectTournament(tourneyId) {
    state.currentTournamentId = parseInt(tourneyId);
    localStorage.setItem('rupa_active_tournament_id', state.currentTournamentId);
    const overlay = document.getElementById('tournament-selector-overlay');
    overlay.classList.add('hidden');
    overlay.classList.remove('flex');
    loadLocalCache();
    renderAllUI();
    fetchAllTournamentData().then(renderAllUI);
  },

  populateAdminMatchInputs() {
    const matchSelect = document.getElementById('admin-match-select');
    if (!matchSelect || !matchSelect.value) return;
    const match = state.matches.find(m => m.id === parseInt(matchSelect.value));
    if (match) {
      document.getElementById('admin-home-name').value = match.home_team;
      document.getElementById('admin-away-name').value = match.away_team;
      document.getElementById('home-score').value = match.home_score;
      document.getElementById('away-score').value = match.away_score;
      document.getElementById('match-status').value = match.status;
    }
  },

  async updateTournamentDetails() {
    const name = document.getElementById('admin-edit-name').value.trim();
    const season = document.getElementById('admin-edit-season').value.trim();
    const loc = document.getElementById('admin-edit-loc').value.trim();
    if (!name || !season) return alert('Enter tournament name and season!');

    await supabaseClient.from('tournaments').update({ name, season, location: loc }).eq('id', state.currentTournamentId);
    alert('Tournament details updated!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async createNewTournament() {
    const name = document.getElementById('admin-edit-name').value.trim();
    const season = document.getElementById('admin-edit-season').value.trim();
    const location = document.getElementById('admin-edit-loc').value.trim();
    if (!name || !season) return alert('Enter tournament name and season!');

    const { data } = await supabaseClient.from('tournaments').insert([{ name, season, location: location || 'Arizona Sports Arena' }]).select();
    if (data && data.length > 0) {
      alert(`Launched ${name}!`);
      state.currentTournamentId = data[0].id;
      localStorage.setItem('rupa_active_tournament_id', state.currentTournamentId);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  async createNewMatch() {
    const home_team = document.getElementById('new-match-home').value.trim();
    const away_team = document.getElementById('new-match-away').value.trim();
    const match_time = document.getElementById('new-match-time').value.trim();
    if (!home_team || !away_team) return alert('Enter team names!');

    await supabaseClient.from('matches').insert([{ tournament_id: state.currentTournamentId, home_team, away_team, home_score: 0, away_score: 0, status: 'UPCOMING', match_time: match_time || 'TBD' }]);
    document.getElementById('new-match-home').value = '';
    document.getElementById('new-match-away').value = '';
    document.getElementById('new-match-time').value = '';
    alert('Match added!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async deleteSelectedMatch() {
    const matchId = parseInt(document.getElementById('admin-match-select').value);
    if (!matchId) return alert('Select a match!');
    if (!confirm('Delete this match?')) return;
    await supabaseClient.from('matches').delete().eq('id', matchId);
    fetchAllTournamentData().then(renderAllUI);
  },

  async updateScore() {
    const matchId = parseInt(document.getElementById('admin-match-select').value);
    const home_team = document.getElementById('admin-home-name').value.trim();
    const away_team = document.getElementById('admin-away-name').value.trim();
    const home_score = parseInt(document.getElementById('home-score').value);
    const away_score = parseInt(document.getElementById('away-score').value);
    const status = document.getElementById('match-status').value;

    await supabaseClient.from('matches').update({ home_team, away_team, home_score, away_score, status }).eq('id', matchId);
    alert('Score updated live!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async submitMatchPrediction() {
    const name = document.getElementById('predictor-user-name').value.trim();
    const matchId = parseInt(document.getElementById('predictor-match-select').value);
    const home_pred = parseInt(document.getElementById('pred-home-score').value);
    const away_pred = parseInt(document.getElementById('pred-away-score').value);
    if (!name || isNaN(home_pred) || isNaN(away_pred) || !matchId) return alert('Fill in all prediction details!');

    localStorage.setItem('rupa_predictor_name', name);
    await supabaseClient.from('predictions').insert([{ tournament_id: state.currentTournamentId, predictor_name: name, match_id: matchId, home_pred, away_pred }]);
    document.getElementById('pred-home-score').value = '';
    document.getElementById('pred-away-score').value = '';
    alert('Prediction saved!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async castPottVote() {
    const player_name = document.getElementById('pott-vote-select').value;
    if (!player_name) return alert('Select a player!');
    await supabaseClient.from('votes').insert([{ tournament_id: state.currentTournamentId, player_name }]);
    localStorage.setItem(`rupa_pott_voted_${state.currentTournamentId}`, 'true');
    alert('Vote cast!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async uploadPhoto() {
    const fileInput = document.getElementById('photo-input');
    const captionInput = document.getElementById('photo-caption');
    const uploadBtn = document.getElementById('upload-btn');
    if (!fileInput.files || !fileInput.files[0]) return alert('Select an image!');

    uploadBtn.disabled = true;
    uploadBtn.innerHTML = 'Uploading...';
    const file = fileInput.files[0];
    const filePath = `${Date.now()}.${file.name.split('.').pop()}`;

    const { error } = await supabaseClient.storage.from('tournament-photos').upload(filePath, file);
    if (error) {
      alert('Upload failed: ' + error.message);
    } else {
      const { data } = supabaseClient.storage.from('tournament-photos').getPublicUrl(filePath);
      await supabaseClient.from('photos').insert([{ tournament_id: state.currentTournamentId, photo_url: data.publicUrl, caption: captionInput.value.trim() }]);
      fileInput.value = '';
      captionInput.value = '';
      alert('Photo uploaded!');
      fetchAllTournamentData().then(renderAllUI);
    }
    uploadBtn.disabled = false;
    uploadBtn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Upload Photo';
  },

  async deletePhoto(id) {
    if (confirm('Delete photo?')) {
      await supabaseClient.from('photos').delete().eq('id', id);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  async addPlayerToSquad() {
    const team_name = document.getElementById('squad-team-name').value.trim();
    const player_name = document.getElementById('new-player-name').value.trim();
    if (!team_name || !player_name) return alert('Enter team and player names!');

    await supabaseClient.from('squads').insert([{ tournament_id: state.currentTournamentId, team_name, player_name }]);
    document.getElementById('new-player-name').value = '';
    alert('Player added!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async addRule() {
    const rule_title = document.getElementById('new-rule-title').value.trim();
    const rule_content = document.getElementById('new-rule-content').value.trim();
    if (!rule_title || !rule_content) return alert('Enter rule title and content!');

    await supabaseClient.from('rules').insert([{ tournament_id: state.currentTournamentId, rule_title, rule_content }]);
    document.getElementById('new-rule-title').value = '';
    document.getElementById('new-rule-content').value = '';
    alert('Rule saved!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async deleteRule(id) {
    if (confirm('Delete rule?')) {
      await supabaseClient.from('rules').delete().eq('id', id);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  async logGoal() {
    const player_name = document.getElementById('goal-player-select').value;
    if (!player_name) return alert('Select a player!');
    await supabaseClient.from('goals').insert([{ tournament_id: state.currentTournamentId, player_name }]);
    alert('Goal logged!');
    fetchAllTournamentData().then(renderAllUI);
  },

  async deleteGoalRecord(id) {
    if (confirm('Delete goal?')) {
      await supabaseClient.from('goals').delete().eq('id', id);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  async addUpdate() {
    const update_text = document.getElementById('admin-update-text').value.trim();
    if (!update_text) return alert('Enter text!');
    await supabaseClient.from('updates').insert([{ tournament_id: state.currentTournamentId, update_text }]);
    document.getElementById('admin-update-text').value = '';
    fetchAllTournamentData().then(renderAllUI);
  },

  async deleteUpdate(id) {
    if (confirm('Delete update?')) {
      await supabaseClient.from('updates').delete().eq('id', id);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  async resetPredictions() {
    if (confirm('Reset predictions?')) {
      await supabaseClient.from('predictions').delete().eq('tournament_id', state.currentTournamentId);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  async resetPottVotes() {
    if (confirm('Reset votes?')) {
      await supabaseClient.from('votes').delete().eq('tournament_id', state.currentTournamentId);
      localStorage.removeItem(`rupa_pott_voted_${state.currentTournamentId}`);
      fetchAllTournamentData().then(renderAllUI);
    }
  },

  toggleAdminModal() {
    document.getElementById('login-modal').classList.toggle('hidden');
    document.getElementById('login-modal').classList.toggle('flex');
  },

  loginAdmin() {
    if (document.getElementById('admin-pass').value === getAdminPassword()) {
      state.isAdminLoggedIn = true;
      document.getElementById('sec-admin-panel').classList.remove('hidden');
      document.getElementById('admin-btn-text').innerText = 'Admin Active';
      window.app.toggleAdminModal();
      document.getElementById('admin-pass').value = '';
      renderAllUI();
    } else {
      alert('Incorrect password!');
    }
  },

  logoutAdmin() {
    state.isAdminLoggedIn = false;
    document.getElementById('sec-admin-panel').classList.add('hidden');
    document.getElementById('admin-btn-text').innerText = 'Admin';
    renderAllUI();
  }
};

// Bootstrap App: Load instant cache, render UI, sync backend, and setup Realtime
loadLocalCache();
renderAllUI();
fetchAllTournamentData().then(renderAllUI);
setupRealtime(() => fetchAllTournamentData().then(renderAllUI));

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  });
}
