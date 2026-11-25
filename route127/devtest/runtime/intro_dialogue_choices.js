/* DEVTEST only: inline, player-paced terminal introduction; unchanged save schema. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const opening=new Set(['hello','listen','savecoords']);
 const replies=[
  ["Hello? Who's there?",'Holy shit. Someone actually answered.'],
  ['Where the hell am I?',"Somewhere you don't want to stay."],
  ['Who are you people?',"We're trying to help. That's all you need to know right now."],
  ['What happened out there?',"How much time do you have? Because we don't have much."],
  ['Hola!',"Well, at least someone out there is friendly."]
 ];
 const shell=document.querySelector('.terminal-shell');
 let panel=null,lines=[],actions=[],page=0,displayedStage='';
 function sync(){const active=opening.has(stage);shell.classList.toggle('r127-terminal-intro',active);if(panel)panel.hidden=!active;}
 function paint(){
  if(!panel){panel=document.createElement('section');panel.className='r127-intro-dialogue';panel.setAttribute('aria-label','Terminal introduction');shell.querySelector('.game-layout').prepend(panel);}
  displayedStage=stage;panel.replaceChildren();
  const transcript=document.createElement('div');transcript.className='r127-intro-transcript';transcript.setAttribute('aria-live','polite');
  for(const [text,kind=''] of lines){const p=document.createElement('p');p.textContent=text;p.className=kind;transcript.appendChild(p);}
  const controls=document.createElement('div');controls.className='r127-intro-choices';controls.setAttribute('aria-label','Terminal dialogue responses');
  numberedChoices={};currentHotkeys={};usedHotkeys=new Set();
  actions.forEach(([label,command],i)=>{numberedChoices[String(i+1)]=command;const button=document.createElement('button');button.type='button';button.textContent=(actions.length>1?(i+1)+'. ':'')+label;button.addEventListener('click',()=>FocusedEntry.dispatch(command));controls.appendChild(button);});
  panel.append(transcript,controls);sync();
 }
 function show(next,rows,buttons){stage=next;lines=rows;actions=buttons;paint();}
 function greeting(){
  if(FocusedEntry.request?.key==='terminal-reply')FocusedEntry.close();
  show('hello',[
   ['You press the old terminal’s power switch. Its pale screen flickers awake.'],
   ['SIGNAL DETECTED','system'],['HELLO?','bright']
  ],replies.map(([label])=>[label,label.toLowerCase()]));
 }
 const previousDescribe=FocusedEntry.describe;
 FocusedEntry.describe=function(){return stage==='hello'?null:previousDescribe.apply(this,arguments);};
 const previousSync=GraphicalUI.sync;
 GraphicalUI.sync=function(){const result=previousSync.apply(this,arguments);sync();return result;};
 terminalAwakens=async function(){
  busy=true;input.disabled=true;
  try{await outputQueue;page=0;signal.textContent='SIGNAL DETECTED';greeting();}
  finally{busy=false;input.disabled=false;FocusedEntry.schedule();}
 };
 answerHello=async function(raw=''){
  const cmd=r5Mapped(raw),reply=replies.find(([label])=>label.toLowerCase()===cmd);
  if(!reply)return greeting();
  page=0;
  show('listen',[
   ['YOU > '+reply[0],'player'],['TERMINAL > '+reply[1],'bright'],
   ["WOMAN'S VOICE > Easy. We don't know who's on the other end.",'woman'],
   ["MAN'S VOICE > Fair.",'man'],
   ["WOMAN'S VOICE > Hold your reply. This line cannot carry both of us at once. Just listen.",'woman']
  ],[['Continue transmission','listen']]);
 };
 reveal=async function(){
  if(page===0){page=1;show('listen',[
   ["WOMAN'S VOICE > I'm going to try to send you something.",'woman'],
   ["MAN'S VOICE > That's not going to work.",'man'],["WOMAN'S VOICE > It might.",'woman'],
   ['TRANSFER: 3% → 17% → 61% // DISPLAY LINK ESTABLISHED','system'],
   ['SIGNAL ERROR // DISPLAY DRIVER FAILURE // RECOVERING…','system']
  ],[['Continue transmission','listen']]);return;}
  if(page===1){page=2;show('listen',[
   ["WOMAN'S VOICE > Signal's degrading. No time for introductions.",'woman'],
   ["WOMAN'S VOICE > Solace is south of you. Its walls still stand, and its Relay Station may give us a line that holds.",'woman'],
   ["MAN'S VOICE > Road's bad. Worse after dark.",'man'],['TRANSMISSION DATA RECEIVED','bright'],
   ['DESTINATION: SOLACE // ROUTE: 127 SOUTH // DISTANCE: 6.2 MI','system']
  ],[['Continue transmission','listen']]);return;}
  signal.textContent='NO SIGNAL';show('savecoords',[
   ["WOMAN'S VOICE > We're the Tomorrow Project. We reconnect settlements so food, medicine and warnings can get through. Solace has gone quiet.",'woman'],
   ["WOMAN'S VOICE > Save those coordinates. Get behind Solace's walls, then find the Relay. We will keep listening.",'woman'],
   ['SOLACE / ROUTE 127 SOUTH / 6.2 MI','system'],['SIGNAL LOST','bright']
  ],[['Log coordinates','log coordinates']]);
 };
 const previousRender=renderCurrentChoices;
 renderCurrentChoices=function(){
  if(stage==='hello')return greeting();
  if(opening.has(stage)){
   if(!lines.length||displayedStage!==stage){page=0;lines=stage==='savecoords'?[
    ['SOLACE / ROUTE 127 SOUTH / 6.2 MI','system'],['Save the coordinates, reach Solace, and ask about the Relay Station.']
   ]:[['Two voices crackle through the static. The transmission is still waiting.']];actions=stage==='savecoords'?[['Log coordinates','log coordinates']]:[['Continue transmission','listen']];}
   return paint();
  }
  return previousRender.apply(this,arguments);
 };
 // Own these inputs before the legacy free-text parser and LISTEN failure branch.
 const previousCore=handleCommandCore;
 handleCommandCore=function(raw){
  if(!busy&&stage==='hello')return answerHello(raw);
  if(!busy&&stage==='listen')return r5Mapped(raw)==='listen'?reveal():paint();
  return previousCore.apply(this,arguments);
 };
})();
