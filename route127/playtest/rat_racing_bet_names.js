/* Route 127 — Rat Racing named betting choices (graphics only).
 * Display-only: preserve the existing command, keyboard shortcut, race,
 * wagering, payouts, save state and Classic BBS behavior.
 * Load after rats_animated_race.js and graphics.js.
 */
(function () {
  'use strict';
  if (typeof GraphicalUI === 'undefined' || typeof casinoRound !== 'function') return;
  const names = typeof CASINO_RATS !== 'undefined' && CASINO_RATS.length === 4
    ? CASINO_RATS : ['Nibbles', 'Rustbucket', 'Sir Squeaks-a-Lot', 'Cheeseburger'];
  const previousChoices = GraphicalUI.choices;
  GraphicalUI.choices = function () {
    const choices = previousChoices.call(this);
    if (this.preference() !== 'graphics' ||
        typeof stage === 'undefined' || stage !== 'mercy' ||
        typeof mercyLocation === 'undefined' || mercyLocation !== 'casinoGame') return choices;
    const round = casinoRound();
    if (!round || round.game !== 'rats' || round.status !== 'waiting' || round.pick !== null) return choices;
    return choices.map(choice => {
      const match = String(choice.command).trim().match(/^rat\s*([1-4])(?:\b|$)/i);
      if (!match) return choice;
      const index = Number(match[1]) - 1;
      return { ...choice, label: names[index] };
    });
  };
  GraphicalUI.schedule();
})();
