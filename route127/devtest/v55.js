// v55 incremental Seaport and companion extension. State is stored in existing player.flags.
const PORT55_PETS={
 'Scrap Rat':{rarity:'common',price:75,ability:'10% chance to find 2–5 Bolts when moving east on the Seaport road.'},
 'Wasteland Crow':{rarity:'common',price:75,ability:'15% chance to spot scavenging clues while traveling east.'},
 'Stray Cat':{rarity:'common',price:90,ability:'10% chance to avoid a Seaport road encounter.'},
 'Scrap Dog':{rarity:'common',price:105,ability:'Reduces incoming combat damage by 1.'},
 'Ferret':{rarity:'uncommon',price:230,ability:'20% chance per eligible combat round to steal 2–8 Bolts from the living enemy’s remaining reward.'}
};
function port55State(){const f=player.flags;return f.seaport55||(f.seaport55={stage:'investigate',metKaiden:false,metMia:false,freed:false,reward:false});}
function port55Owned(){return player.flags.ownedPets||(player.flags.ownedPets=[]);}
function port55Objective(){const q=port55State();if(q.stage==='investigate')return 'Investigate the fishermen controlling Seaport.';if(q.stage==='confront')return 'Confront and defeat the fishermen at the harbor gate.';if(q.stage==='free')return 'Free the two captive residents at the docks.';if(q.stage==='meet')return 'Speak with Kaiden and Mia about rebuilding Seaport.';if(player.flags.chapterOneComplete)return 'MAIN QUEST: COMPLETE — Chapter One — The Road to Seaport. Further chapters are in development.';return 'Seaport liberated. Shops, clinic, workshop and bank need workers — demo endpoint.';}
function port55Arrive(){const q=port55State();if(q.stage==='investigate'&&!q.intro){q.intro=true;add('Fishing boats block the quay. Armed fishermen threaten the townspeople; two residents are held behind a chained dock gate.','bright');add('MAIN QUEST UPDATED — Investigate the fishermen.','reward');}}
function port55Menu(){const q=port55State();port55PatrolTick();numberedChoices={};currentHotkeys={};add('SEAPORT — HARBOR STREETS','place');add(q.freed?'The harbor is free, but its shuttered services need workers.':q.stage==='free'?'The fishermen have been defeated. Two residents remain captive behind the dock gate.':'Armed fishermen control the harbor. Two residents remain captive.','system');
 const options=['TOWN STREETS','HARBOR ENTRANCE','MARKET AREA','THE RUSTY ANCHOR','PET VENDOR','HARBOR DOCKS','CLINIC — NEED TO HIRE','GENERAL STORE — NEED TO HIRE','WORKSHOP — NEED TO HIRE','BANK — NEED TO HIRE','RETURN WEST','DEMO STATUS'];
 if((player.flags.port55PendingRewards||[]).length)options.push('CLAIM PENDING REWARD');
 if(q.stage==='investigate')options.unshift('INVESTIGATE FISHERMEN');if(q.stage==='confront')options.unshift('CONFRONT FISHERMEN');
 if(q.freed)add('KAIDEN PATROL — '+port55PatrolName(),'system');
 options.forEach((x,i)=>add(`[${i+1}] ${x}`,'system'));
 options.forEach((x,i)=>numberedChoices[String(i+1)]=x.toLowerCase());
}
function port55Submenu(name,options){numberedChoices={};currentHotkeys={};add('SEAPORT — '+name.toUpperCase(),'place');options.forEach((x,i)=>{add(`[${i+1}] ${x}`,'system');numberedChoices[String(i+1)]=x.toLowerCase();});}
function portLiberationVictory(){const q=port55State();q.stage='free';stage='seaport';add('The fishermen have been defeated. The dock gate is still chained; the residents must be freed.','reward');port55Menu();}
function portLiberationRetreat(){stage='seaport';add('You retreat to the harbor streets. The fishermen still hold Seaport.','system');port55Menu();}
function port55Free(){const q=port55State();if(q.stage!=='free'){add('There is nobody here to free yet.','system');return;}q.stage='meet';q.freed=true;q.metKaiden=false;q.metMia=false;add('You break the chains and release the two residents.','reward');add('“We’re free... I can’t believe we’re actually free.”','bright');add('“But freedom doesn’t mean much if this town can’t survive.”','bright');add('“We need people to run the shops, keep us safe, and help rebuild Seaport.”','bright');if(!q.reward){q.reward=true;if(!addPack('Harbor Guard Cutlass','weapon',1,true)){(player.flags.port55PendingRewards||(player.flags.port55PendingRewards=[])).push('Harbor Guard Cutlass');add('Your reward is held at the harbor until you have backpack space.','system');}add('LIBERATION REWARD — RARE HARBOR GUARD CUTLASS (19–26 DMG)','reward');}add('MAIN QUEST UPDATED — Speak with Kaiden and Mia.','reward');port55LiberationArt(false);}
function port55Claim(){const a=player.flags.port55PendingRewards||[];if(!a.length)return;const item=a[0];if(addPack(item,'weapon',1,true))a.shift();else add('Your reward remains held at the harbor. Free a backpack slot.','system');}
function port55Vendor(){add('Nessa > These strays choose their people. INSPECT PET <name> to learn their abilities.','bright');port55Submenu('Pet Vendor — Nessa',Object.entries(PORT55_PETS).map(([n,v])=>`${n} — ${v.rarity.toUpperCase()} — ${v.price} BOLTS${port55Owned().includes(n)?' — OWNED':''}`).concat(['RETURN TO HARBOR']));}
function port55StopMenu(){port55PatrolTick();const loc=player.flags.port55CurrentStop||'Town Streets';const here=port55PatrolName()===loc;port55Submenu(loc,here?['TALK KAIDEN','RETURN TO HARBOR']:['RETURN TO HARBOR']);add(here?'Kaiden is making his rounds here.':'Kaiden is currently patrolling '+port55PatrolName()+'.','system');}
function port55Pets(){port55Submenu('Manage Pets',port55Owned().map(n=>`${n}${player.flags.equippedPet===n?' — EQUIPPED':''}`).concat(['UNEQUIP PET','RETURN TO EQUIPMENT']));add('INSPECT PET <name> / EQUIP PET <name>','system');}
function petCombatRound(c){if(player.flags.equippedPet!=='Ferret'||!c||c.hp<=0||c.bolts<=0)return;if(Math.random()>=.20)return;const n=Math.min(c.bolts,2+Math.floor(Math.random()*7));if(n<=0)return;c.bolts-=n;player.bolts+=n;updateHud();add(`Your ferret darts between ${c.name.toLowerCase()}'s boots and steals ${n} Bolts!`,'reward');}
// Deduct stolen money from the existing victory pool, never add a second payout.
const port55OldHandleCombat=handleCombat;
handleCombat=function(cmd){if(combatState&&combatState.bolts!==undefined)combatState.bolts=Math.max(0,combatState.bolts);const c=combatState;if(c&&c.bolts!==undefined)c.bolts=Math.max(0,c.bolts);if(c&&c.bolts!==undefined)c.bolts=Number(c.bolts)||0;return port55OldHandleCombat(cmd);};
function port55Command(cmd){const q=port55State();if(stage==='port55Pets'){if(['return to equipment','return','back','exit'].includes(cmd)){stage='inventory';showInventory();return true;}if(cmd==='unequip pet'){player.flags.equippedPet=null;port55Pets();return true;}if(cmd.startsWith('equip pet ')){const n=Object.keys(PORT55_PETS).find(n=>n.toLowerCase()===cmd.slice(10));if(n&&port55Owned().includes(n)){player.flags.equippedPet=n;add(`${n} equipped.`,'reward');}else add('You do not own that pet.','system');port55Pets();return true;}if(cmd.startsWith('inspect pet ')){const n=Object.keys(PORT55_PETS).find(n=>n.toLowerCase()===cmd.slice(12));if(n)add(`${n} — ${PORT55_PETS[n].rarity}: ${PORT55_PETS[n].ability}`,'bright');port55Pets();return true;}if(/^\d+$/.test(cmd)){const n=port55Owned()[Number(cmd)-1];if(n){player.flags.equippedPet=n;port55Pets();return true;}}port55Pets();return true;}
 if(stage==='port55Vendor'){if(['return to harbor','return','back','exit'].includes(cmd)){stage='seaport';port55Menu();return true;}if(cmd.startsWith('inspect pet ')){const n=Object.keys(PORT55_PETS).find(n=>n.toLowerCase()===cmd.slice(12));if(n)add(`${n}: ${PORT55_PETS[n].ability}`,'bright');port55Vendor();return true;}const n=Object.keys(PORT55_PETS).find(n=>cmd.includes(n.toLowerCase()));if(n){const v=PORT55_PETS[n];if(port55Owned().includes(n))add('Already owned.','system');else if(player.bolts<v.price)add('Not enough Bolts.','danger');else{player.bolts-=v.price;port55Owned().push(n);updateHud();add(`Purchased ${n}. Manage it from Equipment.`, 'reward');}port55Vendor();return true;}port55Vendor();return true;}
 if(stage==='port55Kaiden'||stage==='port55Mia'||stage==='port55Docks'){if(['return','back','exit','return to harbor'].includes(cmd)){stage='seaport';port55Menu();return true;}if(stage==='port55Docks'&&['free residents','free captives','break chains'].includes(cmd)){port55Free();stage='seaport';port55Menu();return true;}if(stage==='port55Mia'&&['gamble','gambling','games','casino'].includes(cmd)){port55CasinoEnter();return true;}
 if(stage==='port55Mia'&&['buy energy bar','buy energy bar — 8 bolts','energy bar'].includes(cmd)){if(player.bolts<8)add('Not enough Bolts.','system');else if(packSlotsUsed()>=player.packMax&&!findItem('Energy Bars'))add('Backpack full.','system');else{player.bolts-=8;addPack('Energy Bars','consumable');updateHud();}port55MiaMenu();return true;}
 if(stage==='port55Kaiden'&&q.freed&&player.flags.port55CurrentStop!==port55PatrolName()){add('Kaiden has continued his patrol to '+port55PatrolName()+'.','system');stage='seaport';port55Menu();return true;}
 if(stage==='port55Kaiden'){if(q.freed)q.metKaiden=true;add(q.freed?'Kaiden > You freed us. Now we need workers and a proper watch.':'Kaiden > The fishermen control the docks. Keep your eyes open.','bright');}else if(stage==='port55Mia'){if(q.freed)q.metMia=true;add(q.freed?'Mia > Drinks are on the house tonight. Tomorrow we rebuild.':'Mia > Keep your voice down. Those fishermen have ears everywhere.','bright');}else add('The chained holding gate overlooks the dark harbor.','system');if(q.stage==='meet'&&q.metKaiden&&q.metMia){q.stage='done';port55CompleteChapter();}if(stage==='port55Mia')port55MiaMenu();else port55Submenu(stage==='port55Kaiden'?'Kaiden':'Harbor Docks',stage==='port55Docks'?['FREE RESIDENTS','RETURN TO HARBOR']:['SMALL TALK','RETURN TO HARBOR']);return true;}
 if(stage==='port55Stop'){
  if(['back','return','exit','return to harbor'].includes(cmd)){stage='seaport';port55Menu();return true;}
  if(['talk kaiden','small talk kaiden','kaiden','small talk'].includes(cmd)){
   if(port55PatrolName()===player.flags.port55CurrentStop){stage='port55Kaiden';port55Submenu('Kaiden — Town Lawman',['SMALL TALK','RETURN TO HARBOR']);}
   else {add('Kaiden has moved on to '+port55PatrolName()+'.','system');port55StopMenu();}
   return true;
  }
  port55StopMenu();return true;
 }
 if(stage!=='seaport')return false;
 if(cmd==='investigate fishermen'){if(q.stage==='investigate'){q.stage='confront';add('The fishermen have enslaved two harbor residents and threaten everyone who resists.','bright');add('MAIN QUEST UPDATED — Confront the fishermen.','reward');}port55Menu();return true;}
 if(cmd==='confront fishermen'){if(q.stage==='confront')startCombat({name:'FISHERMEN ENFORCERS',level:9,hp:125,min:13,max:21,xp:180,bolts:38,end:'The last armed fisherman drops his weapon.'},'seaportLiberation');else port55Menu();return true;}
 if(['town streets','harbor entrance','market area','docks','kaiden','talk kaiden','small talk kaiden'].includes(cmd)){
  const stop={'town streets':'Town Streets','harbor entrance':'Harbor Entrance','market area':'Market Area','docks':'Docks'}[cmd];
  if(!stop && cmd.includes('kaiden')){
   if(player.flags.port55CurrentStop!==port55PatrolName()){add('Kaiden is patrolling '+port55PatrolName()+'.','system');port55Menu();return true;}
   stage='port55Kaiden';port55Submenu('Kaiden — '+port55PatrolName(),['SMALL TALK','RETURN TO HARBOR']);return true;
  }
  stage='port55Stop';player.flags.port55CurrentStop=stop;
  port55StopMenu();return true;
 }
 if(['the rusty anchor','rusty anchor','mia','bar'].includes(cmd)){stage='port55Mia';port55MiaMenu();return true;}
 if(['pet vendor','pets'].includes(cmd)){if(!q.freed){add('The vendor cannot trade while the fishermen control the harbor.','system');port55Menu();return true;}stage='port55Vendor';port55Vendor();return true;}
 if(['harbor docks'].includes(cmd)){stage='port55Docks';port55Submenu('Harbor Docks',['FREE RESIDENTS','RETURN TO HARBOR']);return true;}
 if(['clinic — need to hire','general store — need to hire','workshop — need to hire','bank — need to hire','clinic','general store','workshop','bank'].includes(cmd)){add('NEED TO HIRE — This facility cannot operate without a worker.','system');port55Menu();return true;}
 if(cmd==='return west'){stage='portRoad';portMove(-1);return true;}
 if(cmd==='claim pending reward'){port55Claim();port55Menu();return true;}
 if(cmd==='demo status'){add(port55Objective(),'bright');if(player.flags.chapterOneComplete)port55FinaleText();if(q.freed)add('REPLAY HARBOR ART — Available from the completed Main Quest.','system');port55Menu();return true;}
 return false;
}

