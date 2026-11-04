/* Route 127 — DEVTEST-only descriptive wanderer dossier.
 * Read-only: no RNG, calls to profile generators, save writes, transactions,
 * recruitment actions, equipment rolls, XP, or turn consumption.
 */
(() => {
  'use strict';
  if(globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
     !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)) return;
  const make=(tag,cls,txt)=>{
    const e=document.createElement(tag);
    if(cls)e.className=cls;
    if(txt!==undefined)e.textContent=String(txt);
    return e;
  };
  const keys=['medicine','trading','mechanics','banking'];
  const label={medicine:'Medicine',trading:'Trading',mechanics:'Mechanics',banking:'Banking'};
  const ratingFor=(name,w,definition,state)=>{
    const saved=state?.seaportAptitudes;
    if(state?.r127AptitudeVersion==='level-stars-v1' &&
       Number(state.r127AptitudeLevel)===(Number(state.profile?.level)||Number(w?.level)) &&
       saved) return saved;
    const designed=definition?.aptitudes||state?.r127OriginalAptitudes||saved;
    if(!designed) return null;
    const sorted=keys.map((key,i)=>({key,i,v:Number(designed[key])||1}))
      .sort((a,b)=>b.v-a.v||a.i-b.i);
    const tiers=globalThis.Route127WandererStarScale?.tier;
    if(!tiers)return saved||designed;
    const values=tiers(state?.profile?.level||w?.level||1);
    return Object.fromEntries(sorted.map((item,i)=>[item.key,values[i]]));
  };
  const addRow=(section,name,value)=>{
    const row=make('div','r127-info-row');
    row.append(make('span','r127-info-label',name),make('span','r127-info-value',value));
    section.appendChild(row);
  };
  function open(name,src){
    if(!name||!src)return;
    const w=typeof wandererByName==='function'?wandererByName(name):null;
    const def=typeof WandererWorldExpansion!=='undefined'
      ? WandererWorldExpansion.definition(name):null;
    // Read existing state directly; ws() and v50Profile() can create state or roll loot.
    const state=typeof player!=='undefined'?player?.wandererState?.[name]:null;
    const profile=state?.profile||null;
    const display=def?.displayName||name;
    const level=profile?.level??w?.level??def?.level??'Unknown';
    const occupation=w?.occupation||def?.occupation||'Unknown';
    const skills=ratingFor(name,w,def,state);
    if(!document.getElementById('r127-wanderer-info-css')){
      const style=make('style');style.id='r127-wanderer-info-css';
      style.textContent=`
      .r127-winfo{box-sizing:border-box;border:2px solid #9a7850;background:#191611;color:#eadcc1;
        width:min(900px,95vw);max-height:90vh;overflow:auto;padding:16px;
        box-shadow:0 18px 65px #000e;font:14px/1.5 Georgia,serif;}
      .r127-winfo::backdrop{background:#050505d9}
      .r127-winfo *{box-sizing:border-box}
      .r127-winfo-header{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;
        border-bottom:1px solid #6d5133;padding-bottom:9px;margin-bottom:12px}
      .r127-winfo h2{margin:0;color:#e8c58d;font:700 clamp(20px,3vw,28px) Georgia,serif}
      .r127-winfo-sub{color:#d3bc94;letter-spacing:.06em}
      .r127-winfo-close{background:#31261c;color:#f3dfc0;border:1px solid #b79567;
        padding:7px 15px;cursor:pointer;font:700 14px Georgia,serif}
      .r127-winfo-body{display:grid;grid-template-columns:minmax(180px, .9fr) minmax(0,1.3fr);gap:20px}
      .r127-winfo-portrait{display:block;width:100%;height:min(65vh,490px);object-fit:contain;
        object-position:top center;background:radial-gradient(ellipse at center,#4a3d2a 0%,#1b1713 67%);border:1px solid #6e563c}
      .r127-winfo h3{font:700 15px Georgia,serif;color:#efc992;letter-spacing:.08em;
        margin:14px 0 6px;border-bottom:1px solid #584633;padding-bottom:3px}
      .r127-info-row{display:flex;align-items:baseline;justify-content:space-between;gap:12px;margin:5px 0}
      .r127-info-label{color:#c3b299}.r127-info-value{color:#f3e6ce;text-align:right;overflow-wrap:anywhere}
      .r127-info-stars{color:#f1bd63;letter-spacing:.04em;font-family:Arial,sans-serif}
      .r127-winfo p{margin:7px 0;color:#dfd0b8}
      .r127-winfo-note{font-size:12px;color:#ad9c87!important}
      @media(max-width:620px){.r127-winfo{padding:10px}.r127-winfo-body{grid-template-columns:1fr}
      .r127-winfo-portrait{height:250px}.r127-winfo-header{align-items:center}}
      `;
      document.head.appendChild(style);
    }
    const d=make('dialog','r127-winfo');
    d.setAttribute('aria-label','Wanderer information: '+display);
    const header=make('div','r127-winfo-header');
    const titleWrap=make('div'),title=make('h2','',display);
    titleWrap.append(title,make('div','r127-winfo-sub','LEVEL '+level+'  •  '+occupation));
    const close=make('button','r127-winfo-close','X — Close');close.type='button';
    close.addEventListener('click',()=>d.close());
    header.append(titleWrap,close);
    const body=make('div','r127-winfo-body');
    const portraitColumn=make('div');
    const portrait=make('img','r127-winfo-portrait');portrait.alt=display;portrait.src=src;
    portraitColumn.appendChild(portrait);
    const details=make('div');
    const overview=make('section');
    overview.appendChild(make('h3','','CHARACTER'));
    addRow(overview,'Level',level);
    addRow(overview,'Occupation',occupation);
    if(def?.personality||w?.vibe)addRow(overview,'Personality',def?.personality||w.vibe);
    if(def?.connection)addRow(overview,'Connections',def.connection);
    details.appendChild(overview);
    const skillSection=make('section');skillSection.appendChild(make('h3','','APTITUDES'));
    if(skills){
      for(const key of keys){
        const n=Math.max(0,Math.min(5,Number(skills[key])||0));
        const row=make('div','r127-info-row');
        row.append(make('span','r127-info-label',label[key]),
          make('span','r127-info-stars','★'.repeat(n)+'☆'.repeat(5-n)+'  '+n+'/5'));
        skillSection.appendChild(row);
      }
    }else skillSection.appendChild(make('p','','Not yet assessed.'));
    details.appendChild(skillSection);
    const story=make('section');story.appendChild(make('h3','','BACKGROUND'));
    story.appendChild(make('p','',def?.introduction||w?.lines?.[1]||'No additional background recorded.'));
    if(def?.dialogue?.[0])story.appendChild(make('p','',def.dialogue[0]));
    details.appendChild(story);
    const belongings=make('section');belongings.appendChild(make('h3','','BELONGINGS'));
    addRow(belongings,'Bolts carried','Not tracked for individual wanderers');
    if(profile?.weapon)addRow(belongings,'Visible weapon',typeof gearLabel==='function'?gearLabel(profile.weapon):profile.weapon);
    if(profile?.armor)addRow(belongings,'Visible armor',typeof gearLabel==='function'?gearLabel(profile.armor):profile.armor);
    if(profile?.stock?.length){
      const goods=profile.stock.filter(item=>item.qty>0)
        .map(item=>item.name+' ×'+item.qty).join(', ');
      addRow(belongings,'Trade inventory',goods||'None remaining');
    }else addRow(belongings,'Trade inventory',profile?'None recorded':'Not yet encountered');
    addRow(belongings,'Confirmed recoverable loot',profile?.pendingLoot||'None recorded');
    belongings.appendChild(make('p','r127-winfo-note',
      'Trade stock is not guaranteed loot. Other drops are only determined by existing encounter rules.'));
    details.appendChild(belongings);
    portraitColumn.appendChild(make('p','r127-winfo-note',
      'Information only — this view does not change the encounter.'));
    body.append(portraitColumn,details);d.append(header,body);
    d.addEventListener('close',()=>d.remove(),{once:true});
    document.body.appendChild(d);d.showModal();close.focus();
  }
  globalThis.Route127WandererInfo=Object.freeze({open});
})();
