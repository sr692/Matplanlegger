'use strict';

const API_BASE = (window.MATPLAN_API || '').replace(/\/$/, '');
const TOKEN_KEY = 'matplan-admin-token-v1';
const USER_KEY = 'matplan-admin-user-v1';

const $ = id => document.getElementById(id);
let meals = [];
let mealSearch = '';

function setMessage(element, message = '', type = '') {
  element.textContent = message;
  element.className = `admin-message${type ? ` ${type}` : ''}`;
}

function token() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

function setSession(value, username) {
  if (value) {
    sessionStorage.setItem(TOKEN_KEY, value);
    sessionStorage.setItem(USER_KEY, username || 'sebastian');
  } else {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
  }
}

async function api(path, options = {}, {auth = true} = {}) {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (auth && token()) headers.set('authorization', `Bearer ${token()}`);

  const response = await fetch(`${API_BASE}${path}`, {...options, headers, cache:'no-store'});
  let data = null;
  try { data = await response.json(); } catch {}

  if (response.status === 401 && auth) {
    showLogin('Adminøkten er utløpt. Logg inn på nytt.');
    throw new Error('UNAUTHORIZED');
  }
  if (!response.ok) {
    const error = new Error(data?.error || `HTTP_${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function showLogin(message = '') {
  setSession('', '');
  $('loginPanel').classList.remove('hidden');
  $('adminPanel').classList.add('hidden');
  $('logoutBtn').classList.add('hidden');
  $('adminIdentity').classList.add('hidden');
  if (message) setMessage($('loginMessage'), message, 'error');
}

function showAdmin(username) {
  $('loginPanel').classList.add('hidden');
  $('adminPanel').classList.remove('hidden');
  $('logoutBtn').classList.remove('hidden');
  $('adminIdentity').textContent = `Admin: ${username || sessionStorage.getItem(USER_KEY) || 'sebastian'}`;
  $('adminIdentity').classList.remove('hidden');
  setMessage($('loginMessage'));
}

function ingredientsFromText(value) {
  return String(value || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const [name, ...rest] = line.split('|');
      return [String(name || '').trim(), rest.join('|').trim()];
    })
    .filter(([name]) => name);
}

function ingredientsToText(value) {
  return (Array.isArray(value) ? value : [])
    .map(row => `${row?.[0] || ''}${row?.[1] ? ` | ${row[1]}` : ''}`)
    .join('\n');
}

function tagsFromText(value) {
  return [...new Set(String(value || '').split(',').map(tag => tag.trim()).filter(Boolean))];
}

function resetEditor() {
  const form = $('mealForm');
  form.reset();
  form.elements.id.value = '';
  $('editorTitle').textContent = 'Legg til middag';
  $('saveMealBtn').textContent = 'Legg til som Default';
  $('cancelEditBtn').classList.add('hidden');
  setMessage($('formMessage'));
}

function editMeal(meal) {
  const form = $('mealForm');
  form.elements.id.value = meal.id;
  form.elements.name.value = meal.name || '';
  form.elements.category.value = meal.category || '';
  form.elements.tags.value = (meal.tags || []).join(', ');
  form.elements.ingredients.value = ingredientsToText(meal.ingredients);
  form.elements.url.value = meal.url || '';
  $('editorTitle').textContent = 'Rediger Default-middag';
  $('saveMealBtn').textContent = 'Lagre endringer';
  $('cancelEditBtn').classList.remove('hidden');
  setMessage($('formMessage'));
  window.scrollTo({top:0,behavior:'smooth'});
}

function mealCard(meal) {
  const card = document.createElement('article');
  card.className = 'admin-meal-card';

  const head = document.createElement('div');
  head.className = 'admin-meal-card-head';
  const heading = document.createElement('div');
  const title = document.createElement('h3');
  title.textContent = meal.name;
  heading.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'admin-meal-meta';
  const category = document.createElement('span');
  category.className = 'admin-pill';
  category.textContent = meal.category || 'Annet';
  meta.appendChild(category);
  for (const tag of meal.tags || []) {
    const pill = document.createElement('span');
    pill.className = 'admin-pill';
    pill.textContent = tag;
    meta.appendChild(pill);
  }
  heading.appendChild(meta);
  head.appendChild(heading);

  const actions = document.createElement('div');
  actions.className = 'admin-meal-actions';
  const edit = document.createElement('button');
  edit.type = 'button';
  edit.className = 'secondary';
  edit.textContent = 'Rediger';
  edit.addEventListener('click', () => editMeal(meal));
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'ghost admin-danger';
  remove.textContent = 'Slett';
  remove.addEventListener('click', () => deleteMeal(meal));
  actions.append(edit, remove);
  head.appendChild(actions);
  card.appendChild(head);

  const ingredients = document.createElement('p');
  ingredients.className = 'admin-ingredients';
  ingredients.textContent = (meal.ingredients || []).length
    ? meal.ingredients.map(row => `${row[0]}${row[1] ? ` (${row[1]})` : ''}`).join(' · ')
    : 'Ingen ingredienser registrert';
  card.appendChild(ingredients);

  if (meal.url) {
    const link = document.createElement('a');
    link.href = meal.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Åpne oppskrift ↗';
    card.appendChild(link);
  }

  return card;
}

function renderMeals() {
  const host = $('mealList');
  host.replaceChildren();
  const query = mealSearch.trim().toLocaleLowerCase('no-NO');
  const visibleMeals = query
    ? meals.filter(meal => [meal.name, meal.category, ...(meal.tags || [])].join(' ').toLocaleLowerCase('no-NO').includes(query))
    : meals;

  if (!visibleMeals.length) {
    const empty = document.createElement('div');
    empty.className = 'admin-empty';
    empty.textContent = meals.length ? 'Ingen Default-middager matcher søket.' : 'Ingen Default-middager finnes i D1 ennå.';
    host.appendChild(empty);
    return;
  }
  for (const meal of visibleMeals) host.appendChild(mealCard(meal));
}

async function loadMeals() {
  $('refreshBtn').disabled = true;
  try {
    const data = await api('/api/admin/default-meals');
    meals = Array.isArray(data?.meals) ? data.meals : [];
    renderMeals();
  } finally {
    $('refreshBtn').disabled = false;
  }
}

async function deleteMeal(meal) {
  if (!confirm(`Slette «${meal.name}» som global Default-middag?`)) return;
  try {
    await api(`/api/admin/default-meals/${encodeURIComponent(meal.id)}`, {method:'DELETE'});
    meals = meals.filter(item => item.id !== meal.id);
    renderMeals();
    if ($('mealForm').elements.id.value === meal.id) resetEditor();
  } catch (error) {
    alert(error.message === 'meal_not_found' ? 'Middagen finnes ikke lenger.' : 'Kunne ikke slette middagen.');
  }
}

$('loginForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (!API_BASE) {
    setMessage($('loginMessage'), 'Worker-URL mangler.', 'error');
    return;
  }

  const form = event.currentTarget;
  const button = $('loginBtn');
  button.disabled = true;
  setMessage($('loginMessage'), 'Logger inn…');
  try {
    const data = await api('/api/admin/login', {
      method:'POST',
      body:JSON.stringify({username:form.elements.username.value.trim(),password:form.elements.password.value})
    }, {auth:false});
    setSession(data.token, data.username);
    form.elements.password.value = '';
    showAdmin(data.username);
    await loadMeals();
  } catch (error) {
    const message = error.message === 'admin_not_configured'
      ? 'Admin er ikke konfigurert i Cloudflare Worker ennå.'
      : 'Feil brukernavn eller passord.';
    setMessage($('loginMessage'), message, 'error');
  } finally {
    button.disabled = false;
  }
});

$('mealForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const id = form.elements.id.value;
  const payload = {
    name:form.elements.name.value.trim(),
    category:form.elements.category.value.trim() || 'Annet',
    tags:tagsFromText(form.elements.tags.value),
    ingredients:ingredientsFromText(form.elements.ingredients.value),
    url:form.elements.url.value.trim()
  };

  $('saveMealBtn').disabled = true;
  setMessage($('formMessage'), id ? 'Lagrer endringer…' : 'Legger til middag…');
  try {
    await api(id ? `/api/admin/default-meals/${encodeURIComponent(id)}` : '/api/admin/default-meals', {
      method:id ? 'PUT' : 'POST',
      body:JSON.stringify(payload)
    });
    resetEditor();
    setMessage($('formMessage'), id ? 'Endringene er lagret.' : 'Middagen er lagt til for alle profiler.', 'success');
    await loadMeals();
  } catch (error) {
    const message = error.message === 'invalid_url' ? 'Oppskriftslenken er ugyldig.' : 'Kunne ikke lagre middagen.';
    setMessage($('formMessage'), message, 'error');
  } finally {
    $('saveMealBtn').disabled = false;
  }
});

$('cancelEditBtn').addEventListener('click', resetEditor);
$('refreshBtn').addEventListener('click', () => loadMeals().catch(() => {}));
$('mealSearch').addEventListener('input', event => {
  mealSearch = event.currentTarget.value || '';
  renderMeals();
});
$('logoutBtn').addEventListener('click', () => {
  showLogin();
  $('loginForm').elements.password.value = '';
});

(async function bootstrap() {
  if (!API_BASE) {
    showLogin('Worker-URL mangler.');
    return;
  }
  if (!token()) {
    showLogin();
    return;
  }
  try {
    showAdmin(sessionStorage.getItem(USER_KEY));
    await loadMeals();
  } catch {
    showLogin();
  }
})();
