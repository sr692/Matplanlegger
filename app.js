const API_BASE = (window.MATPLAN_API || '').replace(/\/$/, '');
const DAYS = ['Mandag','Tirsdag','Onsdag','Torsdag','Fredag','Lørdag','Søndag'];
const seedWeek = {Onsdag:'liba-chorizo',Torsdag:'butter-chicken',Fredag:'pizza'};
const seedFreezer = [
  {id:'f1',name:'Skivet bacon',qty:'2 pk',location:'Kjelleren'},
  {id:'f2',name:'Laksefilet',qty:'1 x 2 fileter',location:'Kjelleren'},
  {id:'f3',name:'Grytekjøtt',qty:'1 middag',location:'Kjelleren'},
  {id:'f4',name:'Kyllingfilet',qty:'3 x 300 g',location:'Kjelleren'},
  {id:'f5',name:'Grønnsaker',qty:'diverse',location:'Kjelleren'},
  {id:'f6',name:'Bær',qty:'diverse',location:'Kjelleren'},
  {id:'f7',name:'Smoothiefrukt',qty:'diverse',location:'Kjelleren'},
  {id:'f8',name:'Okse indrefilet',qty:'1,6 kg',location:'Boden'},
  {id:'f9',name:'Pizzasnurrer',qty:'flere',location:'Boden'},
  {id:'f10',name:'Boller',qty:'flere',location:'Boden'}
];

const STORAGE_PROFILES = 'matplan-profiles-v2';
const STORAGE_ACTIVE = 'matplan-active-profile-v2';
const LEGACY_STATE = 'matplan-state';
const THEME_KEY = 'matplan_theme';

let activeProfile = null;
let state = defaultState(true);
let selectedDay = null;
let filter = 'Alle';
let syncTimer = null;
let syncInFlight = false;
let syncQueued = false;
let pullInFlight = false;
let pollTimer = null;
let localDirty = false;
let localRevision = 0;
let lastRemoteUpdatedAt = null;
let draggedDay = null;
let pointerDrag = null;
let lastDragEnd = 0;

const SYNC_DEBOUNCE_MS = 80;
const POLL_VISIBLE_MS = 500;
let lastLocalActivityAt = Date.now();
const syncChannel = 'BroadcastChannel' in window ? new BroadcastChannel('matplan-profile-sync-v1') : null;


function applyTheme(theme, persist = true) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  if (persist) {
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  }

  const dark = next === 'dark';
  const toggle = document.getElementById('themeToggle');
  const icon = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  const meta = document.getElementById('themeColor');
  if (toggle) toggle.setAttribute('aria-label', dark ? 'Bytt til lys bakgrunn' : 'Bytt til mørk bakgrunn');
  if (toggle) toggle.title = dark ? 'Bytt til lyst tema' : 'Bytt til mørkt tema';
  if (icon) icon.textContent = dark ? '☀' : '☾';
  if (label) label.textContent = dark ? 'Lys' : 'Mørk';
  if (meta) meta.setAttribute('content', dark ? '#0b0b0a' : '#f4f1e8');
}

function initTheme() {
  let theme = document.documentElement.dataset.theme || 'light';
  try { theme = localStorage.getItem(THEME_KEY) || theme; } catch {}
  applyTheme(theme, false);
}

function defaultState(withSeed = false) {
  return {
    week: withSeed ? structuredClone(seedWeek) : {},
    freezer: withSeed ? structuredClone(seedFreezer) : [],
    shoppingDone: {},
    history: {},
    customMeals: [],
    weekLocked: false
  };
}

function ensureStateShape(value) {
  return {
    week: value?.week && typeof value.week === 'object' ? value.week : {},
    freezer: Array.isArray(value?.freezer) ? value.freezer : [],
    shoppingDone: value?.shoppingDone && typeof value.shoppingDone === 'object' ? value.shoppingDone : {},
    history: value?.history && typeof value.history === 'object' ? value.history : {},
    customMeals: Array.isArray(value?.customMeals) ? value.customMeals : [],
    weekLocked: value?.weekLocked === true
  };
}

function getProfiles() {
  try { return JSON.parse(localStorage.getItem(STORAGE_PROFILES) || '{}'); }
  catch { return {}; }
}

function setProfiles(profiles) {
  localStorage.setItem(STORAGE_PROFILES, JSON.stringify(profiles));
}

function cacheProfile(profile, profileState) {
  const profiles = getProfiles();
  profiles[profile.id] = {
    id: profile.id,
    name: profile.name,
    state: ensureStateShape(profileState),
    updatedAt: new Date().toISOString()
  };
  setProfiles(profiles);
}

