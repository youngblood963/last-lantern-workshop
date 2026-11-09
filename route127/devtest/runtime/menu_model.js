/* DEVTEST menu publication. The engine still assigns keys and handles commands. */
const DevtestMenuModel=(()=>{
 let publication;
 function normalize(screenId,definitions,commandFor=choiceCommand){
  const seen=new Set(), actions=[];
  let exit;
  for(const [id,label,visible=true,destination] of definitions){
   if(!visible)continue;
   const command=commandFor(label);
   if(seen.has(command))continue;
   seen.add(command);
   const action={id:screenId+':'+id,label,command,destination};
   if(destination){
    if(exit)throw new Error('Multiple exits for '+screenId);
    exit=action;
   }else actions.push(action);
  }
  if(exit)actions.push(exit);
  return actions;
 }
 function publish(screenId,definitions,{explicitBindings=false}={}){
  const actions=normalize(screenId,definitions);
  currentHotkeys={};numberedChoices={};usedHotkeys=new Set();
  const labels=actions.map(action=>action.label).join('   ');
  add(explicitBindings?hotkeyLine(labels):labels,'system');
  remember(actions);
 }
 function remember(actions,{direct=false}={}){
  const bindings=new Map();
  let index=0;
  for(const action of actions){
   const key=!direct&&/^\(B\)\s+BACK$/i.test(action.label)?'b':String(++index);
   const command=(key==='b'?currentHotkeys:numberedChoices)[key];
   if(command)bindings.set(key,{...action,command});
  }
  publication={stage,location:mercyLocation,numbered:numberedChoices,hotkeys:currentHotkeys,bindings,hideImplicitBack:direct&&actions.some(action=>action.destination)};
 }
 function project(rows){
  if(!publication||publication.stage!==stage||publication.location!==mercyLocation||
     publication.numbered!==numberedChoices||publication.hotkeys!==currentHotkeys)return rows;
  return rows.filter(row=>!publication.hideImplicitBack||row.key!=='b'||publication.bindings.has('b')).map(row=>{
   const action=publication.bindings.get(row.key);
   return action?.command===row.command?{...row,id:action.id,label:action.label.replace(/^\([A-Z]\)\s*/,'')}:row;
  });
 }
 function publishLabels(screenId,labels,navigation){
  publish(screenId,labels.map(label=>[
   choiceCommand(label),label,true,label===navigation?choiceCommand(label):undefined
  ]),{explicitBindings:true});
 }
 // Existing queued writers retain their numbering, display formatting and aliases.
 function publishQueued(screenId,labels,navigation,write,{direct=false}={}){
  const commandFor=direct?label=>label.toLowerCase():choiceCommand;
  const actions=normalize(screenId,labels.map(label=>[
   commandFor(label),label,true,label===navigation?commandFor(label):undefined
  ]),commandFor);
  const context={stage,location:mercyLocation};
  write(actions.map(action=>action.label));
  outputQueue=outputQueue.then(()=>{
   if(stage===context.stage&&mercyLocation===context.location)remember(actions,{direct});
  });
 }
 return Object.freeze({publish,publishLabels,publishQueued,project});
})();
