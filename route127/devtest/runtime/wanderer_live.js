/* Route 127 — Devtest-only live encounter art.
 * Uses existing encounter identity/state: never rolls, spawns, modifies choices,
 * progression, recruitment, storage, or saves. Classic BBS remains untouched.
 * Approved batches 1–5 art only; unknown wanderers simply retain normal backgrounds.
 */
(() => {
  'use strict';
  if (globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
      !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname) ||
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
    'Merritt Shaw':'merritt_shaw.png', 'Sabine Reed':'sabine_reed.png',
    'Orla Finch':'orla_finch.png',
    'Bex Calder':'bex_calder.png',
    'Nolan Rusk':'nolan_rusk.png',
    'Maeve Kline':'maeve_kline.png',
    'Galen Ward':'galen_ward.png',
    'Cora Bell':'cora_bell.png',
    'Dorian Hale':'dorian_hale.png',
    'Petra Sol':'petra_sol.png',
    'Soren Beck':'soren_beck.png',
    'Leda Marsh':'leda_marsh.png',
    'Ansel Crow':'ansel_crow.png',
    'Freya Dunn':'freya_dunn.png',
    'Otis Weller':'otis_weller.png',
    'Veda Knox':'veda_knox.png',
    'Silvie Hart':'silvie_hart.png',
    'Tobin Flint':'tobin_flint.png',
    'Elara Moss':'elara_moss.png',
    'Hector Vale':'hector_vale.png',
    'Nadia Rill':'nadia_rill.png',
    'Rhea Tarrant':'rhea_tarrant.png'
  });
  // Shared read-only identity-to-portrait map for Seaport staffed shop visuals.
  globalThis.Route127WandererPortraitFiles = art;
  const root = new URL('../devtest/assets/wanderers/', location.href);
  const shortName = name => { const parts=name.trim().split(/\s+/); return parts.length>1 ? parts[0]+' '+parts.at(-1)[0]+'.' : name; };
  const style = document.createElement('style');
  style.id = 'route127-devtest-live-wanderer-art';
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
      box-shadow:0 4px 12px #000c; overflow:hidden; pointer-events:auto; cursor:zoom-in;
    }
    .r127-live-wanderer-town img {
      position:absolute; inset:0 0 18px; height:calc(100% - 18px);
      width:100%; object-fit:contain; object-position:center bottom;
    }
    .r127-live-wanderer-label {
      position:absolute; bottom:0; left:0; right:0;
      text-align:center; white-space:nowrap; overflow:hidden; padding:3px 1px; z-index:5;
      background:#18130f; color:#65c77b; font:700 clamp(5px,.48rem,8px) Georgia,serif;
    }
    .r127-live-wanderer-town:focus-visible {outline:2px solid #edc48a; outline-offset:2px;}
    .r127-wanderer-expanded{border:1px solid #a08051;background:#18130f;color:#f3e0b8;padding:12px;max-width:min(480px,90vw);max-height:90vh;text-align:center;box-shadow:0 12px 60px #000d;z-index:9999;}
    .r127-wanderer-expanded::backdrop{background:#000d;}
    .r127-wanderer-expanded h3{font:700 1.25rem Georgia,serif;margin:0 0 8px;}
    .r127-wanderer-expanded img{display:block;max-height:70vh;max-width:100%;object-fit:contain;margin:auto;}
    .r127-wanderer-expanded button{margin-top:8px;background:#31271f;color:#f4e1c5;border:1px solid #9d8060;padding:6px 16px;cursor:pointer;}
  `;
  document.head.appendChild(style);
  function expandPortrait(name,file){
    const dialog=document.createElement('dialog');dialog.className='r127-wanderer-expanded';
    const title=document.createElement('h3');title.textContent=(typeof RouteIdentity!=='undefined'?RouteIdentity.wanderer?.[name]:null)||name;
    const picture=document.createElement('img');picture.src=new URL(file,root).href;picture.alt=name;
    const close=document.createElement('button');close.type='button';close.textContent='Close';
    close.addEventListener('click',()=>dialog.close());
    dialog.append(title,picture,close);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    document.body.appendChild(dialog);dialog.showModal();close.focus();
  }
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
    // A genuinely visiting (not yet hired) Seaport wanderer has the same
    // portrait affordance as other town encounters.
    if ((stage==='port55Guest'||(stage==='port55Stop'&&
         player.flags?.port55CurrentStop==='Town Streets'))&&
        player.flags?.seaport55?.freed){
      const guests=wanderers.filter(w=>wandererLocations[w.name]==='seaport'&&
        wandererAlive(w)&&!portIsHired(w.name));
      // Portrait and interaction menu share WO29's one incidental visitor.
       // Do not display a stale/hired portrait when the frequency roll is empty.
       const density=globalThis.Route127WandererDensity;
       const name=stage==='port55Guest'?player.flags?.port55VisitingName:
        density?density.seaportName():guests[0]?.name;
      if(name&&guests.some(w=>w.name===name))return {name,kind:'town'};
    }
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
      label.textContent = (typeof RouteIdentity!=='undefined'?
        RouteIdentity.wanderer?.[encounterInfo.name]:null)||encounterInfo.name;
      frame.title='Open '+encounterInfo.name+' portrait';frame.tabIndex=0;
      frame.setAttribute('role','button');frame.setAttribute('aria-label','Open full portrait of '+encounterInfo.name);
      frame.addEventListener('click',()=>{if(globalThis.Route127WandererInfo)globalThis.Route127WandererInfo.open(encounterInfo.name,new URL(file,root).href);else expandPortrait(encounterInfo.name,file);});
      frame.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(globalThis.Route127WandererInfo)globalThis.Route127WandererInfo.open(encounterInfo.name,new URL(file,root).href);else expandPortrait(encounterInfo.name,file);}});
      frame.append(img,label);
      figure.appendChild(frame);
    }
    shownKey = key;
  }

  // The portrait plate was updated earlier, but the main graphical encounter
  // heading and command captions still came from short gameplay identity keys.
  // Present the canonical full name there too, without touching save keys.
  const oldModel=GraphicalUI.model;
  GraphicalUI.model=function(...args){
    const model=oldModel.apply(this,args);
    const active=encounter();
    const full=active&&(typeof RouteIdentity!=='undefined'
      ?RouteIdentity.wanderer?.[active.name]:null);
    if(full){
      model.title=full+' — WANDERER';
      model.wandererHeading=true;
    }
    return model;
  };
  const oldChoices=GraphicalUI.choices;
  GraphicalUI.choices=function(...args){
    const rows=oldChoices.apply(this,args);
    if(!encounter()||typeof RouteIdentity==='undefined')return rows;
    return rows.map(row=>({...row,label:RouteIdentity.display(row.label)}));
  };
  const nameStyle=document.createElement('style');
  nameStyle.id='r127-wanderer-name-heading';
  nameStyle.textContent=`
    body.full-graphics:has(.r127-live-wanderer-road) .gfx-current-location,
    body.full-graphics:has(.r127-live-wanderer-road) .gfx-art-caption,
    body.full-graphics:has(.r127-live-wanderer-town) .gfx-current-location,
    body.full-graphics:has(.r127-live-wanderer-town) .gfx-art-caption
    {color:#65c77b!important}
  `;
  document.head.appendChild(nameStyle);

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