function setActiveProfile(profile, profileState, remoteUpdatedAt = null) {
  activeProfile = {id: profile.id.toLowerCase(), name: profile.name};
  state = ensureStateShape(profileState);
  lastRemoteUpdatedAt = remoteUpdatedAt || null;
  localDirty = false;
  localStorage.setItem(STORAGE_ACTIVE, activeProfile.id);
  cacheProfile(activeProfile, state);
  updateProfileUI();
  renderAll();
  startFastPolling();
}

function save({sync = true} = {}) {
  if (activeProfile) cacheProfile(activeProfile, state);
  else localStorage.setItem(LEGACY_STATE, JSON.stringify(state));

  if (sync && activeProfile) {
    localDirty = true;
    localRevision += 1;
    lastLocalActivityAt = Date.now();
    scheduleSync();
  }
}

function scheduleSync(delay = SYNC_DEBOUNCE_MS) {
  if (!activeProfile || !API_BASE) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => pushProfile(false), delay);
}

async function pushProfile(showFeedback = false) {
  if (!activeProfile || !API_BASE) {
    if (showFeedback && !API_BASE) alert('Worker-URL mangler. Appen lagrer bare lokalt til MATPLAN_API er konfigurert.');
    return;
  }

  if (syncInFlight) {
    syncQueued = true;
    return;
  }

  clearTimeout(syncTimer);
  syncTimer = null;
  syncInFlight = true;
  syncQueued = false;
  const profileId = activeProfile.id;
  const revisionAtStart = localRevision;
  const snapshot = structuredClone(state);
  setSyncStatus('Synker…');

  try {
    const response = await fetch(`${API_BASE}/api/profiles/${profileId}`, {
      method: 'PUT',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({name: activeProfile.name, state: snapshot})
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();

    if (activeProfile?.id === profileId) {
      lastRemoteUpdatedAt = result.updatedAt || lastRemoteUpdatedAt;
      if (localRevision === revisionAtStart) localDirty = false;
      else syncQueued = true;
    }

    setSyncStatus('Synkronisert');
    syncChannel?.postMessage({type:'profile-synced', profileId, updatedAt:lastRemoteUpdatedAt});
    if (showFeedback) toast('Profilen er synkronisert');
  } catch (error) {
    console.error(error);
    setSyncStatus('Ikke synket');
    syncQueued = false;
    if (showFeedback) alert('Kunne ikke synkronisere profilen. Endringene er fortsatt lagret på denne enheten.');
  } finally {
    syncInFlight = false;
    // Queue only edits that happened while a successful request was in flight.
    // On failure we keep the local copy and retry gently instead of creating a request loop.
    if (syncQueued) scheduleSync(0);
    else if (localDirty && navigator.onLine) scheduleSync(5000);
    else setTimeout(() => { if (!syncInFlight && !localDirty) setSyncStatus('Synkroniser'); }, 1200);
  }
}

async function fetchProfile(profileId) {
  if (!API_BASE) {
    const cached = getProfiles()[profileId];
    if (!cached) throw new Error('API_NOT_CONFIGURED');
    return {id: cached.id, name: cached.name, state: cached.state};
  }

  const response = await fetch(`${API_BASE}/api/profiles/${profileId}`, {cache:'no-store'});
  if (response.status === 404) throw new Error('PROFILE_NOT_FOUND');
  if (!response.ok) throw new Error(`HTTP_${response.status}`);
  return response.json();
}

async function pullProfile({force = false} = {}) {
  if (!activeProfile || !API_BASE || pullInFlight) return false;
  if (!force && (localDirty || syncInFlight)) return false;

  const profileId = activeProfile.id;
  pullInFlight = true;
  try {
    const remote = await fetchProfile(profileId);
    if (activeProfile?.id !== profileId) return false;

    const remoteUpdatedAt = remote.updatedAt || null;
    const changed = !lastRemoteUpdatedAt || (remoteUpdatedAt && remoteUpdatedAt !== lastRemoteUpdatedAt);
    if (!changed) return false;

    // Never overwrite unsent local edits. They are pushed first, then the next poll checks again.
    if (localDirty || syncInFlight) return false;

    activeProfile = {id: remote.id.toLowerCase(), name: remote.name};
    state = ensureStateShape(remote.state);
    lastRemoteUpdatedAt = remoteUpdatedAt;
    cacheProfile(activeProfile, state);
    updateProfileUI();
    renderAll();
    setSyncStatus('Synkronisert');
    return true;
  } catch (error) {
    if (force) console.error(error);
    return false;
  } finally {
    pullInFlight = false;
  }
}

function currentPollInterval() {
  return POLL_VISIBLE_MS;
}

function startFastPolling() {
  clearTimeout(pollTimer);
  if (!activeProfile || !API_BASE || document.hidden) return;

  const tick = async () => {
    if (!activeProfile || !API_BASE || document.hidden) return;
    await pullProfile();
    pollTimer = setTimeout(tick, currentPollInterval());
  };

  pollTimer = setTimeout(tick, 150);
}

function requestImmediatePull() {
  if (!activeProfile || !API_BASE || document.hidden) return;
  clearTimeout(pollTimer);
  pollProfileSoon();
}

function pollProfileSoon() {
  pollTimer = setTimeout(async () => {
    await pullProfile();
    startFastPolling();
  }, 50);
}

syncChannel?.addEventListener('message', event => {
  if (event.data?.type !== 'profile-synced') return;
  if (!activeProfile || event.data.profileId !== activeProfile.id) return;
  if (event.data.updatedAt && event.data.updatedAt === lastRemoteUpdatedAt) return;
  requestImmediatePull();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearTimeout(pollTimer);
    if (localDirty && navigator.onLine) pushProfile(false);
    return;
  }
  requestImmediatePull();
});
window.addEventListener('focus', requestImmediatePull);
window.addEventListener('online', () => {
  if (localDirty) scheduleSync(0);
  requestImmediatePull();
});

function setSyncStatus(text) {
  const btn = document.getElementById('syncBtn');
  if (btn) btn.textContent = text;
}

function updateProfileUI() {
  document.getElementById('profileName').textContent = activeProfile?.name || 'Ingen profil';
  document.getElementById('profileBanner').classList.toggle('hidden', !!activeProfile);
  document.getElementById('currentProfileCard').classList.toggle('hidden', !activeProfile);
  if (activeProfile) document.getElementById('currentProfileName').textContent = activeProfile.name;
  const addMealBtn = document.getElementById('addMealBtn');
  if (addMealBtn) {
    addMealBtn.disabled = !activeProfile;
    addMealBtn.title = activeProfile ? 'Legg til en egen middag i denne profilen' : 'Velg profil for å legge til egne middager';
  }
  renderSavedProfiles();
}

function openProfileDialog() {
  updateProfileUI();
  document.getElementById('profileDialog').showModal();
}

function closeProfileDialog() {
  document.getElementById('profileDialog').close();
}

function renderSavedProfiles() {
  const profiles = Object.values(getProfiles()).sort((a,b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  const wrap = document.getElementById('savedProfilesWrap');
  const el = document.getElementById('savedProfiles');
  if (!profiles.length) {
    wrap.classList.add('hidden');
    el.innerHTML = '';
    return;
  }

  wrap.classList.remove('hidden');
  el.innerHTML = '';
  profiles.forEach(profile => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `saved-profile ${activeProfile?.id === profile.id ? 'active' : ''}`;
    row.innerHTML = `<span class="mini-avatar">${escapeHtml(profile.name.slice(0,1).toUpperCase())}</span><span><strong>${escapeHtml(profile.name)}</strong><small>${activeProfile?.id === profile.id ? 'Aktiv profil' : 'Åpne profil'}</small></span><span class="arrow">→</span>`;
    row.onclick = async () => {
      try {
        const remote = await fetchProfile(profile.id);
        setActiveProfile({id:remote.id,name:remote.name}, remote.state, remote.updatedAt);
        closeProfileDialog();
      } catch {
        setActiveProfile({id:profile.id,name:profile.name}, profile.state);
        closeProfileDialog();
        toast('Åpnet lokal kopi – skyen kunne ikke nås');
      }
    };
    el.appendChild(row);
  });
}

function extractProfileId(input) {
  const raw = String(input || '').trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const fromQuery = url.searchParams.get('profile');
    if (isUuid(fromQuery)) return fromQuery.toLowerCase();
  } catch {}
  return isUuid(raw) ? raw.toLowerCase() : null;
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function shareUrl() {
  const url = new URL(location.href);
  url.searchParams.set('profile', activeProfile.id);
  return url.toString();
}

async function copyShareLink() {
  if (!activeProfile) return;
  const value = shareUrl();
  try {
    await navigator.clipboard.writeText(value);
    toast('Delingslenken er kopiert');
  } catch {
    window.prompt('Kopier denne delingslenken:', value);
  }
}

function toast(message) {
  let el = document.getElementById('appToast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'appToast';
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(el._timer);
  el._timer = setTimeout(() => el.classList.remove('show'), 2200);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function allMeals() {
  const custom = (state.customMeals || []).map(m => ({...m, isCustom:true}));
  const defaults = MEALS.map(m => ({...m, isCustom:false}));
  return [...custom, ...defaults];
}

function mealById(id) {
  return (state.customMeals || []).find(m => m.id === id) || MEALS.find(m => m.id === id);
}

function safeExternalUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch { return ''; }
}

function parseIngredients(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split('|');
      const name = String(parts.shift() || '').trim();
      const qty = String(parts.join('|') || '1').trim() || '1';
      return name ? [name, qty] : null;
    })
    .filter(Boolean);
}

function ingredientsToText(ingredients) {
  return (Array.isArray(ingredients) ? ingredients : []).map(([name, qty]) => `${name} | ${qty}`).join('\n');
}

function requireProfileForCustomMeal() {
  if (activeProfile) return true;
  openProfileDialog();
  toast('Velg en husholdningsprofil først');
  return false;
}


function isWeekLocked() {
  return state.weekLocked === true;
}

function updateWeekLockUI() {
  const locked = isWeekLocked();
  const button = document.getElementById('weekLockBtn');
  const icon = document.getElementById('weekLockIcon');
  const label = document.getElementById('weekLockLabel');
  const hint = document.getElementById('weekHint');
  const autoPlan = document.getElementById('autoPlanBtn');
  const clearWeek = document.getElementById('clearWeekBtn');

  if (button) {
    button.classList.toggle('locked', locked);
    button.setAttribute('aria-pressed', String(locked));
    button.setAttribute('aria-label', locked ? 'Lås opp middagsplanen' : 'Lås middagsplanen');
    button.title = activeProfile
      ? (locked ? 'Lås opp uka for å endre middagsplanen' : 'Lås uka for å unngå utilsiktede endringer')
      : 'Velg en profil for å låse uka';
  }
  if (icon) icon.innerHTML = locked ? '&#128274;' : '&#128275;';
  if (label) label.textContent = locked ? 'Uka er låst' : 'Lås uke';
  if (hint) hint.textContent = locked
    ? 'Middagsplanen er låst mot endringer'
    : 'Dra en middag til en annen dag · klikk for å endre';

  if (autoPlan) {
    autoPlan.disabled = locked;
    autoPlan.title = locked ? 'Lås opp uka for å foreslå ny uke' : '';
  }
  if (clearWeek) {
    clearWeek.disabled = locked;
    clearWeek.title = locked ? 'Lås opp uka for å tømme planen' : '';
  }
}

function toggleWeekLock() {
  if (!activeProfile) {
    openProfileDialog();
    toast('Velg en husholdningsprofil først');
    return;
  }
  state.weekLocked = !isWeekLocked();
  save();
  renderWeek();
  toast(state.weekLocked ? 'Uka er låst' : 'Uka er låst opp');
}

function switchView(name) {
  document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
  document.getElementById(name+'View').classList.add('active');
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('active', x.dataset.view === name));
  if (name === 'shopping') renderShopping();
}

