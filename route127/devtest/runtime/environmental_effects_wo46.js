/* WO46 — DEVTEST weather presentation. Registry and gameplay remain authoritative. */
(() => {
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||!/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname))return;
 const effects=new Map(),owners=new WeakMap();let sequence=1;
 const RAIN_VISUAL_SCALE=1.7;
 const style=document.createElement('style');style.textContent=`
 .r127-env-host{position:relative;isolation:isolate}
 .r127-env-canvas,.r127-env-atmosphere{position:absolute;inset:0;width:100%;height:100%;pointer-events:none!important;user-select:none}
 .r127-env-atmosphere{z-index:1;mix-blend-mode:multiply}
 .r127-env-canvas[data-layer="scenery"]{z-index:4}
 .r127-env-canvas[data-layer="interface"]{z-index:40}
 .r127-env-preview{box-sizing:border-box;width:min(1050px,96vw);max-height:94dvh;overflow:auto;background:#171b21;color:#f4e4d0;border:1px solid #a5754d;padding:14px}
 .r127-env-preview::backdrop{background:#000b}
 .r127-env-controls{display:flex;flex-wrap:wrap;gap:9px;margin:10px 0}
 .r127-env-controls label{display:grid;gap:4px}
 .r127-env-controls label[hidden]{display:none}
 .r127-env-preview select,.r127-env-preview button{min-height:44px;font:inherit}
 .r127-env-stage{overflow:hidden;border:1px solid #805436;background:#11171b;padding:8px}
 .r127-env-stage .r127-sky-preview-art{margin:0;width:100%;max-height:49dvh}
 .r127-env-choices{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding-top:8px}
 .r127-env-choices .gfx-choice{position:relative;padding:10px;color:#ffe5b7;background:#282018;border:1px solid #a27647;min-height:48px;font:14px Georgia,serif;text-align:left}
 .r127-env-choices button:focus-visible{outline:3px solid #f5c278;outline-offset:-4px}
 .r127-env-stage.r127-env-phone{box-sizing:border-box;width:390px;max-width:100%;margin-inline:auto}
 .r127-env-phone .r127-env-choices{grid-template-columns:1fr}
 @media(max-width:640px){.r127-env-choices{grid-template-columns:1fr}.r127-env-preview{padding:9px}.r127-env-controls{gap:5px}.r127-env-preview h2{font-size:20px}}
 `;document.head.append(style);

 class EnvironmentalEffects {
  static register(name,definition){if(!definition?.create||!definition?.draw)throw Error('Weather requires create and draw');effects.set(name,definition);}
  constructor(root,scenery,{effect,period='day',buttonDroplets=false,buttonLimit=1}={}){
   owners.get(root)?.stop();owners.set(root,this);this.root=root;this.scenery=scenery;this.effect=effect;this.period=period;
   this.running=false;this.stopped=false;this.frame=null;this.elapsed=0;this.last=0;this.listeners=[];this.layers=[];
   this.wetButtons=new Map();this.buttonDroplets=buttonDroplets&&effect==='rain';this.buttonLimit=buttonLimit;
   this.randomState=(Date.now()+(sequence++*2654435761))>>>0;
   this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.reduced=this.motion.matches;
   this.pointer={x:0,y:0,target:0,strength:0,until:0,focused:false};this.lastPointer=-1000;
   root.classList.add('r127-env-host');scenery.classList.add('r127-env-host');root.dataset.environmentEffect=effect;
   this.atmosphere=document.createElement('div');this.atmosphere.className='r127-env-atmosphere';this.atmosphere.setAttribute('aria-hidden','true');scenery.append(this.atmosphere);
   for(const [host,name]of [[scenery,'scenery'],[root,'interface']]){
    const canvas=document.createElement('canvas');canvas.className='r127-env-canvas';canvas.dataset.layer=name;canvas.setAttribute('aria-hidden','true');host.append(canvas);
    this.layers.push({host,canvas,context:canvas.getContext?.('2d'),width:1,height:1,x:0,y:0});
   }
   this.state=effects.get(effect)?.create(this);if(!this.state){this.stop();throw Error('Unknown environmental effect '+effect);}
   this.listen(root,'pointermove',e=>this.approach(e));
   this.listen(root,'pointerdown',e=>this.approach(e,true));
   if(this.effect==='ash'){
    this.listen(root,'pointerleave',()=>{this.state.path=null;});
    this.listen(root,'pointercancel',()=>{this.state.path=null;});
    this.listen(root,'pointerup',()=>{this.state.path=null;});
    this.listen(root,'focusin',event=>{
     const button=event.target.closest?.('.gfx-choice');
     if(!button)return;
     const rect=button.getBoundingClientRect();
     this.smearSoot(button,{x:rect.width*.12,y:rect.height*.5},{x:rect.width*.48,y:rect.height*.5});
    });
   }
   this.listen(root,'pointerleave',()=>{if(this.effect==='fog'&&!this.pointer.focused)this.release();});
   this.listen(root,'focusin',e=>{if(performance.now()-this.lastPointer<300)return;const b=e.target.closest?.('button');if(b){const r=b.getBoundingClientRect(),box=root.getBoundingClientRect();if(this.effect!=='fog')return;this.interact(r.left+r.width/2-box.left,r.top+r.height/2-box.top,true);}});
   this.listen(root,'focusout',()=>{if(this.effect==='fog'){this.pointer.focused=false;this.release();}});
   this.listen(document,'visibilitychange',()=>this.schedule());
   this.listen(this.motion,'change',e=>{this.reduced=e.matches;this.schedule();});
   if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(root);this.observer.observe(scenery);}
   else this.listen(window,'resize',()=>this.resize());
   this.resize();this.play();
  }
  random(){this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0;return this.randomState/4294967296;}
  listen(target,type,fn){target.addEventListener?.(type,fn,{passive:true});this.listeners.push([target,type,fn]);}
  approach(event,touch=false){
   if(this.effect==='ash'){
    this.trackSoot(event,touch);
    return;
   }
   if(this.effect!=='fog')return;
   this.lastPointer=performance.now();this.pointer.focused=false;
   const root=this.root.getBoundingClientRect();let best=null,distance=110;
   for(const b of this.root.querySelectorAll('button')){const r=b.getBoundingClientRect(),dx=Math.max(r.left-event.clientX,0,event.clientX-r.right),dy=Math.max(r.top-event.clientY,0,event.clientY-r.bottom),d=Math.hypot(dx,dy);if(d<distance){distance=d;best=r;}}
   if(best){this.interact(event.clientX-root.left,event.clientY-root.top,false,touch||event.pointerType==='touch');}
   else this.release();
  }
  trackSoot(event,down){
   const button=event.target?.closest?.('.gfx-choice');
   if(!button||!this.root.contains(button)){
    this.state.path=null;
    return;
   }
   const rect=button.getBoundingClientRect();
   const point={x:event.clientX-rect.left,y:event.clientY-rect.top};
   if(point.x<0||point.y<0||point.x>rect.width||point.y>rect.height){
    this.state.path=null;
    return;
   }
   const previous=this.state.path;
   this.state.path={button,point,id:event.pointerId};
   if(!down&&previous?.button===button&&previous.id===event.pointerId){
    this.smearSoot(button,previous.point,point);
   }
  }
  smearSoot(button,start,end){
   const surface=this.state.soot.get(button);
   if(!surface)return;
   const rect=button.getBoundingClientRect();
   const dx=end.x-start.x,dy=end.y-start.y;
   const lengthSquared=dx*dx+dy*dy;
   if(lengthSquared<4)return;
   surface.specks=surface.specks.filter(speck=>{
    const x=speck.x*rect.width-start.x,y=speck.y*rect.height-start.y;
    const along=Math.max(0,Math.min(1,(x*dx+y*dy)/lengthSquared));
    const distance=Math.hypot(x-along*dx,y-along*dy);
    // Keep scattered grains in the track and more residue toward its edges.
    return distance>5+speck.edge*7||speck.edge<.12;
   });
   if(this.reduced||!this.running)this.draw(0);
  }
  clearSoot(){
   if(this.effect!=='ash'||!this.state)return;
   for(const button of this.state.soot.keys())delete button.dataset.sootSpecks;
   this.state.soot.clear();
   this.state.path=null;
  }
  release(){this.pointer.target=0;if(this.reduced||!this.running){this.pointer.strength=0;this.draw(0);}}
  interact(x,y,focused=false,touch=false){const p=this.pointer;p.x=x;p.y=y;p.target=1;p.focused=focused;p.until=touch?performance.now()+1600:0;if(this.reduced||!this.running){p.strength=1;this.draw(0);}else this.schedule();}
  resize(){if(this.stopped)return;const root=this.root.getBoundingClientRect();
   for(const l of this.layers){const r=l.host.getBoundingClientRect();l.width=Math.max(1,r.width);l.height=Math.max(1,r.height);l.x=r.left-root.left;l.y=r.top-root.top;const scale=Math.min(devicePixelRatio||1,1.5,1400/l.width);l.canvas.width=Math.ceil(l.width*scale);l.canvas.height=Math.ceil(l.height*scale);l.context?.setTransform(scale,0,0,scale,0,0);}
   this.draw(0);
  }
  play(){if(this.stopped)return;this.running=true;this.last=0;this.schedule();}
  pause(){this.running=false;this.cancel();}
  restart(){if(this.stopped)return;this.clearBeads();this.clearSoot();this.elapsed=0;this.state=effects.get(this.effect).create(this);this.pointer.strength=0;this.pointer.target=0;this.play();}
  cancel(){if(this.frame!==null){cancelAnimationFrame(this.frame);this.frame=null;}}
  schedule(){if(this.stopped||document.hidden||!this.running){this.cancel();return;}if(this.reduced){this.cancel();this.draw(0);return;}if(this.frame!==null)return;
   this.frame=requestAnimationFrame(time=>{this.frame=null;const dt=this.last?Math.min(.05,(time-this.last)/1000):0;this.last=time;this.elapsed+=dt;this.draw(dt);this.schedule();});
  }
  draw(dt){if(this.stopped||document.hidden)return;const p=this.pointer;if(p.until&&performance.now()>p.until&&!p.focused){p.until=0;p.target=0;}p.strength+=(p.target-p.strength)*(this.reduced?1:Math.min(1,dt*5));
   this.atmosphere.style.background=this.effect==='rain'?'rgba(96,37,24,.19)':this.effect==='ash'?'rgba(63,59,54,.12)':'rgba(145,154,111,.07)';
   this.atmosphere.style.opacity=this.period==='night'?'.85':'.65';
   for(const layer of this.layers){const c=layer.context;if(!c)continue;c.clearRect(0,0,layer.width,layer.height);effects.get(this.effect).draw(c,layer,this,dt);if(layer.canvas.dataset.layer==='interface'&&this.buttonDroplets)this.drawBeads(c,dt);}
  }
  clearBeads(){for(const b of this.wetButtons.keys())delete b.dataset.wetBeads;this.wetButtons.clear();}
  setButtonDroplets(enabled,limit=1){this.clearBeads();this.buttonDroplets=!!enabled&&this.effect==='rain';this.buttonLimit=limit;this.draw(0);}
  drawBeads(c,dt){
   const buttons=[...this.root.querySelectorAll('.gfx-choice')].slice(0,this.buttonLimit),root=this.root.getBoundingClientRect();
   for(const b of [...this.wetButtons.keys()])if(!buttons.includes(b)){delete b.dataset.wetBeads;this.wetButtons.delete(b);}
   for(const button of buttons){const r=button.getBoundingClientRect();if(!r.width||!r.height)continue;const x=r.left-root.left,y=r.top-root.top,cap=r.width<400?14:20;
    let s=this.wetButtons.get(button);if(!s){s={beads:[],water:0};this.wetButtons.set(button,s);}
    const make=()=>({x:.035+this.random()*.93,y:this.random()<.72?.04+this.random()*.08:.18+this.random()*.57,radius:(1.25+this.random()*1.45)*RAIN_VISUAL_SCALE,age:0,slide:0,trail:0});
    if(this.reduced&&s.beads.length===0)for(let i=0;i<6;i++)s.beads.push(make());
    if(!this.reduced){s.water+=dt*(r.width<400?1.4:2);if(s.water>=1){s.water-=1;if(s.beads.length<cap)s.beads.push(make());}}
    for(const bead of s.beads){if(this.reduced)continue;bead.age+=dt;
     if(bead.radius>2.5*RAIN_VISUAL_SCALE&&bead.age>2.5&&!bead.slide&&this.random()<dt*.1)bead.slide=8+bead.radius*2;
     if(bead.slide){bead.y+=dt*bead.slide/r.height;bead.slide+=dt*4;bead.trail=Math.min(25,bead.trail+dt*18);}
    }
    // Merge by area, with a strict radius cap so labels never disappear under blobs.
    for(let i=0;i<s.beads.length;i++)for(let j=s.beads.length-1;j>i;j--){const a=s.beads[i],b=s.beads[j];if(Math.hypot((a.x-b.x)*r.width,(a.y-b.y)*r.height)<(a.radius+b.radius)*.85){const aa=a.radius*a.radius,bb=b.radius*b.radius;a.x=(a.x*aa+b.x*bb)/(aa+bb);a.y=(a.y*aa+b.y*bb)/(aa+bb);a.radius=Math.min(6.5,Math.sqrt(aa+bb));a.age=Math.max(a.age,b.age);s.beads.splice(j,1);}}
    s.beads=s.beads.filter(b=>b.y<1.08);const count=String(s.beads.length);if(button.dataset.wetBeads!==count)button.dataset.wetBeads=count;
    c.save();c.beginPath();c.rect(x,y,r.width,r.height);c.clip();
    for(const bead of s.beads){const bx=x+bead.x*r.width,by=y+bead.y*r.height,rad=bead.radius;
     if(bead.trail){c.strokeStyle='rgba(174,95,54,.2)';c.lineWidth=Math.max(1,rad*.7);c.beginPath();c.moveTo(bx,by);c.lineTo(bx,by-bead.trail);c.stroke();}
     c.fillStyle='rgba(155,72,35,.48)';c.strokeStyle='rgba(233,173,120,.58)';c.lineWidth=.7;c.beginPath();c.ellipse(bx,by,rad,rad*1.25,0,0,Math.PI*2);c.fill();c.stroke();
     c.fillStyle='rgba(255,222,178,.7)';c.beginPath();c.ellipse(bx-rad*.3,by-rad*.4,Math.max(.45,rad*.23),Math.max(.65,rad*.35),-.4,0,Math.PI*2);c.fill();
    }c.restore();
   }
  }
  stop(){if(this.stopped)return;this.stopped=true;this.running=false;this.cancel();this.clearBeads();this.clearSoot();this.observer?.disconnect();for(const [target,type,fn]of this.listeners)target.removeEventListener?.(type,fn);this.listeners=[];for(const l of this.layers)l.canvas.remove();this.layers=[];this.atmosphere?.remove();this.scenery.classList.remove('r127-env-host');this.root.classList.remove('r127-env-host');delete this.root.dataset.environmentEffect;if(owners.get(this.root)===this)owners.delete(this.root);}
  diagnostics(){return {effect:this.effect,running:this.running,stopped:this.stopped,frame:this.frame!==null,layers:this.layers.length,elapsed:this.elapsed,reducedMotion:this.reduced,clearing:this.pointer.strength};}
 }
 EnvironmentalEffects.register('rain',{
  create(engine){return {drops:Array.from({length:110},()=>({x:engine.random(),y:engine.random(),length:(10+engine.random()*24)*RAIN_VISUAL_SCALE,speed:300+engine.random()*320,depth:.35+engine.random()*.65})),nextLightning:9+engine.random()*12,flash:0};},
  draw(c,l,e,dt){const ui=l.canvas.dataset.layer==='interface',count=ui?85:(l.width<650?65:110),s=e.state;
   c.strokeStyle=ui?'#c88861':e.period==='night'?'#bf7658':'#a85232';c.lineWidth=(ui?1.1:1.2)*RAIN_VISUAL_SCALE;
   for(let i=0;i<count;i++){const p=s.drops[i];let x=(p.x*l.width+e.elapsed*p.speed*.23)%(l.width+55)-25,y=(p.y*l.height+e.elapsed*p.speed)%(l.height+45)-25;c.globalAlpha=(ui?.5:.58)*p.depth;c.beginPath();c.moveTo(x,y);c.lineTo(x-4-p.length*.22,y-p.length);c.stroke();}
   c.globalAlpha=1;
   if(!ui&&!e.reduced){if(e.elapsed>s.nextLightning){s.flash=.07;s.nextLightning=e.elapsed+11+e.random()*17;}s.flash=Math.max(0,s.flash-dt*.19);if(s.flash){c.fillStyle='rgba(231,219,200,'+s.flash+')';c.fillRect(0,0,l.width,l.height);}}
  }
 });
 EnvironmentalEffects.register('fog',{
  create(e){return {wisps:Array.from({length:14},()=>({x:e.random(),y:e.random(),size:.18+e.random()*.18,speed:4+e.random()*8,phase:e.random()*6.28}))};},
  draw(c,l,e){const ui=l.canvas.dataset.layer==='interface',p=e.pointer,strength=p.strength,px=p.x-l.x,py=p.y-l.y;
   for(const w of e.state.wisps){const radius=Math.max(90,l.width*w.size);let x=(w.x*(l.width+radius*2)+e.elapsed*w.speed)%(l.width+radius*2)-radius,y=w.y*l.height+Math.sin(e.elapsed*.11+w.phase)*22;
    const dx=x-px,dy=y-py,d=Math.hypot(dx,dy),push=Math.max(0,1-d/(radius+125))*strength*65;if(d>1){x+=dx/d*push;y+=dy/d*push;}
    const g=c.createRadialGradient(x,y,0,x,y,radius);g.addColorStop(0,ui?'rgba(224,232,190,.085)':'rgba(213,223,182,.26)');g.addColorStop(.48,ui?'rgba(220,231,191,.045)':'rgba(214,224,190,.14)');g.addColorStop(1,'rgba(220,230,195,0)');c.fillStyle=g;c.fillRect(x-radius,y-radius,radius*2,radius*2);
   }
   if(strength>.01){c.globalCompositeOperation='destination-out';const g=c.createRadialGradient(px,py,0,px,py,150);g.addColorStop(0,'rgba(0,0,0,'+(.97*strength)+')');g.addColorStop(.45,'rgba(0,0,0,'+(.75*strength)+')');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.fillRect(px-150,py-150,300,300);c.globalCompositeOperation='source-over';}
  }
 });

 function sootGrain(engine){
  return {
   x:engine.random(),
   y:engine.random()<.3?engine.random()*.22:engine.random(),
   size:1+engine.random()*2.3,
   edge:engine.random()
  };
 }

 function drawSoot(context,engine,dt){
  const {root,state,reduced}=engine;
  const bounds=root.getBoundingClientRect();
  const buttons=new Set(root.querySelectorAll('.gfx-choice'));
  for(const button of state.soot.keys()){
   if(buttons.has(button))continue;
   delete button.dataset.sootSpecks;
   state.soot.delete(button);
   if(state.path?.button===button)state.path=null;
  }

  for(const button of buttons){
   const rect=button.getBoundingClientRect();
   if(!rect.width||!rect.height)continue;
   let surface=state.soot.get(button);
   if(!surface){
    surface={specks:[],carry:0};
    state.soot.set(button,surface);
    if(reduced){
     surface.specks=Array.from({length:28},()=>sootGrain(engine));
    }
   }
   const limit=rect.width<400?88:116;
   if(!reduced){
    surface.carry+=dt*27;
    const count=Math.floor(surface.carry);
    surface.carry-=count;
    for(let i=0;i<count&&surface.specks.length<limit;i++){
     surface.specks.push(sootGrain(engine));
    }
   }

   const count=String(surface.specks.length);
   if(button.dataset.sootSpecks!==count)button.dataset.sootSpecks=count;
   context.save();
   context.beginPath();
   context.rect(rect.left-bounds.left,rect.top-bounds.top,rect.width,rect.height);
   context.clip();
   for(const speck of surface.specks){
    const x=rect.left-bounds.left+speck.x*rect.width;
    const y=rect.top-bounds.top+speck.y*rect.height;
    context.fillStyle='rgba(124,113,103,.25)';
    context.fillRect(x-.4,y-.4,speck.size+1,speck.size*.68+1);
    context.fillStyle='rgba(16,14,13,.62)';
    context.fillRect(x,y,speck.size,speck.size*.68);
   }
   context.restore();
  }
 }

 EnvironmentalEffects.register('ash',{
  create(engine){
   return {
    soot:new Map(),
    path:null,
    flakes:Array.from({length:96},()=>({
     x:engine.random(),
     y:engine.random(),
     size:.65+engine.random()*1.95,
     speed:12+engine.random()*28,
     drift:4+engine.random()*13,
     phase:engine.random()*Math.PI*2
    }))
   };
  },
  draw(context,layer,engine,dt){
   const ui=layer.canvas.dataset.layer==='interface';
   const limit=engine.reduced?20:ui?48:layer.width<650?64:96;
   const time=engine.elapsed;
   for(let i=0;i<limit;i++){
    const flake=engine.state.flakes[i];
    const x=(flake.x*layer.width+time*flake.drift+Math.sin(time*.8+flake.phase)*13+20)%(layer.width+32)-16;
    const y=(flake.y*layer.height+time*flake.speed)%(layer.height+12)-6;
    context.fillStyle=engine.period==='night'?'rgba(134,123,112,.48)':'rgba(103,95,88,.36)';
    context.fillRect(x-.5,y-.5,flake.size+1,flake.size+1);
    context.fillStyle='rgba(25,22,20,.78)';
    context.fillRect(x,y,flake.size,flake.size*.76);
   }
   if(ui)drawSoot(context,engine,dt);
  }
 });

 const descriptors=[{title:'THE RED RAIN',effect:'rain'},{title:'THE LIME FOG',effect:'fog'},{title:'THE BLACK SNOW',effect:'ash'}];
 function records(){return descriptors.map(d=>({...d,entry:RoadScenarioRegistry.entries.find(r=>r.encounter.title===d.title)})).filter(d=>d.entry);}
 function liveEffect(){if(stage!=='encounter'||combatState||!GraphicalUI.active()||TravelerPanels.dialog||Route127MapOverlay.dialog?.open||previewDialog)return null;const current=currentEncounter();return records().find(d=>d.entry.encounter===current)||null;}
 let live=null,previewDialog=null;
 function update(){const spec=liveEffect(),root=GraphicalUI.element?.frame,figure=GraphicalUI.element?.figure;if(!spec||!root||!figure||root.hidden){live?.stop();live=null;return;}
  if(live&&(live.effect!==spec.effect||live.root!==root)){live.stop();live=null;}
  const period=Route127RegionalSky.phase(player.flags.worldHour);if(!live)live=new EnvironmentalEffects(root,figure,{effect:spec.effect,period,buttonDroplets:spec.effect==='rain',buttonLimit:4});else if(live.period!==period){live.clearBeads();live.clearSoot();live.period=period;}
 }
 function preview(){if(previewDialog?.open)return;live?.stop();live=null;
  const dialog=document.createElement('dialog');previewDialog=dialog;dialog.className='r127-env-preview';dialog.setAttribute('aria-label','Environmental effects preview');
  const title=document.createElement('h2');title.textContent='ENVIRONMENTAL EFFECTS';const controls=document.createElement('div');controls.className='r127-env-controls';dialog.append(title,controls);
  const select=(label,items)=>{const wrap=document.createElement('label');wrap.textContent=label;const s=document.createElement('select');s.setAttribute('aria-label',label);for(const [value,text]of items){const o=document.createElement('option');o.value=value;o.textContent=text;s.append(o);}wrap.append(s);controls.append(wrap);return s;};
  const available=records(),encounter=select('Environmental encounter',available.map(d=>[d.effect,d.title]));
  const region=select('Weather preview region',Object.entries(Route127RegionalSky.regions).map(([key,row])=>[key,row[2]]));
  const period=select('Weather time of day',['dawn','day','dusk','night'].map(p=>[p,p.toUpperCase()]));
  const layout=select('Preview layout',[['desktop','Full width'],['phone','Phone width (390px)']]);
  const wetWrap=document.createElement('label'),wet=document.createElement('input');wet.type='checkbox';wet.checked=true;wet.setAttribute('aria-label','Button Droplets');wetWrap.append(wet,document.createTextNode('Button Droplets: ON'));controls.append(wetWrap);
  const stage=document.createElement('section');stage.className='r127-env-stage';const figure=document.createElement('figure');figure.className='r127-sky-preview-art';const img=document.createElement('img');img.alt='Environmental region background';figure.append(img);const choices=document.createElement('div');choices.className='r127-env-choices';stage.append(figure,choices);
  const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Preview only — no gameplay or saved progress changes.';
  let controller=null,revision=0,closed=false,mode='playing';
  function start(){controller?.stop();controller=new EnvironmentalEffects(stage,figure,{effect:encounter.value,period:period.value,buttonDroplets:wet.checked,buttonLimit:4});if(mode==='paused')controller.pause();if(mode==='stopped'){controller.stop();controller=null;}}
  wet.addEventListener('change',()=>{controller?.setButtonDroplets(wet.checked,4);wetWrap.lastChild.textContent='Button Droplets: '+(wet.checked?'ON':'OFF');});
  layout.addEventListener('change',()=>{stage.classList.toggle('r127-env-phone',layout.value==='phone');controller?.resize();});
  async function render(){const version=++revision,spec=available.find(d=>d.effect===encounter.value);controller?.stop();controller=null;wetWrap.hidden=encounter.value!=='rain';choices.replaceChildren();
   for(const label of spec.entry.encounter.choices.split(/\s{2,}/).filter(Boolean)){const b=GraphicalUI.button(label,()=>{status.textContent=label+' — visual interaction only; no outcome executed.';},'gfx-choice');choices.append(b);}
   const scene=Route127RegionalSky.describe(region.value,{dawn:6,day:12,dusk:18,night:22}[period.value]),base=new URL('../../assets/regions/',document.currentScript?.src||new URL('../devtest/runtime/environmental_effects_wo46.js',document.baseURI));
   const source=file=>new URL(file,base).href;const files=scene.sky?[scene.overlay,scene.sky]:[scene.original];
   try{await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const im=new Image();im.onload=resolve;im.onerror=reject;im.src=source(file);})));
    if(closed||version!==revision)return;
    img.src=source(scene.sky?scene.overlay:scene.original);
    let sky=figure.querySelector('.r127-regional-sky');if(!sky){sky=document.createElement('div');sky.className='r127-regional-sky';sky.setAttribute('aria-hidden','true');figure.insertBefore(sky,img);}
    sky.hidden=!scene.sky;sky.style.backgroundImage=scene.sky?'url("'+source(scene.sky)+'")':'';figure.classList.toggle('r127-regional-layered',!!scene.sky);if(scene.sky)figure.dataset.skyPeriod=scene.period;else delete figure.dataset.skyPeriod;
    img.alt=scene.title+' — '+scene.period;start();status.textContent=spec.title+' — '+scene.title+' — '+scene.period+' — '+mode;
   }catch{if(!closed&&version===revision)status.textContent='Regional artwork failed to load. Change a selector to retry.';}
  }
  const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);controls.append(b);return b;};
  button('PLAY',()=>{mode='playing';if(controller)controller.play();else start();status.textContent='Playing';});
  button('PAUSE',()=>{mode='paused';controller?.pause();status.textContent='Paused';});
  button('RESTART',()=>{mode='playing';if(controller)controller.restart();else start();status.textContent='Restarted';});
  button('STOP',()=>{mode='stopped';controller?.stop();controller=null;status.textContent='Stopped — all weather layers removed';});
  button('Close effects',()=>dialog.close());
  for(const s of [encounter,region,period])s.addEventListener('change',render);
  dialog.addEventListener('keydown',event=>event.stopPropagation());
  dialog.addEventListener('close',()=>{closed=true;revision++;controller?.stop();dialog.remove();previewDialog=null;GraphicalUI.sync();},{once:true});
  dialog.append(stage,status);document.body.append(dialog);dialog.showModal();encounter.focus();render();
 }
 const oldKey=FocusedEntry.key;FocusedEntry.key=function(event){if(previewDialog?.open)return;return oldKey.call(this,event);};
 const oldSync=GraphicalUI.sync;GraphicalUI.sync=function(...args){const result=oldSync.apply(this,args);update();return result;};
 const oldLoad=loadGame;loadGame=function(...args){live?.stop();live=null;previewDialog?.close();return oldLoad.apply(this,args);};
 const oldOptions=TravelerPanels.options;TravelerPanels.options=function(...args){const result=oldOptions.apply(this,args);if(this.which==='options'){const panel=this.body?.querySelector('.traveler-detail');if(panel&&!panel.querySelector('[data-environment-preview]')){const b=this.button('ENVIRONMENTAL EFFECTS',()=>{this.close();preview();});b.dataset.environmentPreview='true';panel.append(b);}}return result;};
 globalThis.Route127Environment=Object.freeze({Controller:EnvironmentalEffects,records,liveEffect,preview,diagnostics:()=>live?.diagnostics()||null});
})();