function port55Travel(s){const pet=player.flags.equippedPet;if(pet==='Scrap Rat'&&Math.random()<.10){const n=2+Math.floor(Math.random()*4);player.bolts+=n;updateHud();add(`Your Scrap Rat uncovers ${n} Bolts in roadside debris.`,'reward');}if(pet==='Wasteland Crow'&&Math.random()<.15)add('Your crow circles a scrap heap, pointing out a promising scavenging spot.','bright');}

function port55Resume(){if(stage==='port55Stop')return port55StopMenu();if(stage==='port55Vendor')return port55Vendor();if(stage==='port55Pets')return port55Pets();if(stage==='port55Kaiden')return port55Submenu('Kaiden — Town Lawman',['SMALL TALK','RETURN TO HARBOR']);if(stage==='port55Mia')return port55MiaMenu();if(stage==='port55Docks')return port55Submenu('Harbor Docks',['FREE RESIDENTS','RETURN TO HARBOR']);}

// v55.1 — Persistent, deterministic patrol advances on normal harbor context refresh.
const PORT55_PATROL=['Town Streets','Harbor Entrance','Market Area','Docks'];
function port55PatrolName(){return PORT55_PATROL[(Number(player.flags.port55PatrolIndex)||0)%4];}
function port55PatrolTick(){if(!port55State().freed)return;const f=player.flags;const lifetime=Number(player.lifetimeTurns)||0;const step=Math.floor(lifetime/3);if(f.port55PatrolStep!==step){f.port55PatrolStep=step;f.port55PatrolIndex=step%4;}}
function port55MiaMenu(){port55Submenu('The Rusty Anchor — Mia',['SMALL TALK','GAMBLE','BUY ENERGY BAR — 8 BOLTS','RETURN TO HARBOR']);}
function port55CasinoEnter(){player.flags.port55Casino=true;player.flags.port55CasinoOrigin='port55Mia';stage='mercy';casinoMenu(true);}
function port55CasinoRestore(){if(!player.flags.port55Casino)return false;
 if(stage==='mercy'&&['casino','casinoGame','jenGames'].includes(mercyLocation)){
  if(mercyLocation==='casinoGame')casinoRender();else casinoMenu(false);return true;
 }
 return false;
}
function port55CasinoCommand(cmd){if(!player.flags.port55Casino||stage!=='mercy')return false;
 if((mercyLocation==='casino'&&['back','b','leave','bar','return to town','town'].includes(cmd))){player.flags.port55Casino=false;stage='port55Mia';port55MiaMenu();return true;}
 if(mercyLocation==='casinoGame'&&['return to town','town'].includes(cmd)){player.flags.port55Casino=false;stage='port55Mia';port55MiaMenu();return true;}
 return false;
}
const PORT55_FINALE=[
 'THE ROAD DOESN’T END HERE','The fishermen are gone.','For the first time in years, Seaport belongs to its people.',
 'The docks are quiet. The streets are beginning to fill with life. Somewhere inside The Rusty Anchor, laughter rises above the sound of the waves.',
 'Kaiden watches over the town. Mia pours another drink.','And beyond the harbor, the wasteland stretches farther than anyone can see.',
 'You’ve survived the road. You’ve faced the Factory. You’ve given a broken town a chance to rebuild.',
 'But the wasteland is far from finished with you.',
 'Beyond these roads, stronger enemies wait. Forgotten places remain buried beneath the dust. And somewhere out there, the signal that started your journey is still calling.',
 'THIS CHAPTER IS COMPLETE.','YOUR JOURNEY IS NOT.','Thank you for playing Route 127.','More chapters are in development.'
];
function port55FinaleText(){PORT55_FINALE.forEach((line,i)=>add(line,i===0||i>=9?'bright':'system'));}
function port55CompleteChapter(){const q=port55State();if(!q.freed||!q.metKaiden||!q.metMia||q.stage!=='done'||player.flags.chapterOneComplete)return false;
 player.flags.chapterOneComplete=true;add('MAIN QUEST: COMPLETE — Chapter One — The Road to Seaport','reward');port55FinaleText();if(typeof v49Autosave==='function')v49Autosave();return true;}