document.querySelectorAll('.tab').forEach(b => b.onclick = () => switchView(b.dataset.view));

function moveMealBetweenDays(fromDay, toDay) {
  if (isWeekLocked()) { toast('Uka er låst'); return; }
  if (!fromDay || !toDay || fromDay === toDay) return;
  const fromMeal = state.week[fromDay];
  if (!fromMeal) return;

  const targetMeal = state.week[toDay];
  if (targetMeal) state.week[fromDay] = targetMeal;
  else delete state.week[fromDay];
  state.week[toDay] = fromMeal;

  save();
  renderWeek();
  const target = document.querySelector(`.day-card[data-day="${CSS.escape(toDay)}"]`);
  if (target) target.classList.add('just-dropped');
  toast(targetMeal
    ? `Byttet ${fromDay.toLowerCase()} og ${toDay.toLowerCase()}`
    : `Flyttet ${fromDay.toLowerCase()} til ${toDay.toLowerCase()}`);
}

function clearDropTargets() {
  document.querySelectorAll('.day-card.drop-target').forEach(x => x.classList.remove('drop-target'));
}

function beginPointerDrag(e, day, card, meal) {
  if (isWeekLocked() || !meal || e.button > 0) return;
  e.stopPropagation();
  pointerDrag = {
    pointerId: e.pointerId,
    fromDay: day,
    card,
    meal,
    startX: e.clientX,
    startY: e.clientY,
    active: false,
    targetDay: null,
    float: null
  };
  e.currentTarget.setPointerCapture?.(e.pointerId);
}

