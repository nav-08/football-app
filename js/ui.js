import { state } from './state.js';

export function getTeamBadge(teamName) {
  if (teamName.includes('Lovers')) return 'badge-lovers';
  if (teamName.includes('Warriors')) return 'badge-warriors';
  if (teamName.includes('Sniffers')) return 'badge-sniffers';
  if (teamName.includes('Dreamers')) return 'badge-dreamers';
  if (teamName.includes('Stealers')) return 'badge-stealers';
  return 'bg-slate-800 text-slate-300';
}

export function isKnockoutMatch(m) {
  const home = (m.home_team || '').toLowerCase();
  const away = (m.away_team || '').toLowerCase();
  return home.includes('rank') || away.includes('rank') || 
         home.includes('winner') || away.includes('winner') || 
         home.includes('sf') || away.includes('sf') || 
         home.includes('final') || away.includes('final');
}

export function renderAllUI() {
  renderHeaderAndTournamentList();
  renderMatches();
  renderPredictions();
  renderStandings();
  renderSquads();
  renderRules();
  renderLeaderboards();
  renderPhotos();
  renderUpdates();
  renderAdminInputs();
}

function renderHeaderAndTournamentList() {
  const landingList = document.getElementById('landing-tournaments-list');
  if (landingList) {
    landingList.innerHTML = state.tournaments.map(t => `
      <div onclick="window.app.selectTournament(${t.id})" class="p-3.5 bg-slate-900 hover:bg-slate-800 border ${t.id === state.currentTournamentId ? 'border-[#ccff00]' : 'border-slate-800'} rounded-xl cursor-pointer flex justify-between items-center text-left shadow transition">
        <div>
          <p class="font-bold text-sm text-slate-100">${t.name} • ${t.season}</p>
          <p class="text-[10px] text-slate-400 uppercase font-semibold">${t.location || 'Guwahati'}</p>
        </div>
        <span class="text-xs font-poster font-bold text-[#ccff00] bg-[#ccff00]/10 border border-[#ccff00]/30 px-2 py-0.5 rounded uppercase">Enter ➔</span>
      </div>
    `).join('');
  }

  const activeTourney = state.tournaments.find(t => t.id === state.currentTournamentId) || state.tournaments[0];
  if (activeTourney) {
    document.getElementById('header-tourney-title').innerText = activeTourney.name;
    document.getElementById('header-tourney-sub').innerText = `${activeTourney.season} • ${activeTourney.location || 'Guwahati'}`;
    document.getElementById('active-tourney-badge').innerText = activeTourney.season;
    document.getElementById('admin-active-tourney-label').innerText = `Managing: ${activeTourney.name} (${activeTourney.season})`;
  }
}

function renderMatches() {
  const matchesEl = document.getElementById('matches-list');
  const matchSelect = document.getElementById('admin-match-select');
  const predMatchSelect = document.getElementById('predictor-match-select');

  matchesEl.innerHTML = '';
  matchSelect.innerHTML = '<option value="">-- Select Match --</option>';
  predMatchSelect.innerHTML = '<option value="">-- Select Upcoming Match --</option>';

  if (state.matches.length > 0) {
    state.matches.forEach(m => {
      const isLive = (m.status || '').includes('LIVE');
      const isFinished = (m.status || '').toUpperCase().includes('FT') || (m.status || '').toUpperCase().includes('FINISHED');

      matchesEl.innerHTML += `
        <div class="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 flex justify-between items-center shadow-lg">
          <div class="space-y-2 w-2/3">
            <div class="flex justify-between items-center font-bold text-sm text-slate-100">
              <span class="px-2 py-0.5 rounded text-xs ${getTeamBadge(m.home_team)}">${m.home_team}</span> 
              <span class="text-base font-poster text-[#ccff00]">${m.home_score}</span>
            </div>
            <div class="flex justify-between items-center font-bold text-sm text-slate-100">
              <span class="px-2 py-0.5 rounded text-xs ${getTeamBadge(m.away_team)}">${m.away_team}</span> 
              <span class="text-base font-poster text-[#ccff00]">${m.away_score}</span>
            </div>
          </div>
          <div class="text-right border-l border-slate-800/80 pl-3">
            <span class="text-[9px] font-black px-2 py-0.5 rounded uppercase ${isLive ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : 'bg-slate-800 text-slate-400'}">
              ${m.status}
            </span>
            <p class="text-[10px] font-bold text-slate-500 mt-1">${m.match_time || ''}</p>
          </div>
        </div>`;

      matchSelect.innerHTML += `<option value="${m.id}">${m.home_team} vs ${m.away_team}</option>`;
      if (!isFinished) {
        predMatchSelect.innerHTML += `<option value="${m.id}">${m.home_team} vs ${m.away_team} (${m.match_time || 'Upcoming'})</option>`;
      }
    });
  } else {
    matchesEl.innerHTML = '<p class="text-xs text-slate-500 italic">No matches scheduled for this tournament yet.</p>';
  }
}

