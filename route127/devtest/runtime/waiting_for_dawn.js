/* DEVTEST presentation only. Uses the existing persisted refill clock and local community adapter. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const choices=[['Wasteland News','dawn news'],['Community Discussions','dawn discussions'],
  ['Workshop Feedback','dawn feedback'],['Log Out','dawn logout']];
 const waiting=()=>stage==='zeroTurns'&&player.turns<=0&&!testMode;
 let renderingWaiting=false,clock=null;
 const rows=()=>choices.map(([label,command],i)=>({key:String(i+1),label,command}));
 function bindings(){numberedChoices=Object.fromEntries(rows().map(row=>[row.key,row.command]));currentHotkeys={};}
 function paint(){
  const e=GraphicalUI.element,active=waiting()&&e&&!e.frame.hidden&&!e.figure.hidden;
  e?.frame.classList.toggle('r127-waiting-for-dawn',waiting());
  if(!active){clock?.remove();clock=null;return;}
  if(!clock){
   clock=document.createElement('section');clock.className='r127-dawn-clock';clock.setAttribute('aria-label','Waiting for Dawn');
   const title=document.createElement('h2');title.textContent='WAITING FOR DAWN';
   const time=document.createElement('time');time.className='r127-dawn-time';time.setAttribute('aria-label','Time until next turn refill');
   const label=document.createElement('p');label.textContent='UNTIL NEXT TURN REFILL';clock.append(title,time,label);
  }
  if(clock.parentNode!==e.figure)e.figure.append(clock);
  const time=clock.children[1];time.textContent=refillText();
  time.dateTime='PT'+Math.max(0,Math.ceil((Number(player.flags.nextRefillAt)-Date.now())/1000))+'S';
 }
 const previousChoices=GraphicalUI.choices;
 GraphicalUI.choices=function(...args){return waiting()||renderingWaiting?rows():previousChoices.apply(this,args);};
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const suspended=waiting(),savedStage=stage;
  // Open sidebar panels against the real waiting stage, never the temporary scene stage.
  if(suspended&&!TravelerPanels.dialog&&(this.optionsOpen||this.navOpen)){
   const which=this.optionsOpen?'options':'menu';this.optionsOpen=false;this.navOpen=false;
   TravelerPanels.open(which);paint();return;
  }
  // Render the existing suspended location through its usual renderer. No image rules change.
  // This synchronous scope also preserves encounter layers when the saved stage is zeroTurns.
  if(suspended){renderingWaiting=true;stage=player.flags.turnResumeStage||'between';}
  let result;
  try{result=previousSync.apply(this,args);}
  finally{if(suspended){stage=savedStage;renderingWaiting=false;}}
  paint();return result;
 };
 const previousNoTurns=noTurnsMenu;
 noTurnsMenu=function(...args){
  processRefill();
  if(testMode||player.turns>0)return previousNoTurns.apply(this,args);
  player.flags.turnResumeStage=['zeroTurns','overnightConfirm'].includes(stage)?(player.flags.turnResumeStage||'between'):stage;
  stage='zeroTurns';
  addImmediate('WAITING FOR DAWN','place');
  addImmediate('Your expedition turns are spent. Read the news, visit the community, or send feedback while you wait.','system');
  r5DirectChoices(choices.map(([label])=>label));bindings();
  v49Autosave();GraphicalUI.sync();
 };
 const previousRender=renderCurrentChoices;
 renderCurrentChoices=function(...args){
  if(waiting()){r5DirectChoices(choices.map(([label])=>label));bindings();return;}
  return previousRender.apply(this,args);
 };
 async function action(command){
  if(!waiting()||busy)return false;
  if(command==='dawn news')Route127Community.news();
  else if(command==='dawn discussions')Route127Community.discussions();
  else if(command==='dawn feedback')Route127Community.feedback();
  else if(command==='dawn logout'){
   // Same save/title path as the existing Save and Return action; never reset the character.
   if(!saveGame())return false;
   Route127Community.close();v49ReturnToTitle();GraphicalUI.sync();
  }else return false;
  return true;
 }
 const previousDispatch=GraphicalUI.dispatch;
 GraphicalUI.dispatch=function(choice){
  if(waiting()&&choices.some(([,command])=>command===choice?.command))return action(choice.command);
  return previousDispatch.apply(this,arguments);
 };
 const previousCommand=handleCommand;
 handleCommand=async function(raw,...args){
  if(waiting()&&!TravelerPanels.dialog){
   const value=String(raw).trim().toLowerCase();
   const row=rows().find(row=>row.key===value||row.command===value||row.label.toLowerCase()===value);
   if(row)return action(row.command);
  }
  const result=await previousCommand.call(this,raw,...args);
  // Enter at the end of a completed action, never halfway through its final paid encounter.
  const idle=['lanternNode','lanternRoad','roadReady','between','turnComplete','questRoadComplete','mercy','settlement','eastEnd','seaport'];
  if(!testMode&&player.turns<=0&&player.flags.interfaceUnlocked&&!busy&&!combatState&&
    !lanternState()?.pending&&idle.includes(stage))noTurnsMenu();
  return result;
 };
 const previousRefillDisplay=updateRefillDisplay;
 updateRefillDisplay=function(...args){
  // Close a suspended sidebar panel before the original refill restores its underlying stage.
  if(player.turns<=0&&Date.now()>=Number(player.flags?.nextRefillAt)&&TravelerPanels.snapshot?.stage==='zeroTurns')TravelerPanels.close();
  const wasWaiting=waiting();
  const result=previousRefillDisplay.apply(this,args);
  if(wasWaiting&&player.turns>0){renderCurrentChoices();v49Autosave();GraphicalUI.sync();}
  paint();Route127Community.refreshPermissions();return result;
 };
 for(const event of ['focus','pageshow'])addEventListener(event,()=>updateRefillDisplay());
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateRefillDisplay();});
})();