function updatePointerDrag(e) {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  const dx = e.clientX - pointerDrag.startX;
  const dy = e.clientY - pointerDrag.startY;

  if (!pointerDrag.active && Math.hypot(dx, dy) < 6) return;
  if (!pointerDrag.active) {
    pointerDrag.active = true;
    pointerDrag.card.classList.add('dragging');
    const float = document.createElement('div');
    float.className = 'drag-float';
    float.innerHTML = `<small>${escapeHtml(pointerDrag.fromDay)}</small><strong>${escapeHtml(pointerDrag.meal.name)}</strong>`;
    document.body.appendChild(float);
    pointerDrag.float = float;
  }

  e.preventDefault();
  if (pointerDrag.float) {
    pointerDrag.float.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px) rotate(1.2deg)`;
  }

  clearDropTargets();
  const hit = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.day-card');
  const targetDay = hit?.dataset?.day || null;
  pointerDrag.targetDay = targetDay && targetDay !== pointerDrag.fromDay ? targetDay : null;
  if (pointerDrag.targetDay) hit.classList.add('drop-target');
}

function endPointerDrag(e) {
  if (!pointerDrag || pointerDrag.pointerId !== e.pointerId) return;
  const drag = pointerDrag;
  pointerDrag = null;
  clearDropTargets();
  drag.card.classList.remove('dragging');
  drag.float?.remove();

  if (drag.active) {
    lastDragEnd = Date.now();
    if (drag.targetDay) moveMealBetweenDays(drag.fromDay, drag.targetDay);
  }
}

function renderWeek() {
  const el = document.getElementById('weekGrid');
  const locked = isWeekLocked();
  updateWeekLockUI();
  el.classList.toggle('week-locked', locked);
  el.innerHTML = '';
  DAYS.forEach(day => {
    const meal = mealById(state.week[day]);
    const c = document.createElement('article');
    c.className = 'day-card';
    c.dataset.day = day;
    c.draggable = !!meal && !locked;
    c.setAttribute('aria-label', locked
      ? `${day}: ${meal ? meal.name : 'ingen middag'}. Uka er låst.`
      : (meal ? `${day}: ${meal.name}. Dra for å flytte eller klikk for å endre.` : `${day}: ingen middag. Klikk for å velge.`));
    c.innerHTML = `<div class="day-top"><div class="day-name">${day}</div>${meal && !locked ? `<button class="drag-handle" type="button" aria-label="Dra ${escapeHtml(meal.name)} fra ${day}" title="Dra til en annen dag">⠿</button>` : (locked ? '<span class="day-lock" aria-hidden="true">&#128274;</span>' : '')}</div>${meal ? `<div class="day-meal">${escapeHtml(meal.name)}</div><div class="day-meta">${escapeHtml(meal.category)}</div><div class="day-tags">${(meal.tags || []).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : `<div class="day-empty">${locked ? 'Ingen middag' : '+ Velg middag'}</div>`}`;

    c.onclick = e => {
      if (e.target.closest('.drag-handle')) return;
      if (Date.now() - lastDragEnd < 350) return;
      if (locked) { toast('Uka er låst'); return; }
      openMealDialog(day);
    };

    // Desktop drag-and-drop.
    c.addEventListener('dragstart', e => {
      if (locked || !meal || e.target.closest?.('.drag-handle')) { e.preventDefault(); return; }
      draggedDay = day;
      c.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', day);
    });
    c.addEventListener('dragend', () => {
      draggedDay = null;
      c.classList.remove('dragging');
      clearDropTargets();
    });
    c.addEventListener('dragover', e => {
      if (!draggedDay || draggedDay === day) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      clearDropTargets();
      c.classList.add('drop-target');
    });
    c.addEventListener('drop', e => {
      e.preventDefault();
      const fromDay = draggedDay || e.dataTransfer.getData('text/plain');
      draggedDay = null;
      clearDropTargets();
      c.classList.remove('dragging');
      if (fromDay && fromDay !== day) moveMealBetweenDays(fromDay, day);
    });

    // Pointer-based drag handle also works on touch screens.
    const handle = c.querySelector('.drag-handle');
    if (handle) {
      handle.addEventListener('click', e => e.stopPropagation());
      handle.addEventListener('pointerdown', e => beginPointerDrag(e, day, c, meal));
      handle.addEventListener('pointermove', updatePointerDrag);
      handle.addEventListener('pointerup', endPointerDrag);
      handle.addEventListener('pointercancel', endPointerDrag);
    }

    el.appendChild(c);
  });
}

