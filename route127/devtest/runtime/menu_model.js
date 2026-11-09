/* DEVTEST menu publication. The engine still assigns keys and handles commands. */
const DevtestMenuModel=(()=>{
 let publication;
 function publish(screenId, definitions){
  const seen=new Set(), actions=[];
  let exit;
  for(const [id,label,visible=true,destination] of definitions){
   if(!visible)continue;
   const command=choiceCommand(label);
   if(seen.has(command))continue;
   seen.add(command);
   const action={id:screenId+':'+id,label,command,destination};
   if(destination){
    if(exit)throw new Error('Multiple exits for '+screenId);
    exit=action;
   }else actions.push(action);
  }
  if(exit)actions.push(exit);
  currentHotkeys={};numberedChoices={};usedHotkeys=new Set();
  add(actions.map(action=>action.label).join('   '),'system');
  publication={stage,location:mercyLocation,numbered:numberedChoices,hotkeys:currentHotkeys,actions};
 }
 function project(rows){
  if(!publication||publication.stage!==stage||publication.location!==mercyLocation||
     publication.numbered!==numberedChoices||publication.hotkeys!==currentHotkeys)return rows;
  return rows.map(row=>{
   const action=publication.actions.find(entry=>entry.command===row.command);
   return action?{...row,id:action.id,label:action.label.replace(/^\([A-Z]\)\s*/,'')}:row;
  });
 }
 return Object.freeze({publish,project});
})();