function renderPredictions() {
  const predFeedEl = document.getElementById('live-predictions-feed');
  document.getElementById('pred-count-badge').innerText = `${state.predictions.length} Submission${state.predictions.length !== 1 ? 's' : ''}`;
  
  if (state.predictions.length === 0) {
    predFeedEl.innerHTML = '<p class="text-[11px] text-slate-500 italic">No predictions submitted yet.</p>';
  } else {
    predFeedEl.innerHTML = state.predictions.map(p => {
      const match = state.matches.find(m => m.id === p.match_id);
      const matchLabel = match ? `${match.home_team} vs ${match.away_team}` : 'Match';
      return `
        <div class="pt-1.5 flex justify-between items-center text-[11px]">
          <div>
            <span class="font-bold text-purple-300">${p.predictor_name}</span>
            <span class="text-slate-500 text-[10px] ml-1">(${matchLabel})</span>
          </div>
          <span class="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 font-poster text-xs text-[#ccff00] font-bold">
            ${p.home_pred} - ${p.away_pred}
          </span>
        </div>`;
    }).join('');
  }
}

function renderStandings() {
  const tableData = {};
  state.matches.forEach(m => {
    if (!isKnockoutMatch(m)) {
      if (!tableData[m.home_team]) tableData[m.home_team] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
      if (!tableData[m.away_team]) tableData[m.away_team] = { p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 };

      if ((m.status || '').includes('FT') || (m.status || '').includes('LIVE')) {
        const home = m.home_team;
        const away = m.away_team;
        const hScore = m.home_score || 0;
        const aScore = m.away_score || 0;

        tableData[home].p += 1;
        tableData[away].p += 1;
        tableData[home].gf += hScore;
        tableData[home].ga += aScore;
        tableData[away].gf += aScore;
        tableData[away].ga += hScore;

        if (hScore > aScore) {
          tableData[home].w += 1;
          tableData[home].pts += 3;
          tableData[away].l += 1;
        } else if (aScore > hScore) {
          tableData[away].w += 1;
          tableData[away].pts += 3;
          tableData[home].l += 1;
        } else {
          tableData[home].d += 1;
          tableData[away].d += 1;
          tableData[home].pts += 1;
          tableData[away].pts += 1;
        }

        tableData[home].gd = tableData[home].gf - tableData[home].ga;
        tableData[away].gd = tableData[away].gf - tableData[away].ga;
      }
    }
  });

  const sortedTeams = Object.entries(tableData).sort((a, b) => {
    if (b[1].pts !== a[1].pts) return b[1].pts - a[1].pts;
    return b[1].gd - a[1].gd;
  });

  const standingsBody = document.getElementById('standings-body');
  standingsBody.innerHTML = sortedTeams.map(([teamName, stats], idx) => `
    <tr class="${idx < 4 ? 'bg-lime-500/5' : ''} hover:bg-slate-800/40">
      <td class="p-2.5 font-bold text-slate-100 flex items-center gap-1.5 whitespace-nowrap">
        <span class="text-[10px] text-slate-500">${idx + 1}</span>
        <span class="px-2 py-0.5 rounded text-[11px] ${getTeamBadge(teamName)}">${teamName}</span>
      </td>
      <td class="p-2 text-center text-slate-400">${stats.p}</td>
      <td class="p-2 text-center text-slate-400">${stats.w}</td>
      <td class="p-2 text-center text-slate-400">${stats.d}</td>
      <td class="p-2 text-center text-slate-400">${stats.l}</td>
      <td class="p-2 text-center text-slate-400">${stats.gf}</td>
      <td class="p-2 text-center text-slate-400">${stats.ga}</td>
      <td class="p-2 text-center text-slate-300 font-bold">${stats.gd > 0 ? '+' + stats.gd : stats.gd}</td>
      <td class="p-2.5 text-center text-[#ccff00] font-black text-sm">${stats.pts}</td>
    </tr>
  `).join('');
}