function openMealDialog(day) {
  if (isWeekLocked()) { toast('Uka er låst'); return; }
  selectedDay = day;
  document.getElementById('dialogDay').textContent = day;
  document.getElementById('dialogSearch').value = '';
  renderDialogMeals();
  document.getElementById('mealDialog').showModal();
}

function renderDialogMeals() {
  const q = document.getElementById('dialogSearch').value.toLowerCase();
  const el = document.getElementById('dialogMeals');
  el.innerHTML = '';
  allMeals().filter(m => m.name.toLowerCase().includes(q)).forEach(m => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'dialog-meal';
    b.innerHTML = `<strong>${escapeHtml(m.name)}</strong><span>${escapeHtml(m.category)}${m.isCustom ? ' · Egen' : ''}${m.tags?.length ? ` · ${m.tags.map(escapeHtml).join(' · ')}` : ''}</span>`;
    b.onclick = () => {
      if (isWeekLocked()) {
        document.getElementById('mealDialog').close();
        toast('Uka er låst');
        return;
      }
      state.week[selectedDay] = m.id;
      state.history[m.id] = (state.history[m.id] || 0) + 1;
      save();
      renderWeek();
      document.getElementById('mealDialog').close();
    };
    el.appendChild(b);
  });
}

document.getElementById('dialogSearch').oninput = renderDialogMeals;

