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
 function field(parent,label,values,key,{min,max,step=1,choices,optional=false,onChange}={}){
  const wrap=document.createElement('label');
  wrap.textContent=label;
  const control=document.createElement(choices?'select':'input');
  if(choices)options(control,choices);
  else if(typeof values[key]==='boolean')control.type='checkbox';
  else Object.assign(control,{type:'number',min,max,step});
  if(optional)control.placeholder='Inherit';
  if(control.type==='checkbox')control.checked=values[key];
  else control.value=values[key]??'';
  const update=()=>{
   if(control.type==='number'&&(!control.validity.valid||(!optional&&control.value==='')))return;
   values[key]=control.type==='checkbox'?control.checked:control.type==='number'?(control.value===''?null:control.valueAsNumber):control.value;
   scene.configure(config);
   if(onChange&&control.type==='select-one')onChange();
  };
  if(!choices)control.addEventListener('input',update);
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
 function clipPlacement(){
  const root=get('clip-placement'),id=get('clip').value,clip=config.placements[id];
  root.textContent='';
  field(root,'Scale (%)',clip,'scale',{min:1,max:200,step:.1,optional:true});
  field(root,'X (%)',clip,'x',{min:-150,max:250,step:.1,optional:true});
  field(root,'Y (%)',clip,'y',{min:-100,max:200,step:.1,optional:true});
  field(root,'Layer',clip,'layer',{min:1,max:20,optional:true});
 }
 const facing=[['auto','Auto'],['right','Right'],['left','Left']];
 function timeline(){
  const root=get('timeline'),id=get('sequence').value,p=config.paths[id],def=api.sequences[id];
  const stages=config.timelines[id], list=get('stages');
  root.textContent='';list.textContent='';
  if(def[3]){
   field(root,'Start X (%)',p,'fromX',{min:-150,max:250,step:.1});
   field(root,'Waypoint X (%)',p,'toX',{min:-150,max:250,step:.1});
   field(root,'Start Y offset (%)',p,'fromY',{min:-150,max:150,step:.1});
   field(root,'Waypoint Y offset (%)',p,'toY',{min:-150,max:150,step:.1});
  }
  field(root,'Frame speed (×)',p,'speed',{min:.25,max:4,step:.05});
  const actor=api.clips[def[1]][0];
  const eligible=Object.entries(api.clips).filter(([,c])=>c[0]===actor).map(([key,c])=>[key,c[2]]);
  get('notes').textContent=def[3]?
   'Use Return to start to control the exit. If a sequence ends inside the frame, it adds a return automatically. Start offscreen or behind the desk.':
   'The peek motion is built into the GIF. Adjust its placement under Playback.';
  get('stage-add').disabled=stages.length>=16;
  function edit(apply){
   scene.stop();
   apply();
   scene.configure(config);
   timeline();
  }
  function button(parent,label,fn,disabled=false){
   const node=document.createElement('button');
   node.type='button';node.textContent=label;node.disabled=disabled;
   node.addEventListener('click',fn);parent.append(node);
  }
  stages.forEach((stage,index)=>{
   const row=document.createElement('li'),fields=document.createElement('div'),tools=document.createElement('div');
   fields.className='fields';tools.className='toolbar';
   const heading=document.createElement('strong');
   heading.textContent={move:'Move',play:'Play animation',pause:'Pause',hold:'Hold GIF Frame'}[stage.type];
   if(stage.type!=='pause'){
    field(fields,'Animation',stage,'clip',{choices:eligible});
    field(fields,'Facing',stage,'facing',{choices:facing});
   }
   if(stage.type==='move'){
    field(fields,'Destination',stage,'target',{choices:[
     ['waypoint','Waypoint'],['placement','Character anchor'],['origin','Return to start'],['custom','Custom position']
    ],onChange:timeline});
    if(stage.target==='custom'){
     field(fields,'X (%)',stage,'x',{min:-150,max:250,step:.1});
     field(fields,'Y (%)',stage,'y',{min:-100,max:200,step:.1});
    }
   }
   if(stage.type==='hold'){
    field(fields,'Frame',stage,'frame',{min:1,max:api.clipFrameCount});
    field(fields,'Hold (ms)',stage,'duration',{min:0,max:60000,step:10});
    const hint=document.createElement('p');
    hint.className='hint';hint.textContent='Plays this clip, holds the selected frame, then continues through the rest of the clip.';
    fields.append(hint);
   }else if(stage.type!=='play')field(fields,'Time (ms)',stage,'duration',stage.type==='move'?
    {min:100,max:20000}:{min:0,max:10000});
   const shift=delta=>edit(()=>{[stages[index],stages[index+delta]]=[stages[index+delta],stages[index]];});
   button(tools,'Preview Stage',()=>play(id,false,index));
   if(stage.type==='play')button(tools,'Hold a Frame',()=>edit(()=>{
    stages[index]=holdStage(stage.clip,stage.facing);
   }));
   button(tools,'Move Up',()=>shift(-1),index===0);
   button(tools,'Move Down',()=>shift(1),index===stages.length-1);
   button(tools,'Remove',()=>edit(()=>stages.splice(index,1)),stages.length===1);
   row.append(heading,fields,tools);list.append(row);
  });
 }
 function rebuild(){
  scene.configure(config);placement();clipPlacement();timeline();
  get('playback').textContent='';get('ambient').textContent='';
  field(get('playback'),'Clip speed (×)',config,'speed',{min:.25,max:4,step:.05});
  field(get('playback'),'Loop manually played previews',config,'loop');
  field(get('ambient'),'Animation chance (%)',config,'probability',{min:0,max:100});
  field(get('ambient'),'Cooldown (ms)',config,'cooldown',{min:0,max:20000});
 }
 get('actor').addEventListener('change',placement);
 get('sequence').addEventListener('change',timeline);
 get('clip').addEventListener('change',clipPlacement);
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
 function play(id,single,stageIndex){
  lastPreview={id,single,stageIndex};
  const name=single?api.clips[id][2]:api.sequences[id][0];
  const started=scene.start(id,{single,stageIndex,loop:stageIndex===undefined&&config.loop,onEnd:status});
  status(started?'Playing '+name+(stageIndex===undefined?'':' · Stage '+(stageIndex+1)):'Character hidden');
 }
 const click=(id,fn)=>get(id).addEventListener('click',fn);
 function holdStage(clip,facing='auto'){
  return {type:'hold',clip,frame:9,duration:4000,facing};
 }
 click('stage-add',()=>{
  const id=get('sequence').value,p=config.paths[id],def=api.sequences[id],type=get('stage-type').value;
  const clip=def[1],actor=api.clips[clip][0];
  const stages=config.timelines[id];
  if(stages.length>=16)return;
  scene.stop();
  if(type==='hold'){
   const existing=stages.length===1&&stages[0].type==='play'?stages[0]:null;
   const hold=holdStage(existing?.clip||def[2]||clip,existing?.facing);
   if(existing)stages[0]=hold;
   else stages.push(hold);
  }else stages.push(type==='pause'?{type,duration:300}:type==='play'?{type,clip,facing:'auto'}:
   {type,clip,target:'waypoint',x:p.toX,y:config.actors[actor].y,duration:p.duration,facing:'auto'});
  scene.configure(config);timeline();
 });
 click('play',()=>play(get('clip').value,true));
 click('restart',()=>{if(lastPreview)play(lastPreview.id,lastPreview.single,lastPreview.stageIndex);else play(get('clip').value,true);});
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
