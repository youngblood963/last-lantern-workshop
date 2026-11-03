/* Route 127 Casino graphical menu, presentation-first companion to WO24.
 * Existing casino.js and game economy untouched. No map changes. */
(function(){
  'use strict';
  if(typeof GraphicalUI==='undefined'||typeof handleCasinoCommand!=='function')return;
  const graphic=()=>GraphicalUI.preference()==='graphics';
  const atMenu=()=>stage==='mercy'&&mercyLocation==='casino';
  const options=[
    {key:'1',command:'dice',label:'Dice'},
    {key:'2',command:'slots',label:'Slots'},
    {key:'3',command:'rock paper scissors',label:'Rock Paper Scissors'},
    {key:'4',command:'blackjack',label:'Blackjack'},
    {key:'5',command:'rat racing',label:'Rat Racing'},
    {key:'6',command:'back',label:'Back to Bar'}
  ];
  const oldModel=GraphicalUI.model;
  GraphicalUI.model=function(){
    const m=oldModel.call(this);
    if(graphic()&&atMenu()){
      m.layout='casino-menu';
      m.art='assets/locations/rusty_lantern_casino.png';
      m.title=player.flags.port55Casino?'The Rusty Anchor — Casino':'The Rusty Lantern — Casino';
    }
    return m;
  };
  const oldChoices=GraphicalUI.choices;
  GraphicalUI.choices=function(){return graphic()&&atMenu()?options.map(x=>({...x})):oldChoices.call(this);};
  const oldDispatch=GraphicalUI.dispatch;
  GraphicalUI.dispatch=async function(choice){
    if(graphic()&&atMenu()){
      if(busy||!options.some(x=>x.command===choice.command))return false;
      await handleCommand(choice.command);
      this.sync();
      return true;
    }
    return oldDispatch.call(this,choice);
  };
  // The legacy Level 5 gate lives in casino.js itself. For the graphical
  // experience we route only under-level Slots/Rat Racing through the same
  // casinoOpen/casinoWager/casinoResolve functions, never changing level or Bolts.
  const oldHandler=handleCasinoCommand;
  handleCasinoCommand=function(cmd){
    if(!graphic()||stage!=='mercy')return oldHandler(cmd);
    if(atMenu()&&(cmd==='slots'||cmd==='rat racing'||cmd==='rats')){
      casinoOpen(cmd==='slots'?'slots':'rats');return true;
    }
    if(mercyLocation!=='casinoGame'||player.level>=5)return oldHandler(cmd);
    const r=casinoRound();
    if(!r||!['slots','rats'].includes(r.game))return oldHandler(cmd);
    // The original handler already handles normal back/menu/settled states.
    // Its under-level gate occurs after these cases; handle them here directly.
    if(r.status==='settled'){
      if(cmd==='play again'||cmd==='p')casinoOpen(r.game);
      else if(['b','back','leave','casino'].includes(cmd))casinoMenu();
      else casinoRender();
      return true;
    }
    if(['b','back','leave','leave table','casino','town','return to town'].includes(cmd)){
      if((r.custom||r.allInEven)&&['b','back'].includes(cmd)){
        delete r.custom;delete r.allInEven;casinoRender();return true;
      }
      if(cmd==='town'||cmd==='return to town')return oldHandler(cmd);
      casinoMenu();return true;
    }
    if(r.status==='waiting'){
      if(cmd==='custom wager'||cmd==='custom'||cmd==='c'){
        r.custom=true;delete r.allInEven;casinoRender();return true;
      }
      if(cmd==='all in'||cmd==='a')cmd='wager '+player.bolts;
      if(r.custom&&/^[0-9]+$/.test(cmd))cmd='wager '+cmd;
    }
    if(r.game==='rats'&&r.pick===null){
      const match=cmd.match(/^(?:rat\s+)?([1-4])$/);
      const named=CASINO_RATS.findIndex(n=>n.toLowerCase()===cmd);
      if(match)r.pick=Number(match[1])-1;
      else if(named>=0)r.pick=named;
      else add('Choose one of the four rats.','system');
      casinoRender();return true;
    }
    if(!casinoWager(cmd,r)){
      add('INVALID WAGER — choose positive whole Bolts within your carried balance.','system');
      casinoRender();return true;
    }
    delete r.custom;delete r.allInEven;
    casinoResolve(r);
    return true;
  };
  // Six real keyboard shortcuts on the graphical casino menu, not hotspot art.
  // Avoid intercepting keys during text entry or when the menu is not visible.
  document.addEventListener('keydown',event=>{
    if(!graphic()||!atMenu()||event.altKey||event.ctrlKey||event.metaKey||event.repeat)return;
    if(!/^[1-6]$/.test(event.key))return;
    const target=event.target;
    if(target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
    if(target?.closest?.('button'))return;
    event.preventDefault();
    const choice=options[Number(event.key)-1];
    if(choice)void GraphicalUI.dispatch(choice);
  });
  GraphicalUI.schedule();
})();
