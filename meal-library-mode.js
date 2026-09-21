(() => {
  'use strict';

  // Stored inside history because history is already part of the synced profile shape.
  // This avoids changing the Worker/API schema while keeping the choice profile-specific.
  const CUSTOM_ONLY_KEY = '__matplan_custom_only__';
  const originalAllMeals = typeof allMeals === 'function' ? allMeals : null;
  const originalRenderMeals = typeof renderMeals === 'function' ? renderMeals : null;

  function customOnlyEnabled() {
    try {
      return state?.history?.[CUSTOM_ONLY_KEY] === true;
    } catch {
      return false;
    }
  }

  function ensureHistory() {
    if (!state.history || typeof state.history !== 'object') state.history = {};
    return state.history;
  }

  // All existing app features (meal dialog, auto-plan and meal bank) call allMeals(),
  // so filtering here makes the mode work consistently everywhere.
  if (originalAllMeals) {
    allMeals = function patchedAllMeals() {
      const meals = originalAllMeals();
      return customOnlyEnabled() ? meals.filter(meal => meal.isCustom) : meals;
    };
  }

  function setBlankMealLibrary() {
    if (typeof activeProfile === 'undefined' || !activeProfile) {
      if (typeof openProfileDialog === 'function') openProfileDialog();
      if (typeof toast === 'function') toast('Velg en husholdningsprofil først');
      return;
    }

    const confirmed = window.confirm(
      'Dette fjerner alle egne middager fra denne profilen, skjuler standardmiddagene og tømmer ukeplanen. Fryseren beholdes. Vil du fortsette?'
    );
    if (!confirmed) return;

    state.customMeals = [];
    state.week = {};
    state.shoppingDone = {};
    state.history = {[CUSTOM_ONLY_KEY]: true};
    state.weekLocked = false;

    if (typeof save === 'function') save();
    if (typeof renderAll === 'function') renderAll();
    updateControls();
    if (typeof toast === 'function') toast('Middagsbanken er tømt – profilen bruker nå kun egne middager');
  }

  function restoreBuiltInMeals() {
    if (typeof activeProfile === 'undefined' || !activeProfile) {
      if (typeof openProfileDialog === 'function') openProfileDialog();
      return;
    }

    const history = ensureHistory();
    delete history[CUSTOM_ONLY_KEY];

    if (typeof save === 'function') save();
    if (typeof renderAll === 'function') renderAll();
    updateControls();
    if (typeof toast === 'function') toast('Standardmiddagene er tilgjengelige igjen');
  }

  function handleModeClick() {
    if (customOnlyEnabled()) restoreBuiltInMeals();
    else setBlankMealLibrary();
  }

  function installStyles() {
    if (document.getElementById('mealLibraryModeStyles')) return;
    const style = document.createElement('style');
    style.id = 'mealLibraryModeStyles';
    style.textContent = `
      #mealsView .section-actions{flex-wrap:wrap}
      .meal-library-mode-btn{white-space:nowrap}
      .meal-library-mode-btn.blank-mode{border-color:color-mix(in srgb,var(--accent,#c08b43) 42%,var(--line,#d9d5ca));background:color-mix(in srgb,var(--accent,#c08b43) 9%,var(--surface,#fff))}
      .meal-library-status{display:inline-flex;align-items:center;gap:.42rem;padding:.42rem .62rem;border-radius:999px;border:1px solid color-mix(in srgb,var(--accent,#c08b43) 32%,var(--line,#d9d5ca));background:color-mix(in srgb,var(--accent,#c08b43) 10%,var(--surface,#fff));font-size:.72rem;font-weight:800;line-height:1;white-space:nowrap}
      .meal-library-status::before{content:'';width:7px;height:7px;border-radius:50%;background:var(--accent,#c08b43)}
      @media(max-width:760px){
        #mealsView .section-actions{width:100%}
        #mealsView .section-actions .search{flex:1 1 100%}
        .meal-library-mode-btn,#addMealBtn{flex:1 1 auto}
      }
    `;
    document.head.appendChild(style);
  }

  function installControls() {
    const host = document.querySelector('#mealsView .section-actions');
    if (!host) return;

    let button = document.getElementById('mealLibraryModeBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'mealLibraryModeBtn';
      button.type = 'button';
      button.className = 'secondary meal-library-mode-btn';
      button.addEventListener('click', handleModeClick);
      const addButton = document.getElementById('addMealBtn');
      if (addButton) host.insertBefore(button, addButton);
      else host.appendChild(button);
    }

    let status = document.getElementById('mealLibraryStatus');
    if (!status) {
      status = document.createElement('span');
      status.id = 'mealLibraryStatus';
      status.className = 'meal-library-status';
      status.hidden = true;
      if (button.nextSibling) host.insertBefore(status, button.nextSibling);
      else host.appendChild(status);
    }

    updateControls();
  }

  function updateControls() {
    const button = document.getElementById('mealLibraryModeBtn');
    const status = document.getElementById('mealLibraryStatus');
    const blank = customOnlyEnabled();
    const hasProfile = typeof activeProfile !== 'undefined' && !!activeProfile;

    if (button) {
      button.textContent = blank ? 'Gjenopprett standardmiddager' : 'Tøm middagsbank';
      button.title = blank ? 'Vis standardmiddagene igjen' : 'Tøm alle middager og start med blank middagsbank';
      button.disabled = !hasProfile;
      button.classList.toggle('blank-mode', blank);
    }
    if (status) {
      status.hidden = !blank;
      status.textContent = 'Kun egne middager';
    }

    if (blank) {
      const grid = document.getElementById('mealGrid');
      const customCount = Array.isArray(state?.customMeals) ? state.customMeals.length : 0;
      if (grid && customCount === 0) {
        grid.innerHTML = '<div class="empty meal-grid-empty">Middagsbanken er tom. Legg til dine egne middager.</div>';
      }
    }
  }

  // Keep the controls correct whenever the normal meal library rerenders.
  if (originalRenderMeals) {
    renderMeals = function patchedRenderMeals() {
      const result = originalRenderMeals();
      queueMicrotask(updateControls);
      return result;
    };
  }

  window.addEventListener('matplan:languagechange', () => queueMicrotask(updateControls));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) queueMicrotask(updateControls);
  });

  installStyles();
  installControls();

  // app.js may still be finishing an async profile load. Refresh once more after it settles.
  setTimeout(() => {
    if (typeof renderMeals === 'function') renderMeals();
    updateControls();
  }, 400);
})();
