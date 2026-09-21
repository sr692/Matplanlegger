(() => {
  'use strict';

  if (!Array.isArray(window.MEALS)) return;

  const asianTacoBowl = window.MEALS.find(meal => meal.id === 'asiatisk-taco-bowl');
  if (asianTacoBowl) {
    asianTacoBowl.url = 'https://www.instagram.com/reel/DOIgBbmghEm/';
  }
})();