function renderSquads() {
  const squadGroups = {};
  state.squads.forEach(s => {
    if (!squadGroups[s.team_name]) squadGroups[s.team_name] = [];
    squadGroups[s.team_name].push(s.player_name);
  });

  const squadsContainer = document.getElementById('squads-container');
  squadsContainer.innerHTML = '';
  
  const allPlayers = [];
  if (Object.keys(squadGroups).length === 0) {
    squadsContainer.innerHTML = '<p class="text-xs text-slate-500 italic">No squad rosters added for this tournament yet.</p>';
  } else {
    Object.entries(squadGroups).forEach(([teamName, players]) => {
      allPlayers.push(...players);
      squadsContainer.innerHTML += `
        <div class="bg-slate-900/80 border border-slate-800 rounded-xl p-4 space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="font-poster text-2xl font-bold text-[#ccff00] tracking-wide uppercase flex items-center gap-2">${teamName}</h3>
            <span class="text-[10px] bg-slate-800 font-bold px-2 py-0.5 rounded-full text-slate-300">${players.length} Players</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-300">
            ${players.map(p => `<div class="bg-slate-950/60 p-2 rounded-lg border border-slate-800/60 flex items-center gap-1.5"><i class="fa-regular fa-user text-slate-500 text-[10px]"></i>${p}</div>`).join('')}
          </div>
        </div>`;
    });
  }

  const uniquePlayers = [...new Set(allPlayers)].sort();
  const goalSelect = document.getElementById('goal-player-select');
  const pottSelect = document.getElementById('pott-vote-select');
  goalSelect.innerHTML = '<option value="">-- Select Player --</option>';
  pottSelect.innerHTML = '<option value="">-- Select Player --</option>';

  uniquePlayers.forEach(p => {
    goalSelect.innerHTML += `<option value="${p}">${p}</option>`;
    pottSelect.innerHTML += `<option value="${p}">${p}</option>`;
  });
}

function renderRules() {
  const rulesContainer = document.getElementById('rules-container');
  const adminRulesList = document.getElementById('admin-rules-list');
  
  if (state.rules.length === 0) {
    rulesContainer.innerHTML = '<p class="text-xs text-slate-500 italic">No rules specified for this tournament yet.</p>';
    adminRulesList.innerHTML = '<p class="text-[10px] text-slate-500 p-1 italic">No rules added.</p>';
  } else {
    rulesContainer.innerHTML = state.rules.map(r => `
      <div class="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
        <h3 class="font-bold text-[#ccff00] uppercase tracking-wider flex items-center gap-1.5">
          <i class="fa-solid fa-circle-check text-xs"></i> ${r.rule_title}
        </h3>
        <div class="text-xs text-slate-300 whitespace-pre-line leading-relaxed">${r.rule_content}</div>
      </div>`).join('');

    adminRulesList.innerHTML = state.rules.map(r => `
      <div class="flex justify-between items-center py-1.5 text-xs text-slate-300">
        <span class="font-bold truncate max-w-[200px]">${r.rule_title}</span>
        <button onclick="window.app.deleteRule(${r.id})" class="text-red-400 hover:text-red-300 font-bold px-1.5"><i class="fa-solid fa-trash text-[10px]"></i></button>
      </div>`).join('');
  }
}

