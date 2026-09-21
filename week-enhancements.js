(() => {
  'use strict';

  const PRESENTATION_CLASS = 'week-presentation';
  let presentationActive = false;
  let fullscreenRequestedByApp = false;

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

  function addRecipeAction(card) {
    if (!card || card.dataset.recipeEnhanced === '1') return;
    card.dataset.recipeEnhanced = '1';

    const day = card.dataset.day;
    const meal = mealForDay(day);
    const url = safeUrl(meal?.url);
    if (!url) return;

    const action = document.createElement('a');
    action.className = 'week-recipe-btn';
    action.href = url;
    action.target = '_blank';
    action.rel = 'noopener noreferrer';
    action.textContent = 'Åpne oppskrift ↗';
    action.setAttribute('aria-label', 'Åpne oppskrift');
    action.addEventListener('click', event => event.stopPropagation());
    action.addEventListener('pointerdown', event => event.stopPropagation());

    card.appendChild(action);
  }

  function enhanceWeekCards() {
    document.querySelectorAll('#weekGrid .day-card').forEach(addRecipeAction);
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
      body.${PRESENTATION_CLASS} #weekView{display:flex!important;flex-direction:column;box-sizing:border-box;width:100%;height:100dvh;min-height:100vh;margin:0;padding:clamp(16px,2vw,32px);overflow:hidden}
      body.${PRESENTATION_CLASS} #weekView .section-head{flex:0 0 auto;margin:0 0 clamp(12px,1.5vw,24px);align-items:center}
      body.${PRESENTATION_CLASS} #weekView .section-head h2{font-size:clamp(1.7rem,2.5vw,3rem)}
      body.${PRESENTATION_CLASS} #weekView .hint{display:none}
      body.${PRESENTATION_CLASS} #weekGrid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));grid-template-rows:minmax(0,1fr);gap:clamp(8px,1vw,16px);flex:1 1 auto;min-height:0;overflow:hidden}
      body.${PRESENTATION_CLASS} #weekGrid .day-card{box-sizing:border-box;min-width:0;min-height:0;height:100%;padding:clamp(12px,1.2vw,22px);overflow:hidden;display:flex;flex-direction:column}
      body.${PRESENTATION_CLASS} #weekGrid .day-name{font-size:clamp(.78rem,1vw,1rem)}
      body.${PRESENTATION_CLASS} #weekGrid .day-meal{font-size:clamp(1rem,1.55vw,1.65rem);line-height:1.15;margin-top:clamp(12px,1.5vw,24px)}
      body.${PRESENTATION_CLASS} #weekGrid .day-meta{font-size:clamp(.72rem,.9vw,.95rem)}
      body.${PRESENTATION_CLASS} #weekGrid .tag{font-size:clamp(.62rem,.72vw,.78rem)}
      body.${PRESENTATION_CLASS} #weekGrid .week-recipe-btn{margin-top:auto;font-size:clamp(.68rem,.78vw,.82rem)}
      body.${PRESENTATION_CLASS} #weekGrid .day-empty{font-size:clamp(.9rem,1.2vw,1.25rem)}

      @media(max-width:1000px){
        body.${PRESENTATION_CLASS} #weekView{overflow:auto}
        body.${PRESENTATION_CLASS} #weekGrid{grid-template-columns:repeat(4,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));overflow:visible}
        body.${PRESENTATION_CLASS} #weekGrid .day-card{min-height:0}
        body.${PRESENTATION_CLASS} #weekGrid .day-meal{font-size:clamp(1rem,2.15vw,1.35rem)}
      }
      @media(max-width:620px){
        body.${PRESENTATION_CLASS}{overflow:auto}
        body.${PRESENTATION_CLASS} #weekView{height:auto;min-height:100dvh;overflow:visible}
        body.${PRESENTATION_CLASS} #weekGrid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:none;flex:none}
        body.${PRESENTATION_CLASS} #weekGrid .day-card{min-height:190px}
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
    if (label) label.textContent = active ? 'Avslutt fullskjerm' : 'Fullskjerm';
    if (icon) icon.textContent = active ? '×' : '⛶';
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute('aria-label', active ? 'Avslutt fullskjerm' : 'Vis middagsplanen i fullskjerm');
    button.title = active ? 'Avslutt fullskjerm' : 'Vis middagsplanen i fullskjerm';
  }

  async function enterPresentation() {
    presentationActive = true;
    document.body.classList.add(PRESENTATION_CLASS);
    updatePresentationButton();
    window.scrollTo({top: 0, left: 0, behavior: 'instant'});

    if (!fullscreenElement()) {
      const request = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
      if (request) {
        try {
          fullscreenRequestedByApp = true;
          try { await request.call(document.documentElement, {navigationUI: 'hide'}); }
          catch { await request.call(document.documentElement); }
        } catch {
          fullscreenRequestedByApp = false;
          // CSS presentation mode remains active as a fallback (notably useful on tablets/TV browsers).
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
    button.innerHTML = '<span class="week-display-icon" aria-hidden="true">⛶</span><span class="week-display-label">Fullskjerm</span>';
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
    new MutationObserver(() => queueMicrotask(enhanceWeekCards)).observe(weekGrid, {childList: true, subtree: true});
  }

  ensureStyles();
  installPresentationButton();
  enhanceWeekCards();
})();