function renderMeals() {
  const meals = allMeals();
  const categories = ['Alle', ...new Set(meals.map(m => m.category).filter(Boolean))];
  if (!categories.includes(filter)) filter = 'Alle';
  document.getElementById('mealFilters').innerHTML = categories.map(c => `<button class="filter ${c===filter?'active':''}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('');
  document.querySelectorAll('.filter').forEach(b => b.onclick = () => { filter = b.dataset.cat; renderMeals(); });

  const q = document.getElementById('mealSearch').value.toLowerCase();
  const list = meals.filter(m => (filter === 'Alle' || m.category === filter) && m.name.toLowerCase().includes(q));
  const grid = document.getElementById('mealGrid');
  if (!list.length) {
    grid.innerHTML = '<div class="empty meal-grid-empty">Ingen middager matcher søket.</div>';
    return;
  }

  grid.innerHTML = list.map(m => {
    const url = safeExternalUrl(m.url);
    const ingredients = Array.isArray(m.ingredients) && m.ingredients.length
      ? m.ingredients.slice(0,5).map(i=>escapeHtml(i[0])).join(' · ')
      : 'Ingen ingredienser registrert';
    return `<article class="meal-card ${m.isCustom?'custom-meal-card':''}" data-meal-id="${escapeHtml(m.id)}">
      <div class="meal-card-top"><p class="eyebrow">${escapeHtml(m.category || 'Annet')}</p>${m.isCustom?'<span class="meal-source">Egen</span>':'<span class="meal-source default">Default</span>'}</div>
      <h3>${escapeHtml(m.name)}</h3>
      <p>${ingredients}</p>
      <div class="meal-card-footer">
        ${url?`<a href="${escapeHtml(url)}" target="_blank" rel="noopener">Åpne oppskrift ↗</a>`:'<span></span>'}
        ${m.isCustom?`<div class="meal-actions"><button type="button" class="meal-action edit-meal" data-id="${escapeHtml(m.id)}">Rediger</button><button type="button" class="meal-action danger delete-meal" data-id="${escapeHtml(m.id)}">Slett</button></div>`:''}
      </div>
    </article>`;
  }).join('');

  grid.querySelectorAll('.edit-meal').forEach(b => b.onclick = () => openCustomMealDialog(b.dataset.id));
  grid.querySelectorAll('.delete-meal').forEach(b => b.onclick = () => deleteCustomMeal(b.dataset.id));
}

document.getElementById('mealSearch').oninput = renderMeals;

function openCustomMealDialog(mealId = null) {
  if (!requireProfileForCustomMeal()) return;
  const meal = mealId ? (state.customMeals || []).find(m => m.id === mealId) : null;
  const form = document.getElementById('customMealForm');
  form.reset();
  form.elements.id.value = meal?.id || '';
  form.elements.name.value = meal?.name || '';
  form.elements.category.value = meal?.category || '';
  form.elements.ingredients.value = ingredientsToText(meal?.ingredients);
  form.elements.url.value = meal?.url || '';
  document.getElementById('customMealDialogTitle').textContent = meal ? 'Rediger middag' : 'Legg til middag';
  document.getElementById('customMealSubmit').textContent = meal ? 'Lagre endringer' : 'Legg til middag';
  document.getElementById('customMealDialog').showModal();
  setTimeout(() => form.elements.name.focus(), 30);
}

function deleteCustomMeal(mealId) {
  const meal = (state.customMeals || []).find(m => m.id === mealId);
  if (!meal) return;
  if (isWeekLocked() && Object.values(state.week).includes(mealId)) {
    toast('Lås opp uka før du sletter en middag som er i planen');
    return;
  }
  if (!confirm(`Slette «${meal.name}» fra denne profilen?`)) return;
  state.customMeals = state.customMeals.filter(m => m.id !== mealId);
  DAYS.forEach(day => { if (state.week[day] === mealId) delete state.week[day]; });
  delete state.history[mealId];
  save();
  renderAll();
  toast('Middagen er slettet');
}

document.getElementById('addMealBtn').onclick = () => openCustomMealDialog();
document.getElementById('closeCustomMealDialog').onclick = () => document.getElementById('customMealDialog').close();
document.getElementById('cancelCustomMealBtn').onclick = () => document.getElementById('customMealDialog').close();
document.getElementById('customMealForm').onsubmit = e => {
  e.preventDefault();
  if (!requireProfileForCustomMeal()) return;
  const fd = new FormData(e.currentTarget);
  const existingId = String(fd.get('id') || '');
  const name = String(fd.get('name') || '').trim().slice(0,120);
  const category = String(fd.get('category') || '').trim().slice(0,50) || 'Annet';
  const ingredients = parseIngredients(fd.get('ingredients'));
  const rawUrl = String(fd.get('url') || '').trim();
  const url = safeExternalUrl(rawUrl);
  if (!name) return;
  if (rawUrl && !url) { alert('Oppskriftslenken må starte med http:// eller https://'); return; }

  if (existingId) {
    const index = state.customMeals.findIndex(m => m.id === existingId);
    if (index < 0) return;
    state.customMeals[index] = {...state.customMeals[index], name, category, ingredients, url, tags:[]};
  } else {
    state.customMeals.unshift({id:`custom-${crypto.randomUUID()}`, name, category, ingredients, url, tags:[]});
  }

  save();
  renderAll();
  document.getElementById('customMealDialog').close();
  toast(existingId ? 'Middagen er oppdatert' : 'Middagen er lagt til');
};

function norm(s) { return String(s).toLowerCase().replace(/[^a-zæøå0-9 ]/g,'').trim(); }
function freezerCovers(item) {
  const n = norm(item);
  return state.freezer.some(f => norm(f.name).includes(n) || n.includes(norm(f.name)));
}

function buildShopping() {
  const map = new Map();
  Object.values(state.week).filter(Boolean).map(mealById).filter(Boolean).forEach(m => m.ingredients.forEach(([name,qty]) => {
    const key = norm(name);
    if (!map.has(key)) map.set(key,{name,qtys:[],meals:[]});
    map.get(key).qtys.push(qty);
    map.get(key).meals.push(m.name);
  }));
  return [...map.values()].filter(x => !freezerCovers(x.name)).sort((a,b) => a.name.localeCompare(b.name,'nb'));
}

function renderShopping() {
  const items = buildShopping();
  const el = document.getElementById('shoppingList');
  if (!items.length) {
    el.innerHTML = '<div class="empty">Ingen varer å handle fra planlagte middager.</div>';
    return;
  }
  el.innerHTML = items.map(x => {
    const key = norm(x.name);
    const done = !!state.shoppingDone[key];
    return `<label class="shopping-row ${done?'done':''}"><input type="checkbox" data-key="${escapeHtml(key)}" ${done?'checked':''}><div><div class="shopping-name">${escapeHtml(x.name)}</div><div class="shopping-sub">Til ${[...new Set(x.meals)].map(escapeHtml).join(', ')}</div></div><div class="qty">${x.qtys.map(escapeHtml).join(' + ')}</div></label>`;
  }).join('');
  el.querySelectorAll('input[type=checkbox]').forEach(c => c.onchange = () => {
    state.shoppingDone[c.dataset.key] = c.checked;
    save();
    renderShopping();
  });
}

function renderFreezer() {
  const el = document.getElementById('freezerList');
  el.innerHTML = state.freezer.length ? state.freezer.map(f => `<div class="freezer-row"><div><div class="shopping-name">${escapeHtml(f.name)}</div><div class="freezer-sub">${escapeHtml(f.qty)}</div></div><span class="location">${escapeHtml(f.location)}</span><button class="remove" data-id="${escapeHtml(f.id)}">Fjern</button></div>`).join('') : '<div class="empty">Fryseren er tom.</div>';
  el.querySelectorAll('.remove').forEach(b => b.onclick = () => {
    state.freezer = state.freezer.filter(f => f.id !== b.dataset.id);
    save();
    renderFreezer();
  });
}

function renderAll() {
  renderWeek();
  renderMeals();
  renderFreezer();
  if (document.getElementById('shoppingView').classList.contains('active')) renderShopping();
}

document.getElementById('addFreezerBtn').onclick = () => document.getElementById('freezerDialog').showModal();
document.getElementById('freezerForm').onsubmit = e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  state.freezer.push({id:crypto.randomUUID(),name:fd.get('name'),qty:fd.get('qty'),location:fd.get('location')});
  save();
  renderFreezer();
  e.currentTarget.reset();
  document.getElementById('freezerDialog').close();
};

document.getElementById('weekLockBtn').onclick = toggleWeekLock;
document.getElementById('clearWeekBtn').onclick = () => {
  if (isWeekLocked()) { toast('Uka er låst'); return; }
  state.week = {}; state.shoppingDone = {}; save(); renderWeek();
};
document.getElementById('autoPlanBtn').onclick = () => {
  if (isWeekLocked()) { toast('Uka er låst'); return; }
  const used = new Set();
  const weighted = allMeals().sort((a,b) => (state.history[b.id]||0) - (state.history[a.id]||0));
  if (!weighted.length) return;
  DAYS.forEach((day,idx) => {
    let pool = weighted.filter(m => !used.has(m.id));
    if (idx < 5) {
      const weekdayPool = pool.filter(m => !m.tags.includes('helg'));
      if (weekdayPool.length) pool = weekdayPool;
    }
    const pick = pool[Math.floor(Math.random()*Math.min(pool.length,12))] || weighted[idx%weighted.length];
    state.week[day] = pick.id;
    used.add(pick.id);
  });
  state.shoppingDone = {};
  save();
  renderWeek();
};

document.getElementById('regenShoppingBtn').onclick = renderShopping;
document.getElementById('syncBtn').onclick = async () => {
  if (!activeProfile) { openProfileDialog(); return; }
  await pushProfile(true);
};

document.getElementById('themeToggle').onclick = () => {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
};

document.getElementById('profileBtn').onclick = openProfileDialog;
document.getElementById('bannerProfileBtn').onclick = openProfileDialog;
document.getElementById('closeProfileDialog').onclick = closeProfileDialog;
document.getElementById('copyProfileLinkBtn').onclick = copyShareLink;

document.getElementById('createProfileForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const name = String(fd.get('name') || '').trim();
  if (!name) return;

  const id = crypto.randomUUID();
  // First profile keeps the tailored startdata from the original prototype.
  // Additional profiles start clean but use the same meal library.
  const hasAnyProfile = Object.keys(getProfiles()).length > 0;
  const initialState = hasAnyProfile ? defaultState(false) : ensureStateShape(state);
  setActiveProfile({id,name}, initialState);
  e.currentTarget.reset();
  await pushProfile(false);
  closeProfileDialog();
  toast(`Profilen «${name}» er klar`);
};

document.getElementById('joinProfileForm').onsubmit = async e => {
  e.preventDefault();
  const fd = new FormData(e.currentTarget);
  const id = extractProfileId(fd.get('code'));
  if (!id) { alert('Ugyldig profilkode eller delingslenke.'); return; }

  const button = e.currentTarget.querySelector('button[type=submit]');
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = 'Åpner…';
  try {
    const remote = await fetchProfile(id);
    setActiveProfile({id:remote.id,name:remote.name}, remote.state, remote.updatedAt);
    e.currentTarget.reset();
    closeProfileDialog();
    toast(`Åpnet «${remote.name}»`);
  } catch (error) {
    if (error.message === 'PROFILE_NOT_FOUND') alert('Fant ikke profilen. Sjekk at koden er riktig.');
    else if (error.message === 'API_NOT_CONFIGURED') alert('Cloudflare Worker er ikke konfigurert ennå, så profiler kan bare åpnes på denne enheten.');
    else alert('Kunne ikke åpne profilen akkurat nå.');
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
};

async function bootstrap() {
  initTheme();
  const params = new URLSearchParams(location.search);
  const queryProfile = extractProfileId(params.get('profile'));
  const profiles = getProfiles();
  const activeId = queryProfile || localStorage.getItem(STORAGE_ACTIVE);

  // Migrate the old v1 local state into the unprofiled start state once.
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_STATE) || 'null');
    if (legacy) state = ensureStateShape(legacy);
  } catch {}

  if (activeId) {
    try {
      const remote = await fetchProfile(activeId);
      setActiveProfile({id:remote.id,name:remote.name}, remote.state, remote.updatedAt);
      if (queryProfile) toast(`Synkronisert med «${remote.name}»`);
      return;
    } catch (error) {
      const cached = profiles[activeId];
      if (cached) {
        setActiveProfile({id:cached.id,name:cached.name}, cached.state);
        setSyncStatus(API_BASE ? 'Ikke synket' : 'Lokal profil');
        return;
      }
      if (queryProfile) {
        openProfileDialog();
        if (error.message === 'PROFILE_NOT_FOUND') alert('Delingslenken peker til en profil som ikke finnes.');
      }
    }
  }

  updateProfileUI();
  renderAll();
}

bootstrap();
