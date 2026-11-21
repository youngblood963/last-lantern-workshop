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
 .gfx-frame[data-environment-effect="tar"] .gfx-art-caption{z-index:5}
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
  constructor(root,scenery,{effect,period='day',region='CENTRAL',buttonDroplets=false,buttonLimit=1,powerActive=true}={}){
   owners.get(root)?.stop();owners.set(root,this);this.root=root;this.scenery=scenery;this.effect=effect;this.period=period;this.region=region;
   this.powerActive=powerActive;
   this.running=false;this.stopped=false;this.frame=null;this.elapsed=0;this.last=0;this.listeners=[];this.layers=[];
   this.wetButtons=new Map();this.buttonDroplets=buttonDroplets&&effect==='rain';this.buttonLimit=buttonLimit;
   this.randomState=(Date.now()+(sequence++*2654435761))>>>0;
   this.motion=matchMedia('(prefers-reduced-motion: reduce)');this.reduced=this.motion.matches;
   this.pointer={x:0,y:0,target:0,strength:0,until:0,focused:false};this.lastPointer=-1000;
   root.classList.add('r127-env-host');scenery.classList.add('r127-env-host');root.dataset.environmentEffect=effect;
   this.atmosphere=document.createElement('div');this.atmosphere.className='r127-env-atmosphere';this.atmosphere.setAttribute('aria-hidden','true');scenery.append(this.atmosphere);
   const layers=[[scenery,'scenery']];
   if(effect!=='tar')layers.push([root,'interface']);
   for(const [host,name]of layers){
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
   this.listen(root,'focusin',e=>{if(this.effect==='glass'&&(this.reduced||!this.running))this.draw(0);if(performance.now()-this.lastPointer<300)return;const b=e.target.closest?.('button');if(b){const r=b.getBoundingClientRect(),box=root.getBoundingClientRect();if(this.effect!=='fog')return;this.interact(r.left+r.width/2-box.left,r.top+r.height/2-box.top,true);}});
   this.listen(root,'focusout',()=>{if(this.effect==='fog'){this.pointer.focused=false;this.release();}});
   this.listen(document,'visibilitychange',()=>{if(this.effect==='wires'&&!document.hidden)this.draw(0);this.schedule();});
   this.listen(this.motion,'change',e=>{this.reduced=e.matches;if(this.effect==='wires'||this.effect==='furnace'){this.state.contact=null;this.draw(0);}this.schedule();});
   if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.resize());this.observer.observe(root);this.observer.observe(scenery);}
   else this.listen(window,'resize',()=>this.resize());
   this.resize();this.play();
  }
  random(){this.randomState=(Math.imul(this.randomState,1664525)+1013904223)>>>0;return this.randomState/4294967296;}
  listen(target,type,fn){target.addEventListener?.(type,fn,{passive:true});this.listeners.push([target,type,fn]);}
  approach(event,touch=false){
   if(this.effect==='furnace'){
    const button=event.target?.closest?.('.gfx-choice');
    if(button&&this.running&&!this.reduced)this.state.contact={button,time:this.elapsed};
    return;
   }
   if(this.effect==='wires'){
    if(!this.powerActive||this.reduced||!this.running)return;
    const button=event.target?.closest?.('.gfx-choice');
    if(button){
     const rect=button.getBoundingClientRect();
     this.state.contact={button,x:event.clientX-rect.left,time:this.elapsed};
    }
    return;
   }
   if(this.effect==='glass'){
    const button=event.target?.closest?.('.gfx-choice');
    if(!button){this.state.highlight=null;return;}
    const rect=button.getBoundingClientRect();
    this.state.highlight={button,x:event.clientX-rect.left,y:event.clientY-rect.top,until:performance.now()+650};
    if(this.reduced||!this.running)this.draw(0);
    return;
   }
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
   surface.tracks.push({x1:start.x/rect.width,y1:start.y/rect.height,
    x2:end.x/rect.width,y2:end.y/rect.height,life:1});
   if(surface.tracks.length>48)surface.tracks.shift();
   surface.specks=surface.specks.filter(speck=>{
    const x=speck.x*rect.width-start.x,y=speck.y*rect.height-start.y;
    const along=Math.max(0,Math.min(1,(x*dx+y*dy)/lengthSquared));
    const distance=Math.hypot(x-along*dx,y-along*dy);
    // Keep scattered grains in the track and more residue toward its edges.
    const keep=distance>8+speck.edge*8||speck.edge<.12;
    if(!keep)surface.refill.push(speck);
    return keep;
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
  resize(){if(this.stopped)return;if(this.effect==='ash')this.state.path=null;const root=this.root.getBoundingClientRect();
   for(const l of this.layers){const r=l.host.getBoundingClientRect();l.width=Math.max(1,r.width);l.height=Math.max(1,r.height);l.x=r.left-root.left;l.y=r.top-root.top;const scale=Math.min(devicePixelRatio||1,1.5,1400/l.width);l.canvas.width=Math.ceil(l.width*scale);l.canvas.height=Math.ceil(l.height*scale);l.context?.setTransform(scale,0,0,scale,0,0);}
   this.draw(0);
  }
  play(){if(this.stopped)return;this.running=true;this.last=0;this.schedule();}
  pause(){this.running=false;this.cancel();}
  restart(){if(this.stopped)return;this.clearBeads();this.clearSoot();this.elapsed=0;this.state=effects.get(this.effect).create(this);this.pointer.strength=0;this.pointer.target=0;if(this.effect==='wires')this.draw(0);this.play();}
  cancel(){if(this.frame!==null){cancelAnimationFrame(this.frame);this.frame=null;}}
  schedule(){if(this.stopped||document.hidden||!this.running){this.cancel();return;}if(this.reduced){this.cancel();this.draw(0);return;}if(this.effect==='wires'&&!this.powerActive&&this.state.glow===0){this.cancel();return;}if(this.frame!==null)return;
   this.frame=requestAnimationFrame(time=>{this.frame=null;if(!['wires','furnace','tar'].includes(this.effect)||time-this.last>=32){
     const dt=this.last?Math.min(.05,(time-this.last)/1000):0;this.last=time;this.elapsed+=dt;this.draw(dt);
    }
    this.schedule();});
  }
  draw(dt){if(this.stopped||document.hidden)return;const p=this.pointer;if(p.until&&performance.now()>p.until&&!p.focused){p.until=0;p.target=0;}p.strength+=(p.target-p.strength)*(this.reduced?1:Math.min(1,dt*5));
   if(this.effect==='wires'){
    this.state.glow=this.powerActive?1:this.reduced?0:Math.max(0,this.state.glow-dt*3);
   }
   this.atmosphere.style.background=this.effect==='rain'?'rgba(96,37,24,.19)':(['glass','wires','furnace','tar'].includes(this.effect))?'transparent':this.effect==='ash'?'rgba(63,59,54,.12)':'rgba(145,154,111,.07)';
   this.atmosphere.style.opacity=this.period==='night'?'.85':'.65';
   for(const layer of this.layers){const c=layer.context;if(!c)continue;c.clearRect(0,0,layer.width,layer.height);effects.get(this.effect).draw(c,layer,this,dt);if(layer.canvas.dataset.layer==='interface'&&this.buttonDroplets)this.drawBeads(c,dt);}
  }
  setPowerActive(active){
   if(this.effect!=='wires'||active===this.powerActive)return;
   this.powerActive=active;
   this.state.contact=null;
   if(active||this.reduced||!this.running)this.state.glow=Number(active);
   this.last=0;
   this.draw(0);
   this.schedule();
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
  diagnostics(){return {effect:this.effect,running:this.running,stopped:this.stopped,frame:this.frame!==null,layers:this.layers.length,elapsed:this.elapsed,reducedMotion:this.reduced,clearing:this.pointer.strength,...(this.effect==='wires'?{powerActive:this.powerActive,region:this.region}:{})};}
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
    surface={specks:[],refill:[],carry:0,tracks:[]};
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
     surface.specks.push(surface.refill.shift()??sootGrain(engine));
    }
   }

   const count=String(surface.specks.length);
   if(button.dataset.sootSpecks!==count)button.dataset.sootSpecks=count;
   context.save();
   context.beginPath();
   context.rect(rect.left-bounds.left,rect.top-bounds.top,rect.width,rect.height);
   context.clip();
   const left=rect.left-bounds.left,top=rect.top-bounds.top;
   for(const track of surface.tracks){
    track.life-=dt*.28;
    if(track.life<=0)continue;
    const x=left+track.x1*rect.width,y=top+track.y1*rect.height;
    const dx=(track.x2-track.x1)*rect.width,dy=(track.y2-track.y1)*rect.height;
    const length=Math.hypot(dx,dy);
    if(length<1)continue;
    const steps=Math.min(90,Math.ceil(length/3));
    context.fillStyle='rgba(171,146,114,'+(.20*track.life)+')';
    for(let i=0;i<=steps;i++){
     const t=i/steps,offset=Math.sin(i*2.7+x)*6;
     const px=x+dx*t-dy/length*offset,py=y+dy*t+dx/length*offset;
     context.fillRect(px-3,py-4,6,8);
     if(i%3===0)context.fillRect(px+dy/length*7,py-dx/length*7,2,2);
    }
   }
   surface.tracks=surface.tracks.filter(track=>track.life>0);
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
     size:1.15+engine.random()*3.3,
     speed:12+engine.random()*28,
     drift:4+engine.random()*13,
     phase:engine.random()*Math.PI*2,
     opacity:.45+engine.random()*.55
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
    context.globalAlpha=flake.opacity;
    context.fillStyle=engine.period==='night'?'rgba(134,123,112,.48)':'rgba(103,95,88,.36)';
    context.fillRect(x-.5,y-.5,flake.size+1,flake.size+1);
    context.fillStyle='rgba(25,22,20,.78)';
    context.fillRect(x,y,flake.size,flake.size*.76);
   }
   context.globalAlpha=1;
   if(ui)drawSoot(context,engine,dt);
  }
 });

 // Road outlines in a 500×282 reference space for the existing regional art.
 const glassRoads={
  CENTRAL:[
   [[185,229],[199,218],[222,216],[229,224],[242,228],[237,241],[218,251],[203,246],[177,250]],
   [[245,175],[257,169],[276,172],[288,180],[305,184],[298,190],[278,192],[265,186],[251,187]],
   [[320,258],[334,253],[344,258],[357,257],[366,268],[386,273],[382,282],[344,282],[326,273]],
   [[221,157],[234,155],[246,160],[239,165],[226,164]]
  ],
  INDUSTRIAL:[
   [[197,238],[218,227],[241,228],[255,222],[265,230],[283,239],[275,252],[251,256],[235,264],[207,259]],
   [[313,211],[330,205],[349,210],[364,217],[374,224],[360,237],[339,234],[327,226]],
   [[265,174],[276,170],[289,175],[295,182],[283,187],[271,183]]
  ]
 };
 const glassLight={
  dawn:[231,208,143],day:[222,255,202],dusk:[242,182,99],night:[161,213,195]
 };
 const glassFacets=['rgba(22,72,46,.54)','rgba(46,111,60,.48)','rgba(91,149,72,.49)',
  'rgba(27,95,50,.48)','rgba(127,164,75,.44)','rgba(18,49,34,.59)'];
 const buttonCracks=[
  [[.06,0],[.12,.27],[.09,.45],[.18,.68],[.22,1]],
  [[.12,.27],[.22,.21],[.29,.32],[.36,.28]],
  [[.18,.68],[.25,.62],[.31,.77]],
  [[.95,0],[.89,.30],[.91,.53],[.81,.72],[.77,1]],
  [[.89,.30],[.77,.24],[.72,.35],[.66,.32]],
  [[.91,.53],[.97,.70],[1,.72]],
  [[.81,.72],[.72,.68],[.66,.82],[.58,.85]]
 ];

 function strokePath(context,points,color,width){
  context.beginPath();
  context.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)context.lineTo(...points[i]);
  context.strokeStyle=color;
  context.lineWidth=width;
  context.stroke();
 }

 function glassPolygon(context,points,color){
  context.beginPath();
  context.moveTo(...points[0]);
  for(let i=1;i<points.length;i++)context.lineTo(...points[i]);
  context.lineTo(...points[0]);
  context.fillStyle=color;
  context.fill();
 }

 function glassGlint(context,edge,engine,offset,road){
  const [start,end]=edge;
  const night=engine.period==='night';
  const cycle=night?8:4.3;
  const progress=engine.reduced?.55:(engine.elapsed+offset)%cycle/1.2;
  if(progress>=1)return;
  const strength=(engine.reduced?.28:Math.sin(progress*Math.PI))*(night?.46:.87);
  const t=Math.max(0,progress-.16);
  const point=q=>[start[0]+(end[0]-start[0])*q,start[1]+(end[1]-start[1])*q];
  const head=point(progress);
  const color=glassLight[engine.period]||glassLight.day;
  strokePath(context,[point(t),head],'rgba('+color.join(',')+','+strength+')',road?2.6:1.35);
  context.fillStyle='rgba('+color.join(',')+','+strength+')';
  context.fillRect(head[0]-1,head[1]-1,road?3:2,road?3:2);
 }

 function drawRoadGlass(context,layer,engine){
  const patches=glassRoads[engine.region];
  if(!patches)return;
  const image=engine.scenery.querySelector?.('img');
  const scene=layer.host.getBoundingClientRect();
  const box=image?.getBoundingClientRect()||scene;
  if(!box.width||!box.height)return;
  const style=image&&typeof getComputedStyle==='function'?getComputedStyle(image):null;
  const naturalWidth=image?.naturalWidth||500,naturalHeight=image?.naturalHeight||282;
  const fit=style?.objectFit;
  const scale=(fit==='contain'?Math.min:Math.max)(box.width/naturalWidth,box.height/naturalHeight);
  const width=naturalWidth*scale,height=naturalHeight*scale;
  const position=(style?.objectPosition||'50% 50%').split(' ');
  const alignment=value=>value?.endsWith('%')?Number.parseFloat(value)/100:.5;
  const left=box.left-scene.left+(box.width-width)*alignment(position[0]);
  const top=box.top-scene.top+(box.height-height)*alignment(position[1]);
  const project=([x,y])=>[left+x/500*width,top+y/282*height];

  context.save();
  context.beginPath();
  context.rect(box.left-scene.left,box.top-scene.top,box.width,box.height);
  context.clip();
  for(const [index,patch] of patches.entries()){
   const points=patch.map(project);
   const center=project([patch.reduce((sum,p)=>sum+p[0],0)/patch.length,
    patch.reduce((sum,p)=>sum+p[1],0)/patch.length]);
   const night=engine.period==='night';
   context.globalAlpha=night?.78:1;
   const rim=[];
   for(let i=0;i<patch.length;i++){
    const [x,y]=patch[i],next=patch[(i+1)%patch.length];
    const dx=next[0]-x,dy=next[1]-y;
    const length=Math.hypot(dx,dy);
    rim.push(points[i]);
    const teeth=Math.max(1,Math.floor(length/5));
    for(let j=1;j<teeth;j++){
     const t=j/teeth;
     const jitter=Math.sin((i+1)*11+j*7)*Math.min(1.8,length*.12);
     rim.push(project([x+dx*t-dy/length*jitter,y+dy*t+dx/length*jitter]));
    }
   }
   context.save();
   context.beginPath();
   context.moveTo(...rim[0]);
   for(let i=1;i<rim.length;i++)context.lineTo(...rim[i]);
   context.lineTo(...rim[0]);
   context.clip();
   glassPolygon(context,rim,'rgba(22,47,32,.18)');
   for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length];
    const weight=.22+.12*Math.sin(i*2.4+index);
    const split=[center[0]*.42+a[0]*weight+b[0]*(.58-weight),
     center[1]*.42+a[1]*weight+b[1]*(.58-weight)];
    const color=(i+index*3)%glassFacets.length;
    glassPolygon(context,[center,a,split],glassFacets[color]);
    glassPolygon(context,[a,b,split],glassFacets[(color+2)%glassFacets.length]);
    glassPolygon(context,[b,center,split],glassFacets[(color+4)%glassFacets.length]);
    strokePath(context,[a,split,b],i%3===0?'rgba(185,213,132,.55)':'rgba(19,47,27,.57)',i%3===0?1.1:.8);
   }
   context.restore();
   strokePath(context,[...rim,rim[0]],night?'rgba(142,191,158,.32)':'rgba(162,195,111,.59)',1.25);
   glassGlint(context,[points[index%points.length],points[(index+1)%points.length]],engine,index*1.37,true);
   glassGlint(context,[center,points[(index+3)%points.length]],engine,index*1.37+1.9,true);
  }
  context.restore();
 }

 function drawGlassButtons(context,engine){
  const bounds=engine.root.getBoundingClientRect();
  const highlight=engine.state.highlight;
  const buttons=engine.root.querySelectorAll('.gfx-choice');
  for(const [index,button] of Array.from(buttons).entries()){
   const rect=button.getBoundingClientRect();
   if(!rect.width||!rect.height)continue;
   const left=rect.left-bounds.left,top=rect.top-bounds.top;
   const mirror=index%2!==0;
   const project=([x,y])=>[left+(mirror?1-x:x)*rect.width,top+y*rect.height];

   context.save();
   context.beginPath();
   context.rect(left,top,rect.width,rect.height);
   context.clip();
   for(const [crackIndex,crack] of buttonCracks.entries()){
    const points=crack.map(project);
    const middle=crack[Math.floor(crack.length/2)];
    const near=highlight?.button===button&&highlight.until>performance.now()&&
     Math.hypot((mirror?1-middle[0]:middle[0])*rect.width-highlight.x,middle[1]*rect.height-highlight.y)<85;
    const focused=button.matches?.(':focus-visible')&&(crackIndex===0||crackIndex===3);
    strokePath(context,points,'rgba(12,22,15,.48)',2.1);
    strokePath(context,points,near||focused?'rgba(204,232,159,.68)':'rgba(152,181,116,.38)',1);
    if(crackIndex===index%buttonCracks.length)glassGlint(context,points,engine,index*.87,false);
   }
   context.restore();
  }
 }

 EnvironmentalEffects.register('glass',{
  create(){return {highlight:null};},
  draw(context,layer,engine){
   if(layer.canvas.dataset.layer==='scenery')drawRoadGlass(context,layer,engine);
   else drawGlassButtons(context,engine);
  }
 });

 // Cable runs stay low in the frame so the skyline and road remain visible.
 const wireRuns=[
  [[-.02,.73],[.10,.77],[.21,.83],[.31,.85],[.42,.82],[.49,.77]],
  [[1.02,.58],[.90,.65],[.83,.73],[.75,.77],[.68,.76],[.63,.72]],
  [[1.02,.91],[.92,.88],[.86,.87],[.80,.91],[.75,.92]]
 ];
 const wireBlue=alpha=>'rgba(137,211,255,'+alpha+')';

 function drawWireScenery(context,layer,engine){
  const {width,height}=layer;
  const size=Math.max(.72,Math.min(1.5,width/650));
  context.save();
  context.lineJoin='round';
  context.lineCap='round';
  for(const [index,run] of wireRuns.entries()){
   const points=run.map(([x,y])=>[x*width,y*height]);
   strokePath(context,points,'rgba(10,11,13,.85)',5*size);
   strokePath(context,points,'rgba(102,96,88,.58)',1.6*size);
   const glow=engine.state.glow;
   if(!glow)continue;
   // Stagger three contacts along each cable without changing the pulse timing.
   for(let site=0;site<3;site++){
    const end=points.length-3+site;
    const [x,y]=points[end];
    const [px,py]=points[end-1];
    const dx=x-px,dy=y-py;
    const radius=18*size;
    const light=context.createRadialGradient(x,y,0,x,y,radius);
    light.addColorStop(0,wireBlue(.42*glow));
    light.addColorStop(1,wireBlue(0));
    context.fillStyle=light;
    context.fillRect(x-radius,y-radius,radius*2,radius*2);
    strokePath(context,[[x-dx*.23,y-dy*.23],[x,y]],wireBlue(.35*glow),1.8*size);
    if(engine.reduced||!engine.powerActive)continue;
    const phase=(engine.elapsed+.4+index*2.3+site*7/3)%7/1.55;
    if(phase>=1)continue;
    const trail=Math.max(0,phase-.34);
    const head=[px+dx*phase,py+dy*phase];
    const strength=Math.sin(phase*Math.PI);
    strokePath(context,[[px+dx*trail,py+dy*trail],head],wireBlue(.88*strength),2.4*size);
    const arc=Math.pow(strength,2);
    const reach=11*size;
    strokePath(context,[head,[head[0]+reach*.35,head[1]-reach*.65],
     [head[0]+reach*.68,head[1]-reach*.48],[head[0]+reach,head[1]-reach]],wireBlue(.76*arc),1.6*size);
   }
  }
  context.restore();
 }

 function drawWireButtons(context,engine){
  if(!engine.powerActive||engine.reduced)return;
  const bounds=engine.root.getBoundingClientRect();
  const contact=engine.state.contact;
  const buttons=Array.from(engine.root.querySelectorAll('.gfx-choice')).slice(0,engine.buttonLimit);
  for(const [index,button] of buttons.entries()){
   const rect=button.getBoundingClientRect();
   if(rect.width<16||rect.height<8)continue;
   const left=rect.left-bounds.left,top=rect.top-bounds.top+2;
   const right=left+rect.width-3,bottom=top+rect.height-4;
   strokePath(context,[[left+3,top+5],[left+3,top],[left+18,top]],wireBlue(.48),1.4);
   strokePath(context,[[right-15,bottom],[right,bottom],[right,bottom-5]],wireBlue(.48),1.4);
   for(let trace=0;trace<3;trace++){
    const phase=(engine.elapsed+.6+index*2.1+trace*8/3)%8/1.6;
    if(phase>=1)continue;
    const x=left+5+(rect.width-10)*phase;
    const y=trace===1?bottom:top;
    const inward=trace===1?-1:1;
    const strength=Math.sin(phase*Math.PI);
    strokePath(context,[[Math.max(left+3,x-32),y],[x,y]],wireBlue(.84*strength),2);
    strokePath(context,[[x,y],[x+2,y+3*inward],[x+3,y+inward]],wireBlue(.65*strength),1.3);
   }
   if(contact?.button!==button)continue;
   const age=engine.elapsed-contact.time;
   if(age>=.55)continue;
   const x=left+Math.max(8,Math.min(rect.width-8,contact.x));
   strokePath(context,[[x-7,top],[x+7,top]],wireBlue(.65*(1-age/.55)),2);
  }
 }

 EnvironmentalEffects.register('wires',{
  create(engine){return {glow:Number(engine.powerActive),contact:null};},
  draw(context,layer,engine){
   if(layer.canvas.dataset.layer==='scenery')drawWireScenery(context,layer,engine);
   else drawWireButtons(context,engine);
  }
 });

 // Resample only thin bands of the loaded artwork, keeping the heat distortion
 // in the lower-center plume. No pixel readback or full-scene copy.
 function furnaceShimmer(c,layer,engine){
  const image=layer.host.querySelector?.('img');
  if(!image?.naturalWidth||!image.naturalHeight||!c.drawImage)return;
  const box=image.getBoundingClientRect(),host=layer.host.getBoundingClientRect();
  if(!box.width||!box.height)return;
  const fit=getComputedStyle(image);
  const scale=(fit.objectFit==='contain'?Math.min:Math.max)(box.width/image.naturalWidth,box.height/image.naturalHeight);
  const width=image.naturalWidth*scale,height=image.naturalHeight*scale;
  const alignment=value=>value?.endsWith('%')?parseFloat(value)/100:.5;
  const [ox,oy]=fit.objectPosition.split(' ').map(alignment);
  const left=box.left-host.left+(box.width-width)*ox;
  const top=box.top-host.top+(box.height-height)*oy;
  const x=box.left-host.left+box.width*.28,span=box.width*.44;
  const plumeTop=box.top-host.top+box.height*.47;
  const plumeHeight=box.height*.44;
  c.save();
  c.beginPath();c.rect(x,plumeTop,span,plumeHeight);c.clip();
  for(let i=0;i<12;i++){
   const rise=(i/12+engine.elapsed*.11)%1;
   const y=plumeTop+(1-rise)*plumeHeight;
   const band=Math.min(5,plumeHeight/18);
   const wave=Math.sin(rise*18-engine.elapsed*.85)*4;
   c.globalAlpha=.57*Math.sin(rise*Math.PI);
   c.drawImage(image,(x-left)/scale,(y-top)/scale,span/scale,band/scale,x+wave,y,span,band);
  }
  c.restore();
 }

 function furnaceGlow(c,x,y,radius,opacity){
  const light=c.createRadialGradient(x,y,0,x,y,radius);
  light.addColorStop(0,'rgba(255,101,26,'+opacity+')');
  light.addColorStop(.46,'rgba(232,66,16,'+(opacity*.54)+')');
  light.addColorStop(1,'rgba(232,66,16,0)');
  c.fillStyle=light;
  c.fillRect(x-radius,y-radius,radius*2,radius*2);
 }

 function drawFurnaceScenery(c,layer,engine){
  const {width,height}=layer;
  if(!engine.reduced)furnaceShimmer(c,layer,engine);
  const pulse=engine.reduced?0:Math.sin(engine.elapsed*.55)*.035;
  furnaceGlow(c,width*.5,height*.98,Math.min(width*.62,height*.67),.55+pulse);
  if(engine.reduced)return;
  const count=width<650?44:64;
  for(let i=0;i<count;i++){
   const ember=engine.state.embers[i];
   const age=(ember.phase+engine.elapsed*ember.speed)%1;
   const x=width*(ember.x+Math.sin(ember.phase*13+engine.elapsed*.9)*.035);
   const y=height*(.96-age*ember.rise);
   const alpha=Math.min(1,age*10)*(1-age)*ember.brightness;
   c.fillStyle='rgba(243,62,16,'+(alpha*.42)+')';
   c.beginPath();c.ellipse(x,y,ember.size*1.9,ember.size*1.9,0,0,Math.PI*2);c.fill();
   c.fillStyle='rgba(255,'+ember.green+',53,'+alpha+')';
   c.beginPath();c.ellipse(x,y,ember.size,ember.size*.8,0,0,Math.PI*2);c.fill();
  }
 }

 function drawFurnaceButtons(c,engine){
  const bounds=engine.root.getBoundingClientRect();
  const contact=engine.state.contact;
  for(const [i,button] of Array.from(engine.root.querySelectorAll('.gfx-choice')).slice(0,engine.buttonLimit).entries()){
   const rect=button.getBoundingClientRect();
   if(rect.width<20||rect.height<12)continue;
   const x=rect.left-bounds.left+3,y=rect.bottom-bounds.top-3,width=rect.width-6;
   const response=contact?.button===button?Math.max(0,1-(engine.elapsed-contact.time)/.7):0;
   strokePath(c,[[x,y-5],[x,y],[x+width,y],[x+width,y-5]],
    'rgba(255,120,49,'+(.48+response*.25)+')',1.6);
   if(engine.reduced)continue;
   for(let j=0;j<3;j++){
    const phase=(engine.elapsed*.22+j/3+i*.13)%1;
    const px=x+width*(.1+j*.37)+Math.sin(phase*Math.PI*2)*6;
    const strength=Math.sin(phase*Math.PI);
    c.fillStyle='rgba(255,149,58,'+(.75*strength)+')';
    c.fillRect(px,y-6*phase,2.5,2.5);
    strokePath(c,[[px-8,y+2],[px,y+1+Math.sin(phase*Math.PI*2)],[px+8,y+2]],
     'rgba(255,92,29,'+(.34*strength)+')',1);
   }
  }
 }

 EnvironmentalEffects.register('furnace',{
  create(engine){
   return {contact:null,embers:Array.from({length:64},()=>({
    x:.12+engine.random()*.76,phase:engine.random(),speed:.08+engine.random()*.075,
    rise:.44+engine.random()*.48,size:1.3+engine.random()*2.1,
    brightness:.72+engine.random()*.28,green:104+Math.round(engine.random()*104)
   }))};
  },
  draw(context,layer,engine){
   if(layer.canvas.dataset.layer==='scenery')drawFurnaceScenery(context,layer,engine);
   else drawFurnaceButtons(context,engine);
  }
 });

 // Local scene coordinates keep the shoreline and props together as the figure resizes.
 function tarShore(c){
  c.beginPath();
  c.moveTo(4,75);
  c.bezierCurveTo(1,65,28,55,42,48);
  c.bezierCurveTo(62,39,55,32,98,34);
  c.bezierCurveTo(120,32,128,22,160,28);
  c.bezierCurveTo(184,31,202,24,238,33);
  c.bezierCurveTo(267,38,299,47,296,61);
  c.bezierCurveTo(295,72,269,75,252,87);
  c.bezierCurveTo(224,106,181,107,154,103);
  c.bezierCurveTo(120,98,109,116,66,103);
  c.bezierCurveTo(37,95,8,91,4,75);
  c.closePath();
 }

 function tarShape(c,points,color){
  c.beginPath();
  c.moveTo(...points[0]);
  for(const point of points.slice(1))c.lineTo(...point);
  c.closePath();
  c.fillStyle=color;
  c.fill();
 }

 function tarProps(c,night,caseRecovered){
  const rust=night?'#46342b':'#78503a';
  const edge=night?'#685a4d':'#a68669';
  tarShape(c,[[47,68],[59,49],[64,24],[82,28],[73,42],[71,61],[58,71]],rust);
  tarShape(c,[[64,24],[82,28],[80,33],[63,29]],edge);
  tarShape(c,[[52,67],[64,31],[69,32],[64,60]],'#23201c');
  tarShape(c,[[198,46],[216,44],[226,26],[233,27],[225,50],[205,51]],rust);
  strokePath(c,[[215,45],[225,27],[232,28]],edge,1.6);
  tarShape(c,[[246,74],[263,55],[280,58],[267,69]],rust);
  strokePath(c,[[248,72],[263,55],[279,58]],edge,1.4);
  if(caseRecovered)return;
  const lip=night?'#65675b':'#a29c7e';
  tarShape(c,[[109,61],[145,49],[173,55],[170,71],[138,82],[111,74]],night?'#33382f':'#565346');
  tarShape(c,[[109,61],[145,49],[173,55],[137,68]],night?'#53594e':'#7f7e68');
  tarShape(c,[[137,68],[173,55],[170,71],[138,82]],night?'#272c27':'#403e33');
  strokePath(c,[[111,65],[137,72],[172,60]],lip,1.2);
  strokePath(c,[[133,60],[133,56],[145,52],[149,54],[149,56]],'#272822',2.2);
  for(const [x,y] of [[143,70],[159,64]]){
   c.fillStyle=lip;
   c.fillRect(x,y,3,4);
  }
  strokePath(c,[[109,74],[121,78],[138,82],[160,76],[172,71]],'#0a0d0c',3);
 }

 EnvironmentalEffects.register('tar',{
  create(engine){
   return {
    bubbles:Array.from({length:12},()=>({
     x:27+engine.random()*250,y:39+engine.random()*53,
     radius:2+engine.random()*7,cycle:4+engine.random()*8,phase:engine.random()
    })),
    rocks:Array.from({length:34},(_,i)=>({
     angle:(i+engine.random()*.7)/34*Math.PI*2,offset:engine.random()*10-5,
     size:1.5+engine.random()*5
    })),
    wisps:Array.from({length:3},(_,i)=>({
     x:72+i*73,phase:engine.random(),cycle:13+engine.random()*5
    }))
   };
  },
  draw(c,layer,engine){
   const {width,height}=layer;
   const poolWidth=Math.min(width*.32,height*1.25);
   c.save();
   c.translate(width*.98-poolWidth,height*.49);
   c.scale(poolWidth/300,Math.min(height*.27,poolWidth*.40)/115);
   const night=engine.period==='night';
   const time=engine.reduced?0:engine.elapsed;
   const reflection=night?'157,183,187':engine.period==='day'?'194,195,171':'220,155,105';

   tarShore(c);
   c.lineJoin='round';
   c.lineWidth=13;
   c.strokeStyle=night?'#221f19':'#433723';
   c.stroke();
   const pitch=c.createLinearGradient(0,26,0,108);
   pitch.addColorStop(0,night?'#131c1e':'#30302b');
   pitch.addColorStop(.38,'#080b0c');
   pitch.addColorStop(.73,night?'#151d20':'#222828');
   pitch.addColorStop(1,'#070909');
   c.fillStyle=pitch;
   c.fill();

   c.save();
   c.clip();
   // Broken highlights on the surface and expanding rings after each bubble bursts.
   for(let i=0;i<11;i++){
    const x=37+i*23,y=43+(i*19)%55;
    c.beginPath();
    c.ellipse(x+Math.sin(time*.9+i)*2,y,9+i%4*3,1+i%3*.7,0,.15,Math.PI*.88);
    c.strokeStyle='rgba('+reflection+','+(.10+i%3*.07)+')';
    c.lineWidth=.8;
    c.stroke();
   }
   for(const bubble of engine.state.bubbles){
    const {x,y,radius,cycle,phase}=bubble;
    const age=(time/cycle+phase)%1;
    if(age>.79){
     const burst=(age-.79)/.21;
     c.beginPath();
     c.ellipse(x,y,radius*(1+burst*2.4),radius*(.32+burst*.9),0,0,Math.PI*2);
     c.lineWidth=.9;
     c.strokeStyle='rgba('+reflection+','+(.42*(1-burst))+')';
     c.stroke();
    }else if(age>.30){
     const size=radius*(age-.30)/.49;
     c.beginPath();
     c.ellipse(x,y-size*.40,size,size*.68,0,0,Math.PI*2);
     c.fillStyle='#080d0e';
     c.fill();
     c.beginPath();
     c.ellipse(x,y-size*.40,size*.82,size*.59,0,Math.PI*1.04,Math.PI*1.75);
     c.strokeStyle='rgba('+reflection+',.67)';
     c.lineWidth=.85;
     c.stroke();
    }
   }
   c.restore();

   tarProps(c,night,engine.caseRecovered);
   for(const {angle,offset,size} of engine.state.rocks){
    const x=150+Math.cos(angle)*(140+offset);
    const y=68+Math.sin(angle)*(35+offset*.5);
    tarShape(c,[[x-size,y],[x-size*.25,y-size*.67],[x+size*.59,y-size*.48],[x+size,y],[x+size*.36,y+size*.45]],night?'#101513':'#242521');
    strokePath(c,[[x-size,y],[x-size*.25,y-size*.67],[x+size*.59,y-size*.48]],night?'#393930':'#625746',.85);
   }
   for(const [x,y,sway] of [[18,74,-1],[36,96,-1],[78,108,1],[211,105,-1],[262,88,1],[289,70,1],[274,44,-1]]){
    const stem=night?'#484536':'#756144';
    strokePath(c,[[x-3,y],[x-4+sway*2,y-11],[x-4+sway*7,y-17]],stem,1);
    strokePath(c,[[x,y],[x+sway*2,y-12],[x+sway*8,y-24]],stem,1.3);
    strokePath(c,[[x+sway*2,y-12],[x-sway*4,y-18]],stem,1);
    strokePath(c,[[x+3,y],[x+8,y-9],[x+12,y-13]],stem,1);
   }

   if(!engine.reduced){
    for(const {x,phase,cycle} of engine.state.wisps){
     const age=(time/cycle+phase)%1;
     if(age>.42)continue;
     const rise=age/.42;
     const drift=x+rise*24;
     const y=47-rise*47;
     const vapor=c.createRadialGradient(drift,y,0,drift,y,11+rise*10);
     vapor.addColorStop(0,'rgba('+reflection+','+(.20*Math.sin(rise*Math.PI))+')');
     vapor.addColorStop(1,'rgba('+reflection+',0)');
     c.fillStyle=vapor;
     c.fillRect(drift-22,y-22,44,44);
    }
   }
   c.restore();
  }
 });

 const descriptors=[{title:'THE RED RAIN',effect:'rain'},{title:'THE LIME FOG',effect:'fog'},{title:'THE BLACK SNOW',effect:'ash'},{title:'THE GLASS FIELD',effect:'glass'},
  {id:'early:186',title:'LIVE WIRES — ELECTRICAL HAZARD',effect:'wires'},
  {id:'east:7',title:'THE FURNACE PIT',effect:'furnace'},
  {id:'east:31',title:'THE TAR POOL',effect:'tar',region:'LOWLANDS'}];
 function records(){return descriptors.map(d=>({...d,entry:RoadScenarioRegistry.entries.find(r=>d.id?r.id===d.id:r.encounter.title===d.title)})).filter(d=>d.entry);}
 function liveEffect(){if(stage!=='encounter'||combatState||!GraphicalUI.active()||TravelerPanels.dialog||Route127MapOverlay.dialog?.open||previewDialog)return null;const current=currentEncounter();return records().find(d=>d.entry.encounter===current)||null;}
 let live=null,previewDialog=null;
 function update(){const spec=liveEffect(),root=GraphicalUI.element?.frame,figure=GraphicalUI.element?.figure;if(!spec||!root||!figure||root.hidden){live?.stop();live=null;return;}
  if(live&&(live.effect!==spec.effect||live.root!==root)){live.stop();live=null;}
  const period=Route127RegionalSky.phase(player.flags.worldHour);
  const wires=spec.effect==='wires';
  const region=spec.region||(wires||spec.effect==='furnace'?'INDUSTRIAL':spec.effect==='glass'?route127CurrentRegion(lanternState()):'CENTRAL');
  if(live&&live.region!==region){live.stop();live=null;}
  // Read the current visit's gameplay flag without initializing or modifying it.
  const visit=player.flags.wo7Scene;
  const powerActive=!wires||visit?.key!==RoadLifecycle.occurrence()+'|I6'||visit.safe!==true;
  if(!live)live=new EnvironmentalEffects(root,figure,{effect:spec.effect,period,region,powerActive,buttonDroplets:spec.effect==='rain',buttonLimit:4});else if(live.period!==period){live.clearBeads();live.clearSoot();live.period=period;if(spec.effect==='tar'&&live.reduced)live.draw(0);}
  if(spec.effect==='tar'){
   const recovered=player.flags.r18TarCase===true;
   if(live.caseRecovered!==recovered){live.caseRecovered=recovered;live.draw(0);}
  }
  if(wires)live.setPowerActive(powerActive);
 }
 function preview(){if(previewDialog?.open)return;live?.stop();live=null;
  const dialog=document.createElement('dialog');previewDialog=dialog;dialog.className='r127-env-preview';dialog.setAttribute('aria-label','Environmental effects preview');
  const title=document.createElement('h2');title.textContent='ENVIRONMENTAL EFFECTS';const controls=document.createElement('div');controls.className='r127-env-controls';dialog.append(title,controls);
  const select=(label,items)=>{const wrap=document.createElement('label');wrap.textContent=label;const s=document.createElement('select');s.setAttribute('aria-label',label);for(const [value,text]of items){const o=document.createElement('option');o.value=value;o.textContent=text;s.append(o);}wrap.append(s);controls.append(wrap);return s;};
  const available=records(),encounter=select('Environmental encounter',available.map(d=>[d.effect,d.title]));
  const region=select('Weather preview region',Object.entries(Route127RegionalSky.regions).map(([key,row])=>[key,row[2]]));
  const period=select('Weather time of day',['dawn','day','dusk','night'].map(p=>[p,p.toUpperCase()]));
  const layout=select('Preview layout',[['desktop','Full width'],['phone','Phone width (390px)']]);
  const power=select('Live Wires power',[['active','POWER ACTIVE'],['off','POWER DISCONNECTED']]);
  const wetWrap=document.createElement('label'),wet=document.createElement('input');wet.type='checkbox';wet.checked=true;wet.setAttribute('aria-label','Button Droplets');wetWrap.append(wet,document.createTextNode('Button Droplets: ON'));controls.append(wetWrap);
  const stage=document.createElement('section');stage.className='r127-env-stage';const figure=document.createElement('figure');figure.className='r127-sky-preview-art';const img=document.createElement('img');img.alt='Environmental region background';figure.append(img);const choices=document.createElement('div');choices.className='r127-env-choices';stage.append(figure,choices);
  const status=document.createElement('p');status.setAttribute('role','status');status.textContent='Preview only — no gameplay or saved progress changes.';
  let controller=null,revision=0,closed=false,mode='playing';
  function start(){controller?.stop();controller=new EnvironmentalEffects(stage,figure,{effect:encounter.value,period:period.value,region:encounter.value==='wires'?'INDUSTRIAL':region.value,powerActive:power.value==='active',buttonDroplets:wet.checked,buttonLimit:4});if(mode==='paused')controller.pause();if(mode==='stopped'){controller.stop();controller=null;}}
  power.addEventListener('change',()=>controller?.setPowerActive(power.value==='active'));
  wet.addEventListener('change',()=>{controller?.setButtonDroplets(wet.checked,4);wetWrap.lastChild.textContent='Button Droplets: '+(wet.checked?'ON':'OFF');});
  layout.addEventListener('change',()=>{stage.classList.toggle('r127-env-phone',layout.value==='phone');controller?.resize();});
  async function render(){const version=++revision,spec=available.find(d=>d.effect===encounter.value);controller?.stop();controller=null;wetWrap.hidden=encounter.value!=='rain';region.parentElement.hidden=encounter.value==='wires';power.parentElement.hidden=encounter.value!=='wires';choices.replaceChildren();
   const labels=spec.effect==='wires'?WO7.definitions.get(spec.entry.encounter.wo7)[5]:spec.entry.encounter.choices.split(/\s{2,}/).filter(Boolean);
   for(const label of labels){const b=GraphicalUI.button(label,()=>{status.textContent=label+' — visual interaction only; no outcome executed.';},'gfx-choice');choices.append(b);}
   const scene=Route127RegionalSky.describe(encounter.value==='wires'?'INDUSTRIAL':region.value,{dawn:6,day:12,dusk:18,night:22}[period.value]),base=new URL('../../assets/regions/',document.currentScript?.src||new URL('../devtest/runtime/environmental_effects_wo46.js',document.baseURI));
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
  for(const s of [region,period])s.addEventListener('change',render);
  encounter.addEventListener('change',()=>{if(encounter.value==='furnace')region.value='INDUSTRIAL';if(encounter.value==='tar')region.value='LOWLANDS';render();});
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
