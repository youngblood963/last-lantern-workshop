// v47 casino: isolated turn-free games using existing character flags and saves.
const CASINO_RATS=['Nibbles','Rustbucket','Sir Squeaks-a-Lot','Cheeseburger'];
const SLOT_SYMBOLS=[{name:'SCRAP',weight:30,mult:10},{name:'BOLTS',weight:25,mult:18},{name:'LANTERN',weight:20,mult:28},{name:'SKULL',weight:12,mult:50},{name:'RAT',weight:10,mult:70},{name:'BLACKGLASS',weight:3,mult:300}];
const STEVE_NEWS=[{id:'casino5',level:5,title:"THE RUSTY LANTERN TAVERN — THREE NEW GAMES! BLACKJACK! SLOTS! RAT RACING!",message:"CRAZY STEVE > The Rusty Lantern Tavern has three new games! Blackjack! Slots! Rat racing! My Bolts are on Cheeseburger. Never trust a rat that doesn't appreciate a snack.",board:['+---------------------------+',"| THE RUSTY LANTERN TAVERN                 |",'| THREE NEW GAMES!          |','| BLACKJACK! SLOTS!         |','| RAT RACING!              |','+---------------------------+','BACK OF SIGN: NO REFUNDS.']}];
const CASINO_ANIMATION_MS={dice:1000,rps:1000,slots:1800,rats:5000};
let casinoAnimation=null;
let casinoAnimationEpoch=0;
function ensureCasinoState(){
 if(!player.flags.casino)player.flags.casino={nextId:1,round:null};
 return player.flags.casino;
}
function ensureSteveAnnouncements(){
 if(!player.flags.steveNews)player.flags.steveNews={seen:{},queue:[]};
 const news=player.flags.steveNews;
 for(const row of STEVE_NEWS)if(player.level>=row.level&&!news.seen[row.id]&&!news.queue.includes(row.id))news.queue.push(row.id);
 return news;
}
function showSteveAnnouncement(){
 const news=ensureSteveAnnouncements();
 if(!['between','roadReady','turnComplete','questRoadComplete','fork'].includes(stage)||!news.queue.length)return false;
 const id=news.queue.shift(),row=STEVE_NEWS.find(n=>n.id===id);if(!row||news.seen[id])return false;news.seen[id]=true;
 add('CRAZY STEVE — NEWS ON THE ROAD','place');
 add('An elderly, wild-eyed wanderer bounds into view: wild gray hair, tangled beard, mismatched boots and a filthy sandwich board. The smell arrives a moment before his excessive enthusiasm.');
 add("CRAZY STEVE'S GOT NEWS YOU CAN USE!",'bright');
 add(row.title,'system');add(row.message);
 if(player.level>=5)casinoArt(row.board.join('\n'));
 add('Steve shuffles aside, recommending Cheeseburger to a passing crow. Your road journey continues. No additional turn spent.');
 // Enqueue the checkpoint; the caller has established its normal encounter stage by then.
 outputQueue=outputQueue.then(()=>{if(activeSaveSlot)saveGame(activeSaveSlot)});
 return true;
}
function casinoArt(text){if(player.level<5)return;outputQueue=outputQueue.then(()=>{addImmediate(text,'casino-art system');followOutput()});}
function cancelCasinoAnimation(){if(casinoAnimation)casinoAnimation.skip=true;}
async function casinoDelay(ms,token,epoch){for(let left=ms;left>0;left-=50){if(token.skip||token.cancelled||epoch!==casinoAnimationEpoch)return;await sleep(Math.min(left,50));}}
function casinoAnimate(frames,final){
 if(player.level<5)return;
 const epoch=casinoAnimationEpoch,game=casinoRound()?.game,duration=CASINO_ANIMATION_MS[game]||1000;
 outputQueue=outputQueue.then(async()=>{
  if(epoch!==casinoAnimationEpoch)return;
  const token={skip:false,cancelled:false};casinoAnimation=token;
  const box=document.createElement('div');box.className='line casino-art system';screen.appendChild(box);
  const skip=document.createElement('button');skip.type='button';skip.textContent='SKIP ANIMATION';skip.className='casino-skip';skip.addEventListener('click',()=>{token.skip=true});screen.appendChild(skip);
  for(const frame of frames){if(token.skip||token.cancelled||epoch!==casinoAnimationEpoch)break;renderV48CasinoFrame(box,frame,game);followOutput();await casinoDelay(duration/frames.length,token,epoch)}
  if(!token.cancelled&&epoch===casinoAnimationEpoch)renderV48CasinoFrame(box,final,game);
  if(typeof skip.remove==='function')skip.remove();else if(Array.isArray(screen.childNodes))screen.childNodes=screen.childNodes.filter(n=>n!==skip);
  if(casinoAnimation===token)casinoAnimation=null;followOutput();
 });
}
function cancelCasinoOnLoad(){casinoAnimationEpoch++;if(casinoAnimation){casinoAnimation.skip=true;casinoAnimation.cancelled=true}casinoAnimation=null;}
input.addEventListener('keydown',e=>{if(e.key==='Escape')cancelCasinoAnimation()});
if(typeof window.addEventListener==='function')window.addEventListener('keydown',e=>{if(e.key==='Escape')cancelCasinoAnimation()});
function casinoCheckpoint(){if(activeSaveSlot)saveGame(activeSaveSlot);}
function casinoMenu(entered=false){
 ensureCasinoState();ensureSteveAnnouncements();stage='mercy';mercyLocation='casino';player.flags.solaceMenu='casino';
 add(player.flags.port55Casino?'THE RUSTY ANCHOR — GAMES':"JEN'S BACKROOM CASINO",'place casino-heading');
 v48Intro('casino',[["A filthy curtain conceals a cramped room beneath an old sign: G A M B L _ N G. A dice table, a rock-paper-scissors table and a blackjack table share space with slot machines and a rat racing corner."]],'The familiar tables wait behind the filthy curtain.',entered);
 if(player.level<5)add('Dice, rock-paper-scissors, and blackjack are open. Slots unlock at Level 5; rat racing is available in Seaport.','system');
 else casinoArt('+--------------------------+\n| DICE / RPS / BLACKJACK    |\n| SLOTS / RAT RACING        |\n+--------------------------+');
 casinoChoices('(D) DICE   ROCK PAPER SCISSORS   BLACKJACK'+(player.level>=5?'   SLOTS':'')+(player.flags.port55Casino?'   RAT RACING':'')+'   (B) BACK');
}
function casinoChoices(text){outputQueue=outputQueue.then(()=>{currentHotkeys={};numberedChoices={};usedHotkeys=new Set();addImmediate(hotkeyLine(text),'system');followOutput()});}
function casinoRound(){return ensureCasinoState().round;}
function casinoOpen(game){
 const c=ensureCasinoState();c.round={id:c.nextId++,game,status:'waiting',bet:0,pick:null};mercyLocation='casinoGame';casinoRender();
}
function casinoRender(){
 const r=casinoRound();if(!r){casinoMenu();return}mercyLocation='casinoGame';
 add(({rps:'ROCK-PAPER-SCISSORS',rats:'RAT RACING'}[r.game]||r.game.toUpperCase()),'place');
 if(r.status==='settled'){
  add(r.message||'ROUND COMPLETE','reward');
  if(r.game==='blackjack')casinoShowCards(r,false);
  add(`WAGER ${r.bet} / RETURN ${r.payout} / NET ${r.payout-r.bet} BOLTS`,'system');
  casinoChoices('PLAY AGAIN   (B) BACK');return;
 }
 if(r.game==='blackjack'&&r.status==='active'){
  casinoShowCards(r,true);add('Leaving this table stands your hand before returning.','system');casinoChoices('HIT   STAND   (B) BACK');return;
 }
 if(r.game==='dice'&&r.pick===null){casinoChoices('PICK 1   PICK 2   PICK 3   PICK 4   PICK 5   PICK 6   (B) BACK');return;}
 if(r.game==='rps'&&r.pick===null){casinoChoices('ROCK   PAPER   SCISSORS   (B) BACK');return;}
 if(r.game==='rats'&&r.pick===null){casinoChoices(CASINO_RATS.map((n,i)=>`RAT ${i+1} — ${n}`).join('   ')+'   (B) BACK');return;}
 if(r.game==='blackjack')add('Use an even wager (minimum 2 Bolts); natural blackjack pays 3:2. Dealer stands on soft 17. No double down.','system');
 if(r.game==='slots')add('Three matching symbols pay the posted total return: SCRAP 10x, BOLTS 18x, LANTERN 28x, SKULL 50x, RAT 70x, BLACKGLASS 300x. Other combinations return 0.','system');
 if(r.allInEven){add(`BLACKJACK requires an even wager. Bet ${r.allInEven} Bolts and keep 1 Bolt?`,'system');casinoChoices('CONFIRM EVEN ALL IN   (B) BACK');return;}
 if(r.custom){add('CUSTOM WAGER — type any affordable positive whole number'+(r.game==='blackjack'?' (even stakes only).':'.'),'system');casinoChoices('(B) BACK');return;}
 casinoWagerMenu();
}
function casinoWager(cmd,r){
 const m=cmd.match(/^(?:wager|bet)\s+([0-9]+)(?:\s+bolts?)?$/);
 if(!m)return false;const bet=Number(m[1]);
 if(!Number.isSafeInteger(bet)||bet<=0||bet>player.bolts||!Number.isSafeInteger(player.bolts+bet*300))return false;

 if(r.game==='blackjack'&&bet%2!==0)return false;
 r.bet=bet;player.bolts-=bet;r.status='active';updateHud();casinoCheckpoint();return true;
}
function casinoSettle(r,payout,message){
 if(r.status!=='active')return false;
 // Refuse invalid/overflowing credits without consuming the round.
 if(!Number.isSafeInteger(payout)||payout<0||!Number.isSafeInteger(player.bolts)||!Number.isSafeInteger(player.bolts+payout))return false;
 r.status='settled';r.payout=payout;r.message=message;player.bolts+=payout;updateHud();casinoCheckpoint();return true;
}
function casinoDiceFace(n){const cells=[[' ',' ',' '],[' ',' ',' '],[' ',' ',' ']];const positions={1:[[1,1]],2:[[0,0],[2,2]],3:[[0,0],[1,1],[2,2]],4:[[0,0],[0,2],[2,0],[2,2]],5:[[0,0],[0,2],[1,1],[2,0],[2,2]],6:[[0,0],[0,2],[1,0],[1,2],[2,0],[2,2]]};for(const [y,x]of positions[n])cells[y][x]='o';return '+-------+\n'+cells.map(row=>'| '+row.join(' ')+' |').join('\n')+'\n+-------+';}
const RPS_HANDS={rock:'   ___\n _/   \\_\n|  FIST |\n \\_____/',paper:'| | | | |\n| | | | |\n|  PALM  |\n \\______/',scissors:' \\ /\n  V\n / \\\n| FIST |'};
function casinoRpsOutcome(playerPick,opponent){if(playerPick===opponent)return 'push';return ({rock:'scissors',paper:'rock',scissors:'paper'})[playerPick]===opponent?'win':'loss';}
function casinoSlotDraw(rng=Math.random){let roll=rng()*100;for(const s of SLOT_SYMBOLS){roll-=s.weight;if(roll<0)return s.name}return 'BLACKGLASS';}
function casinoSlotPayout(reels,bet){if(!Array.isArray(reels)||reels.length!==3||!Number.isSafeInteger(bet)||bet<=0)return 0;const symbol=SLOT_SYMBOLS.find(s=>s.name===reels[0]);if(!symbol||!reels.every(x=>x===symbol.name))return 0;const payout=symbol.mult*bet;return Number.isSafeInteger(payout)?payout:0;}
function casinoDeck(rng=Math.random){const deck=[];for(const suit of ['C','D','H','S'])for(const rank of ['A','2','3','4','5','6','7','8','9','10','J','Q','K'])deck.push({rank,suit});for(let i=deck.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}return deck;}
function casinoCardTotal(cards){let value=0,aces=0;for(const c of cards){if(c.rank==='A'){value+=11;aces++}else value+=['J','Q','K'].includes(c.rank)?10:Number(c.rank)}while(value>21&&aces){value-=10;aces--}return value;}
function casinoNatural(cards){return cards.length===2&&casinoCardTotal(cards)===21;}
function casinoShowCards(r,hidden){renderV48Blackjack(r,hidden);}
function casinoBlackjackStart(r){r.deck=casinoDeck();r.player=[r.deck.pop(),r.deck.pop()];r.dealer=[r.deck.pop(),r.deck.pop()];casinoCheckpoint();if(casinoNatural(r.player)||casinoNatural(r.dealer)){const pn=casinoNatural(r.player),dn=casinoNatural(r.dealer);casinoSettle(r,pn&&dn?r.bet:pn?r.bet*2.5:0,pn&&dn?'BOTH BLACKJACK — PUSH':pn?'NATURAL BLACKJACK':'DEALER BLACKJACK');}}
function casinoBlackjackStand(r){if(r.status!=='active')return;while(casinoCardTotal(r.dealer)<17)r.dealer.push(r.deck.pop());const p=casinoCardTotal(r.player),d=casinoCardTotal(r.dealer);casinoSettle(r,d>21||p>d?r.bet*2:p===d?r.bet:0,d>21?'DEALER BUST':p>d?'YOU WIN':p===d?'PUSH':'DEALER WINS');}
function casinoResolve(r){
 if(r.game==='blackjack'){casinoBlackjackStart(r);casinoRender();return;}
 if(r.game==='dice'){r.roll=1+Math.floor(Math.random()*6);casinoSettle(r,r.roll===r.pick?r.bet*6:0,`DIE: ${r.roll} — ${r.roll===r.pick?'WIN':'LOSS'}`);casinoAnimate([casinoDiceFace(2),casinoDiceFace(5)],casinoDiceFace(r.roll));}
 if(r.game==='rps'){r.opponent=['rock','paper','scissors'][Math.floor(Math.random()*3)];r.result=casinoRpsOutcome(r.pick,r.opponent);casinoSettle(r,r.result==='win'?r.bet*2:r.result==='push'?r.bet:0,`${r.pick.toUpperCase()} versus ${r.opponent.toUpperCase()} — ${r.result.toUpperCase()}`);casinoAnimate([RPS_HANDS.rock,RPS_HANDS.paper,RPS_HANDS.scissors],`YOU\n${RPS_HANDS[r.pick]}\nOPPONENT\n${RPS_HANDS[r.opponent]}`);}
 if(r.game==='slots'){
  r.reels=[casinoSlotDraw(),casinoSlotDraw(),casinoSlotDraw()];
  casinoSettle(r,casinoSlotPayout(r.reels,r.bet),r.reels.join(' / '));
  // Cheeseburger is a once-per-character 5% slot jackpot, never sold or traded.
  // Multiplayer-wide uniqueness is intentionally not claimed without shared ownership infrastructure.
  if(!player.flags.cheeseburgerOwned&&Math.random()<0.05){
   player.flags.cheeseburgerOwned=true;
   const owned=player.flags.ownedPets||(player.flags.ownedPets=[]);
   if(!owned.includes('Cheeseburger'))owned.push('Cheeseburger');
   player.packMax=(Number.isSafeInteger(player.packMax)?player.packMax:10)+6;
   add("CRAZY STEVE BURSTS THROUGH THE CURTAIN — CHEESEBURGER! THE LEGENDARY SLOT RAT!",'reward');
   add('CHEESEBURGER joins your companions. +6 backpack slots. This character’s jackpot is permanently claimed.','bright');
   casinoCheckpoint();
  }
  casinoAnimate(['[ SCRAP ] [ ? ] [ ? ]','[ ? ] [ BOLTS ] [ ? ]'],r.reels.map(s=>'['+s+']').join(' '));
 }
 if(r.game==='rats')casinoResolveRats(r);
 casinoRender();
}
function handleCasinoCommand(cmd){
 const locations=['casino','casinoGame','jenGames','dice','diceBet','diceAgain'];
 if(stage!=='mercy')return false;
 if(mercyLocation==='jen'&&['gamble','casino','backroom','backroom casino'].includes(cmd)){casinoMenu(true);return true;}
 if(!locations.includes(mercyLocation))return false;
 ensureCasinoState();
 // Legacy Dice saves retain their selection and Bolts; pending bets were never deducted.
 if(['dice','diceBet','diceAgain'].includes(mercyLocation)){const old=mercyLocation;casinoOpen('dice');if(old==='diceBet')casinoRound().pick=player.flags.dicePick||null;if(old==='diceAgain'){casinoRound().status='settled';casinoRound().bet=0;casinoRound().payout=0;casinoRound().message='Previous dice round already settled.'}mercyLocation='casinoGame';}
 if(mercyLocation==='jenGames')mercyLocation='casino';
 if(mercyLocation==='casino'){
  if(['b','back','leave','bar'].includes(cmd)){if(player.flags.port55Casino){player.flags.port55Casino=false;stage='port55Mia';port55MiaMenu();}else{mercyLocation='jen';showBarActions();}return true;}
  if(['town','return to town'].includes(cmd)){if(player.flags.port55Casino){player.flags.port55Casino=false;stage='port55Mia';port55MiaMenu();}else{mercyLocation='town';mercyMenu();}return true;}
  const game={dice:'dice','rock paper scissors':'rps','rock-paper-scissors':'rps',rps:'rps',blackjack:'blackjack',slots:'slots','rat racing':'rats',rats:'rats'}[cmd];
  if(game){if((game==='slots'&&player.level<5)||(game==='rats'&&!player.flags.port55Casino)){add(game==='slots'?'LOCKED — Reach Level 5.':'Rat racing is available in Seaport.','system');casinoMenu()}else casinoOpen(game)}else casinoMenu();return true;
 }
 const r=casinoRound();if(!r){casinoMenu();return true;}
 if(r.status==='waiting'&&(r.pick!==null||['slots','blackjack'].includes(r.game))){
  if((r.custom||r.allInEven)&&['b','back'].includes(cmd)){delete r.custom;delete r.allInEven;casinoRender();return true;}
  if(cmd==='custom wager'||cmd==='custom'||cmd==='c'){r.custom=true;delete r.allInEven;casinoRender();return true;}
  if(cmd==='all in'||cmd==='a'){delete r.custom;if(r.game==='blackjack'&&player.bolts%2===1){r.allInEven=player.bolts-1;if(r.allInEven<2){delete r.allInEven;add('BLACKJACK needs at least 2 Bolts.','system');}casinoRender();return true;}cmd='wager '+player.bolts;}
  if(cmd==='confirm even all in'){if(!r.allInEven||player.bolts!==r.allInEven+1){delete r.allInEven;add('Balance changed; choose ALL IN again.','system');casinoRender();return true;}cmd='wager '+r.allInEven;}
  if(r.custom&&/^[0-9]+$/.test(cmd))cmd='wager '+cmd;
 }
 if(['b','back','leave','leave table','casino','town','return to town'].includes(cmd)){
  if(r.status==='active'&&r.game==='blackjack')casinoBlackjackStand(r);
  if(cmd==='town'||cmd==='return to town'){if(player.flags.port55Casino){player.flags.port55Casino=false;stage='port55Mia';port55MiaMenu();}else{mercyLocation='town';mercyMenu()}}else casinoMenu();return true;
 }
 if(r.status==='settled'){if(cmd==='play again'||cmd==='p')casinoOpen(r.game);else casinoRender();return true;}
 if((player.level<5&&!['dice','rps','blackjack'].includes(r.game))||(r.game==='rats'&&!player.flags.port55Casino)){add(r.game==='rats'?'Rat racing is available in Seaport.':'LOCKED — Reach Level 5.','system');casinoMenu();return true;}
 if(r.status==='active'&&r.game==='blackjack'){
  if(cmd==='hit'){r.player.push(r.deck.pop());if(casinoCardTotal(r.player)>21)casinoSettle(r,0,'YOU BUST');else casinoCheckpoint();}
  else if(cmd==='stand')casinoBlackjackStand(r);else add('Choose HIT or STAND.','system');casinoRender();return true;
 }
 if(r.game==='dice'&&r.pick===null){const m=cmd.match(/^(?:pick\s+)?([1-6])$/);if(m)r.pick=Number(m[1]);else add('Choose a die number 1–6.','system');casinoRender();return true;}
 if(r.game==='rps'&&r.pick===null){if(['rock','paper','scissors'].includes(cmd))r.pick=cmd;else add('Choose ROCK, PAPER or SCISSORS.','system');casinoRender();return true;}
 if(r.game==='rats'&&r.pick===null){const m=cmd.match(/^(?:rat\s+)?([1-4])$/);const named=CASINO_RATS.findIndex(n=>n.toLowerCase()===cmd);if(m)r.pick=Number(m[1])-1;else if(named>=0)r.pick=named;else add('Choose one of the four rats.','system');casinoRender();return true;}
 if(!casinoWager(cmd,r)){add('INVALID WAGER — positive whole Bolts within your carried balance; Blackjack requires even stakes for its exact 3:2 payout.','system');casinoRender();return true;}
 delete r.custom;delete r.allInEven;casinoResolve(r);return true;
}
// Stage B: predetermined fair race, cosmetic personality paths only.
function casinoRatWinner(rng=Math.random){return Math.floor(rng()*4);}
function casinoRatFrame(positions,winner=null){return positions.map((pos,i)=>`${['NIB','RUS','SIR','CHE'][i]} |${'.'.repeat(pos)}r${'.'.repeat(12-pos)}|`).join('\n')+(winner===null?'\nFINISH AT RIGHT':`\nWINNER: ${CASINO_RATS[winner]}`);}
function casinoRatFrames(winner){const paths=[[4,7,8,10],[1,3,6,10],[3,5,2,8],[2,2,5,9]];const frames=[0,1,2,3].map(t=>casinoRatFrame(paths.map(p=>p[t])));const final=casinoRatFrame(paths.map((p,i)=>i===winner?12:Math.min(11,p[3])),winner);return {frames,final};}
function casinoResolveRats(r){r.winner=casinoRatWinner();casinoSettle(r,r.pick===r.winner?r.bet*4:0,`${CASINO_RATS[r.winner]} WINS — ${r.pick===r.winner?'YOUR RAT WINS':'YOUR RAT LOSES'}`);add('Nibbles bursts ahead. Rustbucket starts slowly and finishes strong. Sir Squeaks-a-Lot doubles back; Cheeseburger stops for a bite.');const art=casinoRatFrames(r.winner);casinoAnimate(art.frames,art.final);}

function casinoWagerMenu(){outputQueue=outputQueue.then(()=>{currentHotkeys={c:'custom wager',a:'all in',b:'back'};numberedChoices={10:'wager 10',20:'wager 20',50:'wager 50'};usedHotkeys=new Set(['c','a','b']);for(const label of ['[10] 10 BOLTS','[20] 20 BOLTS','[50] 50 BOLTS','[C] CUSTOM','[A] ALL IN','[B] BACK'])addImmediate(label,'system');followOutput()});}
