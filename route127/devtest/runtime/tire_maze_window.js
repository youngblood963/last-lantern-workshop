function r18RenderMazeBoard(board,q){
  const grid=R18_MAZES[q.variant];
  board.style.setProperty('--tire-grid-size',grid[0].length);
  const cells=grid.flatMap((row,y)=>Array.from(row,(tile,x)=>{
   const playerHere=x===q.x&&y===q.y;
   const cell=document.createElement('span');
   cell.textContent=playerHere?'●':tile==='G'?'◆':'';
   cell.className=playerHere?'tire-player':tile==='#'?'tire-wall':tile==='G'?'tire-goal':'tire-path';
   return cell;
  }));
  board.replaceChildren(...cells);
}
/* DEVTEST graphical surface for the existing Cemetery of Tires encounter. */
(()=>{
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const classicControls=r18MazeControls;
 let dialog,board,status,movement,tire;
 let lastStep,lastHp;
 function make(tag,text){
  const node=document.createElement(tag);
  if(text)node.textContent=text;
  return node;
 }
 function button(label,action){
  const node=make('button',label);
  node.type='button';
  node.addEventListener('click',action);
  return node;
 }
 function close(){
  if(dialog?.open)dialog.close();
  lastStep=lastHp=undefined;
 }
 function build(){
  dialog=make('dialog');dialog.className='r127-tire-maze';
  dialog.setAttribute('aria-labelledby','r127-tire-maze-title');
  const title=make('h2','Cemetery of Tires');title.id='r127-tire-maze-title';
  const instructions=make('p','Reach the salvage crate. Avoid the tire walls. Use the direction buttons, arrow keys, or WASD.');
  board=make('div');board.className='tire-board';board.setAttribute('aria-hidden','true');
  status=make('p');status.setAttribute('role','status');
  movement=make('div');movement.className='tire-controls';
  for(const direction of ['up','left','down','right']){
   movement.append(button(direction.toUpperCase(),()=>r18MazeMove(direction)));
  }
  tire=button('Recover Suitable Tire',()=>{
   if(!busy&&!commandProcessing)handleCommand('recover suitable tire');
  });
  const footer=make('div');footer.className='tire-controls';
  const leaveMaze=()=>{if(!busy&&!commandProcessing)handleCommand('leave maze');};
  footer.append(tire,button('Leave Maze',()=>leaveMaze()));
  dialog.addEventListener('cancel',event=>{event.preventDefault();leaveMaze();});
  dialog.append(title,instructions,board,status,movement,footer);
  document.body.append(dialog);
 }
 r18MazeControls=function(){
  if(GraphicalUI.preference()!=='graphics'||typeof HTMLDialogElement==='undefined'){
   close();return classicControls();
  }
  document.getElementById('r18-maze-controls')?.remove();
  const encounter=stage==='encounter'?currentEncounter():null;
  if(encounter?.title!=='CEMETERY OF TIRES'){close();return;}
  const q=r18MazeScene();
  if(!q.started){close();return;}
  if(!dialog)build();
  r18RenderMazeBoard(board,q);
  const hit=lastStep!==undefined&&q.step!==lastStep&&player.hp<lastHp;
  status.textContent=(q.finished?'Crate reached. ':hit?'You hit a tire wall. ':'')+
   'HP '+player.hp+' / '+player.maxHp+' · Row '+(q.y+1)+', column '+(q.x+1);
  lastStep=q.step;lastHp=player.hp;
  movement.hidden=q.finished;
  tire.hidden=!encounterChoices(encounter).includes('RECOVER SUITABLE TIRE');
  if(!dialog.open)dialog.showModal();
 };
})();