function renderLeaderboards() {
  // Predictor Tally
  const userScores = {};
  state.predictions.forEach(p => {
    const match = state.matches.find(m => m.id === p.match_id);
    if (match && (match.status || '').includes('FT')) {
      if (!userScores[p.predictor_name]) userScores[p.predictor_name] = 0;
      const actualHome = match.home_score;
      const actualAway = match.away_score;
      const predHome = p.home_pred;
      const predAway = p.away_pred;

      if (actualHome === predHome && actualAway === predAway) {
        userScores[p.predictor_name] += 3;
      } else if (
        (actualHome > actualAway && predHome > predAway) ||
        (actualAway > actualHome && predAway > predHome) ||
        (actualHome === actualAway && predHome === predAway)
      ) {
        userScores[p.predictor_name] += 1;
      }
    }
  });

  const sortedPredictors = Object.entries(userScores).sort((a, b) => b[1] - a[1]);
  const predTallyEl = document.getElementById('predictor-tally-list');
  predTallyEl.innerHTML = sortedPredictors.length === 0 
    ? '<p class="p-4 text-xs text-slate-500 italic">No scored predictions yet. Points update as matches finish!</p>'
    : sortedPredictors.map(([name, pts], idx) => `
      <div class="p-3.5 flex justify-between items-center text-xs">
        <span class="font-bold text-slate-200">${idx + 1}. ${name}</span>
        <span class="bg-purple-500/10 text-purple-400 font-black px-2.5 py-0.5 rounded border border-purple-500/20">${pts} Pt${pts !== 1 ? 's' : ''}</span>
      </div>`).join('');

  // Golden Boot
  const goalCounts = {};
  state.goals.forEach(g => { goalCounts[g.player_name] = (goalCounts[g.player_name] || 0) + 1; });
  const sortedScorers = Object.entries(goalCounts).sort((a, b) => b[1] - a[1]);
  const scorersEl = document.getElementById('scorers-list');
  scorersEl.innerHTML = sortedScorers.length === 0
    ? '<p class="p-4 text-xs text-slate-500 italic">No goals logged yet.</p>'
    : sortedScorers.map(([player, count], idx) => `
      <div class="p-3.5 flex justify-between items-center text-xs">
        <span class="font-bold text-slate-200">${idx + 1}. ${player}</span>
        <span class="bg-[#ccff00]/10 text-[#ccff00] font-bold px-2.5 py-0.5 rounded border border-[#ccff00]/20">${count} Goal${count > 1 ? 's' : ''}</span>
      </div>`).join('');

  // POTT Voting
  const voteCounts = {};
  state.votes.forEach(v => { voteCounts[v.player_name] = (voteCounts[v.player_name] || 0) + 1; });
  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1]);
  const pottTallyEl = document.getElementById('pott-tally-list');
  pottTallyEl.innerHTML = sortedVotes.length === 0
    ? '<p class="p-4 text-xs text-slate-500 italic">No votes recorded yet.</p>'
    : sortedVotes.map(([player, count], idx) => `
      <div class="p-3.5 flex justify-between items-center text-xs">
        <span class="font-bold text-slate-200">${idx + 1}. ${player}</span>
        <span class="bg-purple-500/10 text-purple-400 font-bold px-2.5 py-0.5 rounded border border-purple-500/20">${count} Vote${count > 1 ? 's' : ''}</span>
      </div>`).join('');

  const voteBtn = document.getElementById('vote-btn');
  if (localStorage.getItem(`rupa_pott_voted_${state.currentTournamentId}`)) {
    voteBtn.disabled = true;
    voteBtn.classList.add('opacity-50', 'cursor-not-allowed');
    document.getElementById('user-voted-msg').classList.remove('hidden');
  } else {
    voteBtn.disabled = false;
    voteBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    document.getElementById('user-voted-msg').classList.add('hidden');
  }
}

function renderPhotos() {
  const photosGrid = document.getElementById('photos-grid');
  photosGrid.innerHTML = state.photos.length === 0
    ? '<p class="text-xs text-slate-500 col-span-2 italic">No photos uploaded yet. Be the first!</p>'
    : state.photos.map(p => `
      <div class="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden space-y-1 relative group">
        <img src="${p.photo_url}" class="w-full h-36 object-cover" alt="Tournament photo">
        ${p.caption ? `<p class="p-2 text-[11px] text-slate-300 font-medium truncate">${p.caption}</p>` : ''}
        ${state.isAdminLoggedIn ? `
          <button onclick="window.app.deletePhoto(${p.id})" class="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full text-xs shadow hover:bg-red-500">
            <i class="fa-solid fa-trash text-[10px]"></i>
          </button>` : ''}
      </div>`).join('');
}

function renderUpdates() {
  const updatesEl = document.getElementById('updates-list');
  updatesEl.innerHTML = state.updates.length === 0
    ? '<p class="text-xs text-slate-500 italic">No live announcements posted for this tournament yet.</p>'
    : state.updates.map(u => {
      const timeStr = new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="bg-slate-900/90 p-3.5 rounded-xl border-l-2 border-[#ccff00] flex justify-between items-start">
          <div>
            <p class="text-[10px] text-slate-500 font-bold mb-1">${timeStr}</p>
            <p class="text-xs text-slate-300">${u.update_text}</p>
          </div>
          ${state.isAdminLoggedIn ? `<button onclick="window.app.deleteUpdate(${u.id})" class="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1"><i class="fa-solid fa-trash"></i></button>` : ''}
        </div>`;
    }).join('');
}

function renderAdminInputs() {
  const adminGoalsLog = document.getElementById('admin-goals-log');
  adminGoalsLog.innerHTML = state.goals.length === 0
    ? '<p class="text-[10px] text-slate-500 p-1 italic">No recorded goals.</p>'
    : state.goals.map(g => `
      <div class="flex justify-between items-center py-1 text-xs text-slate-300">
        <span>${g.player_name}</span>
        <button onclick="window.app.deleteGoalRecord(${g.id})" class="text-red-400 hover:text-red-300 font-bold px-1.5"><i class="fa-solid fa-trash text-[10px]"></i></button>
      </div>`).join('');
}