// v55.3: self-contained original harbor cinematic, preserving the v55.2 once-only flag.
function port55LiberationArt(replay=false){
 const f=player.flags;
 if(!f.seaport55?.freed)return false;
 if(!replay){if(f.port552ArtSeen)return false;f.port552ArtSeen=true;}
 add('SEAPORT — HARBOR AT DUSK','place');
 // Queue the image in the same output stream as the introduction's narrative.
 // Reuse the game's transmission visual language, without altering its intro overlay.
 outputQueue=outputQueue.then(()=>{
   const frame=document.createElement('figure');
   frame.className='port553-cinematic';
   const picture=document.createElement('img');
   picture.src='seaport_liberation.png';
   picture.alt='Liberated Seaport at sunset: a weathered fishing vessel, ruined docks, lighthouse and waterfront buildings beneath storm clouds.';
   picture.loading='eager';
   picture.decoding='async';
   const fallback=document.createElement('figcaption');
   fallback.className='port553-fallback';
   fallback.textContent='SEAPORT LIBERATED — Sunset breaks over the battered harbor. The fishing vessel rests by the docks; the lighthouse still stands. A new beginning.';
   fallback.hidden=true;
   picture.onerror=()=>{picture.hidden=true;fallback.hidden=false;};
   frame.appendChild(picture);
   frame.appendChild(fallback);
   screen.appendChild(frame);
   followOutput();
 });
 add('The fishermen are gone. A light burns above the harbor. For the first time in years, Seaport has hope.','reward');
 if(!replay&&typeof v49Autosave==='function')v49Autosave();
 return true;
}
