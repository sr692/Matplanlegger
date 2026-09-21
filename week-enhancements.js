(() => {
  'use strict';

  const PRESENTATION_CLASS = 'week-presentation';
  let presentationActive = false;
  let fullscreenRequestedByApp = false;

  function strings() {
    const lang = (document.documentElement.lang || 'no').toLowerCase();
    const en = lang.startsWith('en');
    return {
      openRecipe: en ? 'Open recipe ↗' : 'Åpne oppskrift ↗',
      openRecipeAria: en ? 'Open recipe' : 'Åpne oppskrift',
      fullscreen: en ? 'Fullscreen' : 'Fullskjerm',
      exitFullscreen: en ? 'Exit fullscreen' : 'Avslutt fullskjerm',
      fullscreenTitle: en ? 'Show the meal plan in fullscreen' : 'Vis middagsplanen i fullskjerm',
      exitFullscreenTitle: en ? 'Exit fullscreen' : 'Avslutt fullskjerm',
      today: en ? 'Today' : 'I dag'
    };
  }

  function fullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
  }

  function safeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch {
      return '';
    }
  }

  function mealForDay(day) {
    try {
      if (typeof state === 'undefined' || !state?.week) return null;
      const mealId = state.week[day];
      if (!mealId) return null;
      if (typeof mealById === 'function') return mealById(mealId) || null;
      return null;
    } catch {
      return null;
    }
  }

  function getTodayInternalDay() {
    const days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
    return days[new Date().getDay()];
  }

  function markTodayCard(card) {
    const shouldBeToday = card.dataset.day === getTodayInternalDay();
    const existingBadge = card.querySelector('.week-today-badge');

    card.classList.toggle('is-today', shouldBeToday);

    if (!shouldBeToday) {
      existingBadge?.remove();
      return;
    }

    if (existingBadge) {
      existingBadge.textContent = strings().today;
      return;
    }

    const dayTop = card.querySelector('.day-top');
    if (!dayTop) return;

    const badge = document.createElement('span');
    badge.className = 'week-today-badge';
    badge.textContent = strings().today;
    dayTop.appendChild(badge);
  }

  function addRecipeAction(card) {
    if (!card) return;

    const day = card.dataset.day;
    const meal = mealForDay(day);
    const url = safeUrl(meal?.url);
    const existing = card.querySelector('.week-recipe-btn');

    if (!url) {
      existing?.remove();
      return;
    }

    const copy = strings();
    if (existing) {
      if (existing.href !== url) existing.href = url;
      if (existing.textContent !== copy.openRecipe) existing.textContent = copy.openRecipe;
      existing.setAttribute('aria-label', copy.openRecipeAria);
      return;
    }

    const action = document.createElement('a');
    action.className = 'week-recipe-btn';
    action.href = url;
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    action.textContent = copy.openRecipe;
    action.setAttribute('aria-label', copy.openRecipeAria);
    action.addEventListener('click', event => event.stopPropagation());
    action.addEventListener('pointerdown', event => event.stopPropagation());

    card.appendChild(action);
  }

  function enhanceWeekCards() {
    document.querySelectorAll('#weekGrid .day-card').forEach(card => {
      markTodayCard(card);
      addRecipeAction(card);
    });
  }

  function ensureStyles() {
    if (document.getElementById('weekEnhancementStyles')) return;
    const style = document.createElement('style');
    style.id = 'weekEnhancementStyles';
    style.textContent = `
      .week-display-btn{display:inline-flex;align-items:center;justify-content:center;gap:.42rem;white-space:nowrap}
      .week-display-icon{font-size:1rem;line-height:1}
      .week-recipe-btn{display:inline-flex;align-items:center;justify-content:center;width:max-content;max-width:100%;margin-top:auto;padding:.52rem .7rem;border:1px solid var(--line,#d9d5ca);border-radius:999px;background:color-mix(in srgb,var(--surface,#fff) 88%,transparent);color:inherit;text-decoration:none;font-size:.75rem;font-weight:800;line-height:1;transition:transform .16s ease,border-color .16s ease,background .16s ease}
      .week-recipe-btn:hover{transform:translateY(-1px);border-color:currentColor}
      .week-recipe-btn:focus-visible{outline:2px solid currentColor;outline-offset:2px}
      .day-card:has(.week-recipe-btn) .day-tags{margin-bottom:.65rem}
      .week-today-badge{display:inline-flex;align-items:center;justify-content:center;margin-left:auto;padding:.28rem .55rem;border-radius:999px;background:color-mix(in srgb,var(--accent,#c08b43) 16%,white);color:var(--text,#2e2a24);font-size:.68rem;font-weight:800;letter-spacing:.04em;text-transform:uppercase;border:1px solid color-mix(in srgb,var(--accent,#c08b43) 30%,transparent)}
      #weekGrid .day-card.is-today:not(.drop-target){border-color:color-mix(in srgb,var(--accent,#c08b43) 42%, var(--line,#d9d5ca));box-shadow:0 10px 24px rgba(0,0,0,.08)}

      body.${PRESENTATION_CLASS}{overflow:hidden}
      body.${PRESENTATION_CLASS} .topbar,
      body.${PRESENTATION_CLASS} .profile-banner,
      body.${PRESENTATION_CLASS} .hero,
      body.${PRESENTATION_CLASS} .tabs,
      body.${PRESENTATION_CLASS} #shoppingView,
      body.${PRESENTATION_CLASS} #mealsView,
      body.${PRESENTATION_CLASS} #freezerView,
      body.${PRESENTATION_CLASS} .app-note,
      body.${PRESENTATION_CLASS} .footer{display:none!important}
      body.${PRESENTATION_CLASS} .shell{width:100%;max-width:none;margin:0;padding:0;min-height:100dvh}
      body.${PRESENTATION_CLASS} #weekView{display:flex!important;flex-direction:column;align-items:center;justify-content:center;box-sizing:border-box;width:100%;min-height:100dvh;margin:0;padding:clamp(20px,3vw,36px);overflow:hidden;gap:clamp(14px,1.6vw,24px)}
      body.${PRESENTATION_CLASS} #weekView .section-head{width:min(92vw,1560px);max-width:1560px;flex:0 0 auto;margin:0;align-items:center;gap:18px}
      body.${PRESENTATION_CLASS} #weekView .section-head h2{font-size:clamp(1.6rem,2.25vw,2.45rem)}
      body.${PRESENTATION_CLASS} #weekView .section-head .eyebrow{margin-bottom:.35rem}
      body.${PRESENTATION_CLASS} #weekView .week-head-actions{flex-wrap:wrap;justify-content:flex-end;gap:10px}
      body.${PRESENTATION_CLASS} #weekView .hint{display:none}
      body.${PRESENTATION_CLASS} #weekGrid{display:flex;flex-wrap:wrap;justify-content:center;align-items:stretch;align-content:center;gap:clamp(12px,1.2vw,18px);width:min(92vw,1560px);max-width:1560px;overflow:visible}
      body.${PRESENTATION_CLASS} #weekGrid .day-card{box-sizing:border-box;display:flex;flex-direction:column;flex:1 1 180px;min-width:168px;max-width:210px;min-height:240px;padding:clamp(14px,1.15vw,18px);border-radius:20px;overflow:hidden;background:var(--surface,#fff);box-shadow:0 12px 28px rgba(0,0,0,.06)}
      body.${PRESENTATION_CLASS} #weekGrid .day-card.is-today{flex-basis:230px;max-width:260px;transform:translateY(-5px);background:color-mix(in srgb,var(--surface,#fff) 85%, var(--accent,#c08b43) 15%);box-shadow:0 18px 36px rgba(0,0,0,.12)}
      body.${PRESENTATION_CLASS} #weekGrid .day-top{gap:8px;align-items:flex-start}
      body.${PRESENTATION_CLASS} #weekGrid .day-name{font-size:clamp(.74rem,.84vw,.88rem);letter-spacing:.12em}
      body.${PRESENTATION_CLASS} #weekGrid .day-meal{font-size:clamp(1rem,1.2vw,1.24rem);line-height:1.18;margin-top:clamp(8px,1vw,14px);display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
      body.${PRESENTATION_CLASS} #weekGrid .is-today .day-meal{font-size:clamp(1.05rem,1.35vw,1.4rem);-webkit-line-clamp:5}
      body.${PRESENTATION_CLASS} #weekGrid .day-meta{font-size:clamp(.74rem,.82vw,.84rem)}
      body.${PRESENTATION_CLASS} #weekGrid .day-tags{display:flex;flex-wrap:wrap;gap:6px;min-height:28px;overflow:hidden}
      body.${PRESENTATION_CLASS} #weekGrid .tag{font-size:clamp(.62rem,.72vw,.74rem)}
      body.${PRESENTATION_CLASS} #weekGrid .week-recipe-btn{margin-top:auto;font-size:clamp(.7rem,.78vw,.8rem)}
      body.${PRESENTATION_CLASS} #weekGrid .day-empty{font-size:clamp(.9rem,1vw,1rem);margin-top:clamp(14px,2vw,22px)}
      body.${PRESENTATION_CLASS} #weekGrid .day-lock,
      body.${PRESENTATION_CLASS} #weekGrid .drag-handle{display:none!important}

      @media (max-width:1100px){
        body.${PRESENTATION_CLASS}{overflow:auto}
        body.${PRESENTATION_CLASS} #weekView{justify-content:flex-start;min-height:100dvh;overflow:auto}
        body.${PRESENTATION_CLASS} #weekView .section-head{width:min(94vw,1100px)}
        body.${PRESENTATION_CLASS} #weekGrid{width:min(94vw,1100px)}
        body.${PRESENTATION_CLASS} #weekGrid .day-card{flex:1 1 210px;max-width:none;min-height:220px}
        body.${PRESENTATION_CLASS} #weekGrid .day-card.is-today{flex-basis:calc(50% - 10px);max-width:none}
      }
      @media (max-width:700px){
        body.${PRESENTATION_CLASS} #weekView{padding:16px 14px 22px}
        body.${PRESENTATION_CLASS} #weekView .section-head{width:100%;align-items:flex-start}
        body.${PRESENTATION_CLASS} #weekView .week-head-actions{justify-content:flex-start}
        body.${PRESENTATION_CLASS} #weekGrid{width:100%;gap:12px}
        body.${PRESENTATION_CLASS} #weekGrid .day-card,
        body.${PRESENTATION_CLASS} #weekGrid .day-card.is-today{flex:1 1 calc(50% - 12px);min-width:0;max-width:none;transform:none}
      }
    `;
    document.head.appendChild(style);
  }

  function updatePresentationButton() {
    const button = document.getElementById('weekFullscreenBtn');
    if (!button) return;
    const label = button.querySelector('.week-display-label');
    const icon = button.querySelector('.week-display-icon');
    const active = presentationActive || !!fullscreenElement();
    const copy = strings();
    if (label) label.textContent = active ? copy.exitFullscreen : copy.fullscreen;
    if (icon) icon.textContent = active ? '×' : '⛶';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? copy.exitFullscreenTitle : copy.fullscreenTitle);
    button.title = active ? copy.exitFullscreenTitle : copy.fullscreenTitle;
  }

  async function enterPresentation() {
    presentationActive = true;
    document.body.classList.add(PRESENTATION_CLASS);
    updatePresentationButton();
    window.scrollTo(0, 0);

    if (!fullscreenElement()) {
      const request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (request) {
        try {
          fullscreenRequestedByApp = true;
          try { await request.call(document.documentElement, {navigationUI: 'hide'}); }
          catch { await request.call(document.documentElement); }
        } catch {
          fullscreenRequestedByApp = false;
        }
      }
    }
  }

  async function exitPresentation() {
    presentationActive = false;
    document.body.classList.remove(PRESENTATION_CLASS);
    updatePresentationButton();

    if (fullscreenElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      if (exit) { try { await exit.call(document); } catch {} }
    }
    fullscreenRequestedByApp = false;
  }

  function togglePresentation() {
    if (presentationActive || fullscreenElement()) exitPresentation();
    else enterPresentation();
  }

  function installPresentationButton() {
    if (document.getElementById('weekFullscreenBtn')) return;
    const actions = document.querySelector('#weekView .week-head-actions');
    if (!actions) return;

    const button = document.createElement('button');
    button.id = 'weekFullscreenBtn';
    button.className = 'week-lock week-display-btn';
    button.type = 'button';
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<span class="week-display-icon" aria-hidden="true">⛶</span><span class="week-display-label"></span>';
    button.addEventListener('click', togglePresentation);

    actions.insertBefore(button, actions.firstChild);
    updatePresentationButton();
  }

  function onFullscreenChange() {
    if (!fullscreenElement() && fullscreenRequestedByApp) {
      fullscreenRequestedByApp = false;
      presentationActive = false;
      document.body.classList.remove(PRESENTATION_CLASS);
    }
    updatePresentationButton();
  }

  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && presentationActive && !fullscreenElement()) exitPresentation();
  });

  const weekGrid = document.getElementById('weekGrid');
  if (weekGrid) {
    let enhanceFrame = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(enhanceFrame);
      enhanceFrame = requestAnimationFrame(enhanceWeekCards);
    });
    // renderWeek() replaces the day cards as direct children of #weekGrid.
    // Watching only that level prevents our own badge/button updates from retriggering the observer.
    observer.observe(weekGrid, {childList: true});
  }

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) queueMicrotask(enhanceWeekCards);
  });

  window.addEventListener('matplan:languagechange', () => {
    requestAnimationFrame(() => {
      enhanceWeekCards();
      updatePresentationButton();
    });
  });

  ensureStyles();
  installPresentationButton();
  enhanceWeekCards();
})();
