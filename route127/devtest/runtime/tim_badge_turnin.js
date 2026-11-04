/* Devtest only: explicit Tim Old Badge hand-in.
 * Preserve the existing quest state, exact reward, and save format.
 */
(() => {
  'use strict';
  if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
  const ready=()=>player?.flags?.timQuest==='found'&&hasItem("Tim's Old Badge");
  const originalTalk=npcTalk;
  const originalSolace=handleSolace;
  npcTalk=function(name){
    if(String(name).toLowerCase()!=='tim'||!ready())return originalTalk.apply(this,arguments);
    // Modify only Tim's existing synchronous dialogue choice line. No duplicate menu.
    const previousAdd=add;
    add=function(text='',cls=''){
      if(cls==='reward'&&text==='RETURN OLD BADGE — available now')return;
      if(cls==='system'&&typeof text==='string'&&
         text.startsWith('ASK ABOUT SOLACE   ASK ABOUT WORK   VIEW BOUNTIES')){
        text='RETURN OLD BADGE   '+text;
      }
      return previousAdd(text,cls);
    };
    try{return originalTalk.apply(this,arguments)}
    finally{add=previousAdd}
  };
  handleSolace=function(cmd,raw=cmd){
    const c=String(cmd||'').toLowerCase();
    if(stage==='mercy'&&ready()){
      // Merely finding or speaking to Tim must not silently consume the badge.
      if(['talk to tim','talk tim','tim','find tim'].includes(c)){
        npcTalk('tim');return;
      }
      if(mercyLocation==='tim'&&
         ['return old badge','return tim\'s badge','return tims badge','return badge'].includes(c)){
        // Use the original reward branch; exactly 120 XP + 30 Bolts, once.
        const result=originalSolace.call(this,'talk to tim',raw);
        if(player.flags.timQuest==='done')npcTalk('tim');
        return result;
      }
    }
    return originalSolace.apply(this,arguments);
  };
})();
