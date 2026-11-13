/* DEVTEST-only Sky & Dirt Road Composition Lab. Independent of saved gameplay layouts. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
 const scenes=[
  ['THE BRIDGE TOLL','bridge_toll.png'],
  ['THE BURNT LIBRARY','burnt_library.png'],
  ['THE FENCE ARTIST','the_fence_artist.png'],
  ['THE MASK MARKET','the_mask_market.png'],
  ['THE RUST PARADE','the_rust_parade.png'],
  ['THE SHATTERED SILO','the_shattered_silo.png'],
  ['COUNTY WORK TRUCK','county_work_truck.png']
 ];
 const base=new URL('../devtest/',document.baseURI);
 const shared=new URL('../assets/regions/',base);
 const asset=name=>new URL('assets/scenarios/'+name,base).href;
 const layer=name=>new URL(name,shared).href;
 const storageKey='route127-sky-road-lab-v1';
 const defaults=()=>({time:'day',sky:true,road:true,x:50,y:50,size:100,roadY:50,roadSize:100,flip:false});
 let records={};try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');if(saved&&typeof saved==='object'&&!Array.isArray(saved))records=saved;}catch{}
 const css=document.createElement('style');css.textContent=`
 .r127-road-lab{box-sizing:border-box;width:min(1100px,96vw);max-height:95dvh;overflow:auto;padding:16px;background:#191511;color:#f4e5d1;border:1px solid #b28c59}
 .r127-road-lab::backdrop{background:#000c}
 .r127-road-lab h2{margin:0 0 6px;color:#f3c990;font:700 25px Georgia,serif}
 .r127-road-lab .lab-note{font:13px/1.45 Georgia,serif;color:#d2c1a8;margin:6px 0 12px}
 .r127-road-lab .lab-controls{display:flex;flex-wrap:wrap;align-items:end;gap:10px;margin:12px 0}
 .r127-road-lab label{display:flex;flex-direction:column;gap:4px;font:13px Georgia,serif}
 .r127-road-lab label.lab-check{flex-direction:row;align-items:center;gap:7px;padding:9px 5px}
 .r127-road-lab select,.r127-road-lab input,.r127-road-lab button{font:inherit;color:#f7e5ca;background:#29221b;border:1px solid #97754e;padding:7px}
 .r127-road-lab button{cursor:pointer;min-height:38px}
 .r127-road-lab input[type=range]{width:140px;accent-color:#e0a15b;padding:0}
 .r127-road-lab .lab-stage{position:relative;isolation:isolate;overflow:hidden;width:100%;aspect-ratio:16/9;border:2px solid #946c43;background:#1b2530;touch-action:none}
 .r127-road-lab .lab-stage img{position:absolute;display:block;pointer-events:none;user-select:none}
 .r127-road-lab .lab-stage img[hidden]{display:none!important}
 .r127-road-lab .lab-sky{inset:0;width:100%;height:100%;object-fit:cover;z-index:0}
 .r127-road-lab .lab-road{width:100%;height:100%;left:0;top:0;object-fit:fill;z-index:1}
 .r127-road-lab .lab-subject{width:100%;height:100%;left:0;top:0;object-fit:contain;z-index:2;transform-origin:center;filter:drop-shadow(0 3px 4px #0005)}
 .r127-road-lab .lab-stage[data-dragging=true]{cursor:grabbing}
 .r127-road-lab .lab-stage:not([data-dragging=true]){cursor:grab}
 .r127-road-lab .lab-actions{display:flex;flex-wrap:wrap;gap:9px;margin:12px 0}
 .r127-road-lab .lab-status{font:13px/1.5 Georgia,serif;color:#e5c798;margin-top:8px}
 .r127-road-lab .lab-output{box-sizing:border-box;width:100%;height:120px;background:#13100d;color:#e5d7c5;font:12px monospace}
 @media(max-width:650px){.r127-road-lab{padding:9px}.r127-road-lab .lab-controls{gap:7px}.r127-road-lab input[type=range]{width:110px}}
 `;document.head.append(css);
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
 const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
 function show(){
  const dlg=el('dialog');dlg.className='r127-road-lab';dlg.setAttribute('aria-label','Sky and Dirt Road Image Lab');
  const title=el('h2','SKY + DIRT ROAD IMAGE LAB');
  const note=el('p','Experiment with sky, road, and scenario artwork. This is an independent visual sandbox: no gameplay, combat layouts, or existing review marks are changed.');note.className='lab-note';
  dlg.append(title,note);
  const controls=el('div');controls.className='lab-controls';dlg.append(controls);
  function select(label,options){
   const wrap=el('label',label),n=el('select');
   for(const [value,name]of options){const opt=el('option',name);opt.value=value;n.append(opt);}wrap.append(n);controls.append(wrap);return n;
  }
  function check(label){const wrap=el('label');wrap.className='lab-check';const n=el('input');n.type='checkbox';wrap.append(n,document.createTextNode(label));controls.append(wrap);return n;}
  function range(label,min,max,step){const wrap=el('label'),caption=el('span'),n=el('input');n.type='range';n.min=min;n.max=max;n.step=step;wrap.append(caption,n);controls.append(wrap);return {n,caption,label};}
  const scenario=select('Scenario',scenes.map(([name])=>[name,name]));
  const time=select('Sky',['dawn','day','dusk','night'].map(v=>[v,v.toUpperCase()]));
  const skyCheck=check('Show sky'),roadCheck=check('Show dirt road'),flip=check('Flip image');
  const x=range('Image X',0,100,1),y=range('Image Y',0,100,1),size=range('Image size',10,250,1);
  const roadY=range('Road vertical offset',0,100,1),roadSize=range('Road height',40,180,1);
  const stage=el('div');stage.className='lab-stage';stage.setAttribute('aria-label','Drag on the artwork to reposition it');
  const sky=el('img'),road=el('img'),subject=el('img');sky.className='lab-sky';road.className='lab-road';subject.className='lab-subject';
  sky.alt='Dynamic sky';road.alt='Dirt road foreground';subject.alt='Scenario artwork';road.src=layer('dirt_road_foreground.png');
  const status=el('div');status.className='lab-status';dlg.append(stage,status);stage.append(sky,road,subject);
  const actions=el('div');actions.className='lab-actions';dlg.append(actions);
  function button(name,fn){const b=el('button',name);b.type='button';b.addEventListener('click',fn);actions.append(b);return b;}
  let current=defaults();
  function persist(){records[scenario.value]={...current};try{localStorage.setItem(storageKey,JSON.stringify(records));}catch{status.textContent='Preview active; browser lab preferences could not be stored.';}}
  function draw(){
   time.value=current.time;skyCheck.checked=current.sky;roadCheck.checked=current.road;flip.checked=current.flip;
   for(const [r,n]of [[x,current.x],[y,current.y],[size,current.size],[roadY,current.roadY],[roadSize,current.roadSize]]){r.n.value=n;r.caption.textContent=r.label+': '+n+'%';}
   sky.src=layer(current.time==='dusk'?'sky_dawn.png':'sky_'+current.time+'.png');
   sky.style.filter=current.time==='dusk'?'sepia(.42) hue-rotate(-18deg) saturate(1.4)':'none';
   sky.hidden=!current.sky;road.hidden=!current.road;
   road.style.transform='translateY('+(current.roadY-50)+'%) scaleY('+(current.roadSize/100)+')';
   subject.src=asset(scenes.find(row=>row[0]===scenario.value)[1]);
   subject.style.transform='translate('+(current.x-50)+'%,'+(current.y-50)+'%) scale('+(current.size/100)*(current.flip?-1:1)+','+(current.size/100)+')';
   status.textContent='Preview only • '+scenario.value+' • '+current.time.toUpperCase()+' • drag the scene image to adjust position. Dusk previews use a tinted dawn asset.';
  }
  function load(){current={...defaults(),...(records[scenario.value]||{})};draw();}
  scenario.addEventListener('change',load);
  for(const [input,key]of [[time,'time'],[skyCheck,'sky'],[roadCheck,'road'],[flip,'flip']])input.addEventListener('change',()=>{current[key]=input.type==='checkbox'?input.checked:input.value;persist();draw();});
  for(const [control,key]of [[x,'x'],[y,'y'],[size,'size'],[roadY,'roadY'],[roadSize,'roadSize']])control.n.addEventListener('input',()=>{current[key]=Number(control.n.value);persist();draw();});
  let drag=null;
  stage.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={id:event.pointerId,startX:event.clientX,startY:event.clientY,x:current.x,y:current.y};stage.setPointerCapture(event.pointerId);stage.dataset.dragging='true';});
  stage.addEventListener('pointermove',event=>{if(!drag||event.pointerId!==drag.id)return;const rect=stage.getBoundingClientRect();if(!rect.width||!rect.height)return;current.x=Math.round(clamp(drag.x+(event.clientX-drag.startX)/rect.width*100,0,100));current.y=Math.round(clamp(drag.y+(event.clientY-drag.startY)/rect.height*100,0,100));persist();draw();});
  function endDrag(){drag=null;delete stage.dataset.dragging;}
  stage.addEventListener('pointerup',endDrag);stage.addEventListener('pointercancel',endDrag);stage.addEventListener('lostpointercapture',endDrag);
  button('Reset this scenario',()=>{current=defaults();persist();draw();});
  const output=el('textarea');output.className='lab-output';output.hidden=true;output.readOnly=true;
  button('Export lab settings',()=>{output.hidden=false;output.value=JSON.stringify({version:1,scenes:records},null,2);output.select();status.textContent='Copy this JSON to save or share your experimental settings. Nothing has been applied to gameplay.';});
  button('Close',()=>dlg.close());
  dlg.append(output);
  subject.onerror=()=>{status.textContent='Scenario artwork failed to load: '+subject.src;};
  road.onerror=()=>{status.textContent='Dirt road image failed to load: '+road.src;};
  dlg.addEventListener('close',()=>dlg.remove(),{once:true});
  document.body.append(dlg);load();dlg.showModal();
 }
 // Separate Options button, intentionally outside the combat layout/testing editor.
 if(typeof TravelerPanels!=='undefined'){
  const original=TravelerPanels.options;
  TravelerPanels.options=function(...args){
   const result=original.apply(this,args);
   if(this.which==='options'&&this.body){
    const panel=this.body.querySelector('.traveler-detail');
    if(panel&&!panel.querySelector('[data-sky-road-lab]')){
     const b=this.button('Sky + Dirt Road Image Lab',()=>{this.close();show();});
     b.dataset.skyRoadLab='true';panel.append(b);
    }
   }
   return result;
  };
 }
 globalThis.Route127SkyRoadLab=Object.freeze({show,scenes:scenes.map(([name])=>name)});
})();