/* Route 127 — Playtest live encounter portrait art.
 * Uses existing encounter identity/state: never rolls, spawns, modifies choices,
 * progression, recruitment, storage, or saves. Classic BBS remains untouched.
 * Approved first 30 wanderers; unknown wanderers simply retain normal backgrounds.
 */
(() => {
  'use strict';
  if (!/^\/route127\/playtest\/(?:index\.html)?$/.test(location.pathname) ||
      typeof GraphicalUI === 'undefined') return;

  const art = Object.freeze({
    Tess:'tess.png', Patch:'patch.png', Hollis:'hollis.png',
    Rook:'rook.png', June:'june.png', Moss:'moss.png',
    Kettle:'kettle.png', Vera:'vera.png', Deke:'deke.png', Ash:'ash.png',
    Bram:'bram.png', Lark:'lark.png', Flint:'flint.png', Sable:'sable.png',
    Cricket:'cricket.png', Rowan:'rowan.png', Harlow:'harlow.png',
    Bolt:'bolt.png', Crowley:'crowley.png', Mercer:'mercer.png',
    Finch:'finch.png', Vale:'vale.png', Bishop:'bishop.png', Wren:'wren.png', Cutter:'cutter.png',
    'Iona Pike':'iona_pike.png', 'Cal Voss':'cal_voss.png', 'Ada Quill':'ada_quill.png',
    'Merritt Shaw':'merritt_shaw.png', 'Sabine Reed':'sabine_reed.png'
  });
  const root = new URL('assets/wanderers/', location.href);
  const style = document.createElement('style');
  style.id = 'route127-playtest-live-wanderer-art';
  style.textContent = `
    body.full-graphics .gfx-art { position:relative; isolation:isolate; }
    .r127-live-wanderer-road {
      position:absolute; bottom:0; right:var(--r127-wanderer-road-right,15%);
      height:95%; max-width:56%; width:auto; object-fit:contain;
      object-position:bottom center; z-index:3; pointer-events:none;
      filter:drop-shadow(0 5px 5px #0008);
    }
    .r127-live-wanderer-town {
      position:absolute; bottom:4%; right:3%; height:28%;
      aspect-ratio:3/4; max-width:18%; z-index:4;
      border:2px ridge #a08051; background:#201913;
      box-shadow:0 4px 12px #000c; overflow:hidden; pointer-events:none;
    }
    .r127-live-wanderer-town img {
      position:absolute; inset:0 0 18px; height:calc(100% - 18px);
      width:100%; object-fit:contain; object-position:center bottom;
    }
    .r127-live-wanderer-label {
      position:absolute; bottom:0; left:0; right:0;
      text-align:center; white-space:nowrap; padding:3px 2px;
      background:#18130f; color:#f3e0b8; font:700 .56rem Georgia,serif;
    }
  `;
  document.head.appendChild(style);
  let shownKey = '';

  function encounter() {
    if (typeof stage === 'undefined' || typeof combatState === 'undefined' || combatState)
      return null;
    // Only an actual active road wanderer encounter; never a stale saved name.
    if (stage === 'wandererRoad' && typeof currentRoadWanderer !== 'undefined')
      return currentRoadWanderer ? { name:currentRoadWanderer, kind:'road' } : null;
    // Town guest is shown while present at the town, or during focused dialogue.
    if (stage === 'mercy' &&
        typeof currentTownWanderer !== 'undefined' && currentTownWanderer &&
        (typeof mercyLocation !== 'undefined' && mercyLocation === 'town' ||
         typeof townWandererFocus !== 'undefined' &&
         townWandererFocus === currentTownWanderer))
      return { name:currentTownWanderer, kind:'town' };
    // Recruitment conversation may be launched separately from the town menu.
    if (stage === 'port55Recruit' &&
        typeof player !== 'undefined' &&
        player?.flags?.portHireOffer?.origin !== 'wandererRoad')
      return { name:player.flags.portHireOffer.name,kind:'town' };
    return null;
  }

  function clear(figure) {
    figure?.querySelectorAll('.r127-live-wanderer-road,.r127-live-wanderer-town')
      .forEach(node => node.remove());
    shownKey = '';
  }

  function syncPortrait() {
    const e = GraphicalUI.element, figure = e?.figure;
    if (!figure) return;
    if (!GraphicalUI.active() || figure.hidden) { clear(figure); return; }
    const encounterInfo = encounter();
    const file = encounterInfo && Object.prototype.hasOwnProperty.call(art,encounterInfo.name)
      ? art[encounterInfo.name] : null;
    if (!file) { clear(figure); return; }
    const kind = encounterInfo.kind;
    const key = kind + ':' + encounterInfo.name;
    const existing = figure.querySelector('.r127-live-wanderer-road,.r127-live-wanderer-town');
    if (key === shownKey && existing) return;
    clear(figure);
    const src = new URL(file,root).href;
    const img = document.createElement('img');
    img.src = src;
    img.alt = encounterInfo.name + ' — wanderer';
    img.decoding = 'async'; img.draggable = false;
    img.onerror = () => { if (img.isConnected) clear(figure); };
    if (kind === 'road') {
      img.className = 'r127-live-wanderer-road';
      let region = '';
      try {
        const g = typeof lanternState === 'function' ? lanternState() : null;
        region = typeof route127CurrentRegion === 'function' ? route127CurrentRegion(g) : '';
      } catch {}
      figure.style.setProperty('--r127-wanderer-road-right',
        ['CENTRAL','NORTH','WEST','SEAPORT'].includes(String(region).toUpperCase())
          ? '25%' : '15%');
      figure.appendChild(img);
    } else {
      const frame = document.createElement('div');
      frame.className = 'r127-live-wanderer-town';
      const label = document.createElement('span');
      label.className = 'r127-live-wanderer-label';
      label.textContent = encounterInfo.name;
      frame.append(img,label);
      figure.appendChild(frame);
    }
    shownKey = key;
  }

  const original = GraphicalUI.sync;
  GraphicalUI.sync = function(...args) {
    const result = original.apply(this,args);
    // A graphics sync may be scheduled before stage state finishes transitioning.
    // This reads only the final state that the renderer already exposes.
    if (!this.rendering) syncPortrait();
    return result;
  };
  addEventListener('DOMContentLoaded',()=>GraphicalUI.sync(),{once:true});
})();
