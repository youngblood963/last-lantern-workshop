/* DEVTEST finale. Use the game's terminal transcript, numbered choices, and saves. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='PLAYTEST')return;

 const preview=globalThis.ROUTE127_ENV.terminalPreview;
 const backRoom='port55TomorrowBackRoom';
 const terminal='port55TomorrowTerminal';
 const completion='port55TomorrowComplete';
 const networkAction='CONTACT TOMORROW PROJECT';
 const oldAction='tomorrow project terminal';
 const assets='../devtest/assets/';
 const art={
  room:assets+'locations/rusty_anchor_backroom.png',
  off:assets+'locations/rusty_anchor_computer_off.png',
  activation:assets+'locations/rusty_anchor_computer_on.gif?v=single-cycle-1',
  on:assets+'locations/rusty_anchor_computer_powered.png',
  hub:assets+'tomorrow_project/backgrounds/communication_hub.png'
 };
 const liberated=()=>player.flags.seaport55?.freed===true;
 const lights=()=>player.flags.r11Quests?.lights;
 const roomUnlocked=()=>liberated()&&['active','ready','done'].includes(lights());
 const repaired=()=>liberated()&&lights()==='done';
 const completed=()=>['yes','no'].includes(player.flags.tomorrowProjectChoice);
 const questions=[
  'WHY HAVE YOU BEEN SENDING ME ALL OVER THE WASTELAND?',
  'WHO ARE YOU?',
  'WHO IS THE NEW DOMINION?',
  'WHAT CAUSED THE FALL?',
  'HOW ARE YOU STILL SO YOUNG?',
  'WHY SHOULD I HELP YOU?',
  "WHAT'S NEXT?"
 ];
 const main='MAIN QUESTION MENU';
 const greed='WHAT DO YOU MEAN, GREED?';
 let startup=false;
 let activating=false;
 let terminalOrigin=backRoom;

 function write(lines){
  for(const line of lines)add(line,'bright');
 }
 function choices(labels){
  r5DirectChoices(labels);
  // The explicit menu action handles Back in both display modes.
  delete currentHotkeys.b;
 }
 function room(){
  stage=backRoom;
  add('SEAPORT — THE RUSTY ANCHOR BACK ROOM','place');
  choices(repaired()?['USE COMPUTER','EXAMINE COMPUTER','LEAVE BACK ROOM']:
   ['EXAMINE COMPUTER','FIX COMPUTER','LEAVE BACK ROOM']);
 }
 function menu(){
  stage=terminal;
  add('TOMORROW PROJECT // LIVE CONNECTION','place');
  choices([...questions,'DISCONNECT']);
 }
 function leaveTerminal(){
  stopAmbient();
  if(preview){resetConversation();return menu();}
  if(terminalOrigin==='factoryTerminal')return v49Terminal();
  room();
 }
 async function connect(){
  terminalOrigin=backRoom;
  stage=terminal;
  if(player.flags.tomorrowProjectConnected)return menu();
  startup=true;
  busy=true;
  input.disabled=true;
  numberedChoices={};
  currentHotkeys={};
  try{
   await outputQueue;
   GraphicalUI.sync();
   const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   await typeLine('INITIALIZING COMMUNICATIONS...','system',reducedMotion?0:19);
   await typeLine('SEARCHING FOR NETWORK...','system',reducedMotion?0:19);
   await typeLine('[STATIC]','system',reducedMotion?0:19);
   await typeLine('SIGNAL DETECTED','system',reducedMotion?0:19);
   await typeLine('TOMORROW PROJECT','system',reducedMotion?0:19);
   await typeLine('CONNECTION ESTABLISHED','system',reducedMotion?0:19);
   startup=false;
   GraphicalUI.sync();
   write([
    "SYN > Well, well. Look who's still alive.",
    'LUNA > Syn! We have a connection!',
    'SYN > I can see that, Luna.',
    'LUNA > You could try sounding happy.',
    'SYN > Welcome back, survivor.'
   ]);
   menu();
   await outputQueue;
   player.flags.tomorrowProjectConnected=true;
   v49Autosave();
  }finally{
   startup=false;
   busy=false;
   input.disabled=false;
   GraphicalUI.sync();
  }
 }
 const answers0=[
  "SYN > We're a small resistance called the Tomorrow Project.",
  "SYN > We're trying to unite the towns and bring some kind of unity back to the wasteland."
 ];
 const answers1=[
  "SYN > My name's Syn. I run this merry band.",
  "LUNA > And I'm Luna. The one who keeps this merry band functioning."
 ];
 const answers2=[
  "[Brief pause.]",
  "LUNA > Syn, the Dominion could be listening.",
  "SYN > That's a talk for another day."
 ];
 const answers3=[
  "SYN > Same story, different century.",
  "SYN > War, aliens, zombie plagues. All the stuff of fiction.",
  "SYN > In the end, it always comes back to the same thing.",
  "SYN > One word.",
  "SYN > Greed."
 ];
 const answers4=[
  "PLAYER > But the fall happened decades ago.",
  "PLAYER > You should have died a long time ago.",
  "[Brief silence.]",
  "SYN > That's a story for another day.",
  "LUNA > He's particularly fond of that answer."
 ];
 const answers5=[
  "SYN > Because if we don't stop the New Dominion, they'll take over.",
  "SYN > And everything we're trying to rebuild will go right back to the way things were before the fall.",
  "LUNA > Believe me. Nobody wants to go through that again.",
  "LUNA > Syn, you need to save your energy.",
  "SYN > I'm fine, Luna.",
  "LUNA > You always say that."
 ];
 const history=[
  "LUNA > Oh, good lord. Don't get him started.",
  "SYN > There's an old saying. A man who has everything will still find something to take.",
  "SYN > It didn't happen overnight. It never does.",
  "SYN > Corporations kept raising prices. Food, housing, medicine, electricity. Everything people needed to survive became another opportunity to squeeze a few more dollars out of them.",
  "SYN > People worked longer hours. Two jobs. Three jobs. Families barely saw each other anymore.",
  "SYN > And somehow, no matter how hard they worked, they kept falling further behind.",
  "SYN > The wealthy accumulated more than they could ever spend.",
  "SYN > The politicians promised change.",
  "SYN > Nothing changed.",
  "SYN > Eventually, people stopped believing in the system.",
  "SYN > Protests turned into riots. Riots became rebellions.",
  "SYN > The government responded with force.",
  "SYN > Then came the wars.",
  "SYN > By the time the government collapsed, civilization had already been tearing itself apart for years.",
  "LUNA > And that concludes today's history lesson."
 ];
 const invitation=[
  "SYN > I need your help connecting the other cities.",
  "SYN > We've made progress, but there's a whole wasteland out there.",
  "SYN > Are you willing to help?"
 ];
 const yesReply=[
  "SYN > Good. We've got a lot of work ahead of us.",
  "LUNA > Welcome to the Tomorrow Project."
 ];
 const noReply=[
  "SYN > Then the New Dominion will eventually rule everything.",
  "SYN > And history will repeat itself.",
  "LUNA > Well... the offer stands."
 ];
 const answers=[answers0,answers1,answers2,answers3,answers4,answers5];
 let pendingAnswer=false;
 let historyAvailable=false;
 function resetConversation(){
  pendingAnswer=false;
  historyAvailable=false;
 }

 function finish(cmd){
  write(cmd==='yes'?yesReply:noReply);
  if(preview||completed())return menu();
  player.flags.tomorrowProjectChoice=cmd;
  player.flags.chapterOneComplete=true;
  stage=completion;
  v49Autosave();
  add('ROUTE 127','place');
  add('DEMO COMPLETE','reward');
  write([
   'Thank you for playing Route 127!',
   "Your journey doesn't have to end here.",
   'Continue exploring the wasteland, completing quests, recruiting survivors, and strengthening your character.',
   'More towns, new adventures, and the next chapter of the Tomorrow Project are coming.'
  ]);
  choices(['CONTINUE EXPLORING']);
 }

 const originalLoad=loadGame;
 loadGame=function(...args){activating=false;return originalLoad.apply(this,args);};

 const originalSaveStage=gameplayStageForSave;
 gameplayStageForSave=function(){
  const saved=originalSaveStage();
  if(saved===completion)return 'seaport';
  if(saved===terminal)return terminalOrigin;
  return saved;
 };

 const originalCore=handleCommandCore;
 handleCommandCore=async function(raw){
  if(busy)return originalCore.apply(this,arguments);
  const cmd=r5Mapped(raw);
  if(preview&&stage!==terminal)return menu();
  if(stage==='port55Mia'&&cmd==='enter back room'&&roomUnlocked()&&
     (Number(day)||1)>=(Number(player.flags.r18MiaBarredUntil)||0))return room();
  if(stage==='factoryTerminal'&&cmd===networkAction.toLowerCase()&&completed()){
   resetConversation();
   terminalOrigin='factoryTerminal';
   return menu();
  }
  if(stage===completion&&['continue exploring','back','b'].includes(cmd)){
   stage='seaport';
   return port55Menu();
  }
  const globalShortcut=/^(?:save|load|inventory|inv|i|status|stats|s|quests?|q|map|m|v|testing|test off)(?:\s|$)/;
  if(preview||!globalShortcut.test(cmd)){
   if(stage===backRoom){
    if(!roomUnlocked()||['back','b','return to bar','leave back room'].includes(cmd))return port55MiaMenu();
    if(['use computer','access terminal'].includes(cmd)&&repaired()){resetConversation();return connect();}
    if(cmd==='fix computer'&&!repaired()){
     if(lights()==='ready'&&r11HasCommunicationsModule())return r11QuestComplete('lights',()=>{activating=true;room();});
     add('The computer needs the Pre-War Communications Interface Module from Forge at the Factory.','system');
    }
    if(['examine computer','examine terminal'].includes(cmd)&&repaired())
     add('The computer is running. The communications link is ready.','bright');
    if(['examine computer','examine terminal'].includes(cmd)&&!repaired()){
     write([
      'An old communications terminal sits against the wall.',
      'Decades of dust cover its controls. The monitor is dark.',
      'Without replacement components, the equipment is useless.'
     ]);
    }
    return room();
   }
   if(stage===terminal){
    if(['disconnect','back','b'].includes(cmd))return leaveTerminal();
    if(cmd===greed.toLowerCase()&&historyAvailable){
     resetConversation();
     playAmbient();
     write(history);
     return choices([main]);
    }
    if(pendingAnswer&&['yes','no'].includes(cmd)){
     resetConversation();
     return finish(cmd);
    }
    const question=questions.findIndex(label=>label.toLowerCase()===cmd);
    resetConversation();
    if(question===6){
     playAmbient();
     pendingAnswer=true;
     write(invitation);
     return choices(['YES','NO',main]);
    }
    if(question>=0){
     playAmbient();
     write(answers[question]);
     historyAvailable=question===3;
     return choices(historyAvailable?[greed,main]:[main]);
    }
    return menu();
   }
  }
  return originalCore.apply(this,arguments);
 };

 const originalRender=renderCurrentChoices;
 renderCurrentChoices=function(){
  if(stage===backRoom)return roomUnlocked()?room():port55MiaMenu();
  if(stage===terminal){resetConversation();return menu();}
  if(stage===completion)return choices(['CONTINUE EXPLORING']);
  return originalRender.apply(this,arguments);
 };

 const originalStaffChoices=portStaffChoices;
 portStaffChoices=function(title,labels){
  return originalStaffChoices.call(this,title,
   labels.filter(label=>label.toLowerCase()!==oldAction));
 };
 const originalRecruitCommand=portRecruitCommand;
 portRecruitCommand=function(cmd){
  if(stage==='port55Service'&&cmd===oldAction){
   portStaffRender();
   return true;
  }
  return originalRecruitCommand.apply(this,arguments);
 };

 // Keep the Factory terminal's local records and exit numbering.
 const originalQueueChoiceLine=queueChoiceLine;
 queueChoiceLine=function(labels){
  if(stage==='factoryTerminal'&&completed()&&labels.startsWith('PROJECT RECORDS   ')){
   labels+='   '+networkAction;
  }
  return originalQueueChoiceLine.call(this,labels);
 };

 function finaleObjective(){
  if(completed())return 'Demo complete. Continue exploring or contact the Tomorrow Project.';
   if(repaired())return 'Access the terminal in the Rusty Anchor back room.';
  if(lights()==='ready')return 'Use FIX COMPUTER in the Rusty Anchor back room to install the communications module.';
  if(lights()==='active')return 'Buy the Pre-War Communications Interface Module from Forge at the Factory.';
  return 'Find Sheriff Kaiden on Town Streets and ask about Keeping the Lights On under Small Talk.';
 }
 const originalQuestObjective=portQuestObjective;
 portQuestObjective=function(){
  return liberated()?finaleObjective():originalQuestObjective.apply(this,arguments);
 };
 const originalPortObjective=port55Objective;
 port55Objective=function(){
  return liberated()?finaleObjective():originalPortObjective.apply(this,arguments);
 };

 // The Workshop and live terminal use the same scene and animation player.
 const shell=document.querySelector('.terminal-shell');
 const layout=shell.querySelector('.game-layout');
 const scene=TomorrowProjectScene.create();
 const {visual}=scene;
 let wasConnected=false;
 layout.before(visual);
 function stopAmbient(){scene.stop();}
 function playAmbient(){
  if(!startup&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches)scene.roll();
 }

 const originalModel=GraphicalUI.model;
 GraphicalUI.model=function(){
  const model=originalModel.apply(this,arguments);
  if(stage===backRoom||stage===terminal||stage===completion){
   model.layout='dialogue';
   model.title=stage===backRoom?'The Rusty Anchor — Back Room':
    stage===completion?'Route 127 — Demo Complete':
    startup?'Tomorrow Project — Acquiring Signal':'Tomorrow Project — Headquarters Live Feed';
   const path=stage===backRoom?art.room:stage===terminal&&!startup?art.hub:'';
   model.art=path&&this.sceneArtworkReady(path)?path:'';
  }
  return model;
 };
 const originalSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){
  const result=originalSync.apply(this,arguments);
  const roomView=stage===backRoom;
  const connectedView=stage===terminal&&!startup;
  if(!connectedView)stopAmbient();
  if(!roomView)activating=false;
  if(connectedView&&!wasConnected)scene.configure(preview?TomorrowProjectScene.approved():TomorrowProjectScene.load());
  wasConnected=connectedView;
  const frame=this.element?.frame;
  shell.classList.toggle('tomorrow-terminal',stage===terminal);
  shell.classList.toggle('tomorrow-startup',stage===terminal&&startup);
  frame?.classList.toggle('tomorrow-scene',roomView||stage===terminal||stage===completion);
  const figure=this.active()?this.element?.figure:null;
  if(figure&&visual.parentNode!==figure)figure.append(visual);
  else if(!figure&&visual.parentNode!==layout.parentNode)layout.before(visual);
  visual.classList.toggle('tomorrow-overlay',!!figure);
  scene.view(connectedView?'hub':roomView?'room':'',
   roomView?art.room:'',roomView?(repaired()?(activating?art.activation:art.on):art.off):'');
  // Play the existing Workshop signal flicker once when the feed connects.
  visual.classList.toggle('tomorrow-signal-in',connectedView);
  return result;
 };
 if(preview){
  GraphicalUI.eligible=()=>true;
  GraphicalUI.preference=()=> 'graphics';
  GraphicalUI.nav=()=>[];
  addEventListener('DOMContentLoaded',()=>{
   const tools=document.createElement('section');
   tools.setAttribute('aria-label','Terminal preview controls');
   const back=document.createElement('a');
   back.href='../devtest/lunas-workshop.html';back.textContent='Return to Luna’s Workshop';
   const select=document.createElement('select');
   select.setAttribute('aria-label','Sequence to preview');
   for(const [id,[name]] of Object.entries(TomorrowProjectScene.sequences)){
    const option=document.createElement('option');
    option.value=id;option.textContent=name;select.append(option);
   }
   const play=document.createElement('button');
   play.type='button';play.textContent='Play sequence';
   play.addEventListener('click',()=>scene.start(select.value));
   tools.append(back,' ',select,' ',play);
   shell.prepend(tools);
   menu();
   GraphicalUI.schedule();
  },{once:true});
 }
})();
