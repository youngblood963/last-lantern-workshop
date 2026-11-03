/* Route 127 — Wasteland Rock / Paper / Scissors object animation.
 * Non-invasive visual add-on. Load AFTER casino_menu_graphics.js.
 * Keeps original game logic, existing buttons, wagers, BBS and other games.
 */
(function () {
  'use strict';
  if (typeof GraphicalUI === 'undefined' || typeof casinoRound !== 'function') return;

  const choices = ['rock', 'paper', 'scissors'];
  const images = Object.fromEntries(choices.map(c => [c, 'assets/locations/rps_' + c + '.png']));
  const isRps = () => stage === 'mercy' && mercyLocation === 'casinoGame' && casinoRound()?.game === 'rps';
  const isGraphics = () => GraphicalUI.preference() === 'graphics';
  let lastRound = '', activeTimer = null, finishTimer = null;

  const style = document.createElement('style');
  style.textContent = `
  /* Old 3D-ish gesture art is intentionally superseded; no game controls changed. */
  body.full-graphics .gfx-frame[data-layout="casino-rps"] .r127-rps-stage { display:none!important; }
  .r127-rps-objects {
    position:absolute;inset:0;z-index:5;overflow:hidden;pointer-events:none;
    background:#25160e url('assets/locations/rps_casino_floor.png') center / 100% 100% no-repeat;
    isolation:isolate;
  }
  .r127-rps-object {
    position:absolute;left:50%;width:30%;height:69%;object-fit:contain;
    transform:translateX(-50%);filter:drop-shadow(5px 9px 6px #080605ba);
    image-rendering:auto;user-select:none;pointer-events:none;
  }
  .r127-rps-object.north { top:-13%; }
  .r127-rps-object.south { top:42%; }
  .r127-rps-object.north.reveal { animation:r127-rps-arrive-north .32s cubic-bezier(.2,.8,.2,1) both; }
  .r127-rps-object.south.reveal { animation:r127-rps-arrive-south .32s cubic-bezier(.2,.8,.2,1) both; }
  @keyframes r127-rps-arrive-north {
    from {transform:translate(-50%,-35%) scale(.89);opacity:.65}
    to {transform:translate(-50%,0) scale(1);opacity:1}
  }
  @keyframes r127-rps-arrive-south {
    from {transform:translate(-50%,35%) scale(.89);opacity:.65}
    to {transform:translate(-50%,0) scale(1);opacity:1}
  }
  @media(max-width:650px){.r127-rps-object{width:39%;height:70%}}
  @media(prefers-reduced-motion:reduce){.r127-rps-object.reveal{animation:none!important}}
  `;
  document.head.appendChild(style);

  function stop() {
    if (activeTimer !== null) clearInterval(activeTimer);
    if (finishTimer !== null) clearTimeout(finishTimer);
    activeTimer = finishTimer = null;
  }
  function build(figure) {
    const scene = document.createElement('div');
    scene.className = 'r127-rps-objects';
    scene.setAttribute('role', 'img');
    scene.setAttribute('aria-label', 'Wasteland rock paper scissors. Choose your move and place your wager.');
    for (const [side, label] of [['north', 'Opponent'], ['south', 'You']]) {
      const img = document.createElement('img');
      img.className = 'r127-rps-object ' + side;
      img.alt = label + ' object';
      img.hidden = true;
      img.draggable = false;
      scene.appendChild(img);
    }
    figure.appendChild(scene);
    return scene;
  }
  function present(scene, opponent, player, reveal) {
    for (const [side, choice] of [['north', opponent], ['south', player]]) {
      const el = scene.querySelector('.r127-rps-object.' + side);
      const ok = choices.includes(choice);
      el.hidden = !ok;
      if (!ok) continue;
      const file = images[choice];
      if (el.getAttribute('src') !== file) el.setAttribute('src', file);
      el.classList.remove('reveal');
      if (reveal) { void el.offsetWidth; el.classList.add('reveal'); }
    }
    scene.setAttribute('aria-label', choices.includes(player) && choices.includes(opponent)
      ? `You chose ${player}; opponent chose ${opponent}.` : 'Place a wager to begin the throw.');
  }
  function animate(scene, round) {
    stop();
    const id = round.id;
    // These are visual preview frames only. The real outcome is already fixed
    // in casino.js and is never randomized again or modified here.
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) { present(scene, round.opponent, round.pick, false); return; }
    let frame = 0;
    const tick = () => {
      if (!scene.isConnected || !isGraphics() || !isRps() || casinoRound()?.id !== id) { stop(); return; }
      const opponent = choices[Math.floor(Math.random() * choices.length)];
      const player = choices[Math.floor(Math.random() * choices.length)];
      present(scene, opponent, player, false);
      frame++;
    };
    tick();
    activeTimer = setInterval(tick, 115);
    finishTimer = setTimeout(() => {
      stop();
      if (!scene.isConnected || !isGraphics() || !isRps() || casinoRound()?.id !== id) return;
      present(scene, round.opponent, round.pick, true);
    }, 1020);
  }

  const originalSync = GraphicalUI.sync;
  GraphicalUI.sync = function () {
    originalSync.call(this);
    const figure = this.element?.figure;
    if (!figure) return;
    let scene = figure.querySelector('.r127-rps-objects');
    if (!isGraphics() || !isRps()) {
      if (scene) scene.remove();
      stop(); lastRound = '';
      return;
    }
    if (!scene) scene = build(figure);
    const round = casinoRound();
    if (!round) return;
    const key = [round.id, round.status, round.pick || '', round.opponent || ''].join(':');
    if (key === lastRound) return;
    lastRound = key;
    if (round.status === 'settled' && choices.includes(round.pick) && choices.includes(round.opponent)) {
      animate(scene, round);
    } else {
      stop();
      present(scene, null, null, false);
    }
  };

  // Existing game handlers already request graphical sync; this only ensures
  // wager resolution refreshes immediately, like the working dice display.
  const originalResolve = casinoResolve;
  casinoResolve = function (round) {
    const response = originalResolve(round);
    if (round?.game === 'rps' && isGraphics()) GraphicalUI.sync();
    return response;
  };
  GraphicalUI.schedule();
})();
