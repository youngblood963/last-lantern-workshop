(()=>{
 'use strict';
 const api=TomorrowProjectScene;
 const get=id=>document.getElementById(id);
 const viewport=get('viewport');
 const scene=api.create();
 const status=message=>{get('status').textContent=message;};
 let config=api.load(),lastPreview=null,drag=null;
 viewport.append(scene.visual);
 scene.view('hub');

 get('device').addEventListener('change',event=>{viewport.dataset.device=event.target.value;});
 get('signal').addEventListener('click',()=>{
  viewport.classList.remove('tomorrow-startup');
  void viewport.offsetWidth;
  viewport.classList.add('tomorrow-startup');
 });
 function options(select,items){
  for(const [value,label] of items){
   const option=document.createElement('option');
   option.value=value;option.textContent=label;select.append(option);
  }
 }
 options(get('clip'),Object.entries(api.clips).map(([id,clip])=>[id,clip[2]]));
 options(get('sequence'),Object.entries(api.sequences).map(([id,sequence])=>[id,sequence[0]]));
 function field(parent,label,values,key,{min,max,step=1,choices}={}){
  const wrap=document.createElement('label');
  wrap.textContent=label;
  const control=document.createElement(choices?'select':'input');
  if(choices)options(control,choices);
  else if(typeof values[key]==='boolean')control.type='checkbox';
  else Object.assign(control,{type:'number',min,max,step});
  if(control.type==='checkbox')control.checked=values[key];
  else control.value=values[key];
  const update=()=>{
   if(control.type==='number'&&(!control.validity.valid||control.value===''))return;
   values[key]=control.type==='checkbox'?control.checked:control.type==='number'?control.valueAsNumber:control.value;
   scene.configure(config);
  };
  control.addEventListener('input',update);
  control.addEventListener('change',update);
  wrap.append(control);parent.append(wrap);
  return control;
 }
 let positionControls={};
 function placement(){
  const root=get('placement'),peek=get('peek-layer'),id=get('actor').value;
  root.textContent='';peek.textContent='';
  const actor=config.actors[id];
  positionControls={
   x:field(root,'X (%)',actor,'x',{min:-150,max:250,step:.1}),
   y:field(root,'Y (%)',actor,'y',{min:-100,max:200,step:.1})
  };
  field(root,'Scale (%)',actor,'scale',{min:1,max:200,step:.1});
  field(root,'Layer',actor,'layer',{min:1,max:20});
  field(root,'Visible',actor,'visible');
  if(id==='flora')field(peek,'Flora peek layer',config,'peekLayer',{min:1,max:20});
 }
 function timeline(){
  const root=get('timeline'),id=get('sequence').value,p=config.paths[id],def=api.sequences[id];
  root.textContent='';
  if(def[3]){
   field(root,'Start X (%)',p,'fromX',{min:-150,max:250,step:.1});
   field(root,'End X (%)',p,'toX',{min:-150,max:250,step:.1});
   field(root,'Start Y offset (%)',p,'fromY',{min:-150,max:150,step:.1});
   field(root,'End Y offset (%)',p,'toY',{min:-150,max:150,step:.1});
   field(root,def[2]?'Enter / exit time each (ms)':'Movement time (ms)',p,'duration',{min:100,max:20000});
  }
  field(root,'Frame speed (×)',p,'speed',{min:.25,max:4,step:.05});
  if(def[2])field(root,'Pause (ms)',p,'pause',{min:0,max:10000});
  field(root,'Facing',p,'facing',{choices:[['auto','Auto'],['right','Right'],['left','Left']]});
  get('notes').textContent=def[2]?'The existing walk and action GIFs have different poses at the cut. The actor stays at the same scene position while the clips switch.':
   def[3]?'The source GIF has its own motion. The path moves the entire sprite independently.':'Peek motion is built into the GIF. Move the character to change where it appears.';
 }
 function rebuild(){
  scene.configure(config);placement();timeline();
  get('playback').textContent='';get('ambient').textContent='';
  field(get('playback'),'Clip speed (×)',config,'speed',{min:.25,max:4,step:.05});
  field(get('playback'),'Loop manually played previews',config,'loop');
  field(get('ambient'),'Animation chance (%)',config,'probability',{min:0,max:100});
  field(get('ambient'),'Cooldown (ms)',config,'cooldown',{min:0,max:20000});
 }
 get('actor').addEventListener('change',placement);
 get('sequence').addEventListener('change',timeline);
 const canvas=scene.composition;
 canvas.addEventListener('pointerdown',event=>{
  if(drag||event.button!==0)return;
  const id=get('actor').value;
  const actor=config.actors[id];
  if(!actor.visible)return;
  scene.stop();
  const rect=canvas.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  drag={id:event.pointerId,actor,rect,x:event.clientX,y:event.clientY,startX:actor.x,startY:actor.y};
  canvas.setPointerCapture(event.pointerId);
 });
 canvas.addEventListener('pointermove',event=>{
  if(drag?.id!==event.pointerId)return;
  const {actor,rect,x,y,startX,startY}=drag;
  actor.x=Math.max(-150,Math.min(250,Math.round((startX+100*(event.clientX-x)/rect.width)*10)/10));
  actor.y=Math.max(-100,Math.min(200,Math.round((startY+100*(event.clientY-y)/rect.height)*10)/10));
  positionControls.x.value=actor.x;positionControls.y.value=actor.y;
  scene.configure(config);
 });
 for(const event of ['pointerup','pointercancel','lostpointercapture']){
  canvas.addEventListener(event,e=>{if(drag?.id===e.pointerId)drag=null;});
 }
 function play(id,single){
  lastPreview={id,single};
  const name=single?api.clips[id][2]:api.sequences[id][0];
  const started=scene.start(id,{single,loop:config.loop,onEnd:status});
  status(started?'Playing '+name:'Character hidden');
 }
 const click=(id,fn)=>get(id).addEventListener('click',fn);
 click('play',()=>play(get('clip').value,true));
 click('restart',()=>{if(lastPreview)play(lastPreview.id,lastPreview.single);else play(get('clip').value,true);});
 click('sequence-play',()=>play(get('sequence').value,false));
 click('stop',()=>{scene.stop();status('Stopped');});
 for(const id of ['random','dialogue'])click(id,()=>status(scene.roll(status)));
 click('scene-reset',()=>{scene.reset();lastPreview=null;status('Scene reset to current layout');});
 click('save',()=>{
  try{api.save(config);status('Layout saved and applied to DEVTEST in this browser');}
  catch{status('Browser storage is unavailable. Export the layout to keep a copy.');}
 });
 function restore(settings,message){
  scene.reset();lastPreview=null;config=settings;rebuild();status(message);
 }
 click('load',()=>restore(api.load(),'Saved layout loaded'));
 click('defaults',()=>restore(api.normalize(),'Default layout loaded as a draft'));
 click('export',()=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(api.normalize(config),null,2)],{type:'application/json'}));
  const link=document.createElement('a');
  link.href=url;link.download='tomorrow-project-layout.json';
  document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 get('import').addEventListener('change',async event=>{
  const file=event.target.files[0];
  if(!file)return;
  try{
   const data=JSON.parse(await file.text());
   if(!data?.actors||!data?.paths)throw Error('Invalid layout');
   restore(api.normalize(data),'Imported as a draft. Select Save Layout to apply it.');
  }catch{status('Could not import this layout');}
  event.target.value='';
 });
 window.addEventListener('pagehide',()=>scene.stop());
 rebuild();
 Promise.all([scene.pose('luna','turn'),scene.pose('flora','floraPeek')]).then(()=>{
  if(get('status').textContent==='Loading scene…')status('Ready');
 }).catch(()=>status('A character preview could not load'));
})();
