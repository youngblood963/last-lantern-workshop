const assert=require('node:assert/strict'),create=require('./helpers/menu_audit.cjs');
(async()=>{
 const game=create(),{run,flush,ctx}=game;await flush();
 const act=async c=>{await run('handleCommand('+JSON.stringify(c)+')');await flush();};
 const offered=()=>JSON.parse(run('JSON.stringify(GraphicalUI.choices().map(c=>c.command))'));
 run("resetPlayer();player.handle='Lounge Regression';player.level=20;player.turns=30;player.bolts=1000000;player.flags.interfaceUnlocked=true;lanternMigrate();Object.assign(lanternState(),{nodeId:'abandoned-motel',currentEdgeId:null,pending:false});GraphicalUI.active=()=>true;GraphicalUI.preferred='graphics';busy=false;commandProcessing=false;Route127Motel.open('lounge')");await flush();
 assert(offered().includes('gamble'));await act('gamble');assert.deepEqual(offered(),['poker','slots','big six wheel','keno','roulette','back']);
 await act('poker');assert.equal(run('stage'),'r6Casino');assert.equal(run('r6Round().game'),"PIRATE'S POKER");assert(!run('!!player.flags.seaport55?.freed'),'Motel must not liberate Seaport');
 await act('wager 10');assert.equal(run('r6Round().status'),'active');assert.equal(run('r6Round().hand.length'),5);assert.equal(run('r6Round().deck.length'),42);
 const cards=run('JSON.stringify(r6Round().hand)'),balance=run('player.bolts');await act('load auto');assert.equal(run('r6Round().status'),'active');assert.equal(run('JSON.stringify(r6Round().hand)'),cards);assert.equal(run('player.bolts'),balance);
 await act('stand');assert.equal(run('r6Round().status'),'settled');let wallet=run('player.bolts');assert.equal(run('r6Wager(10)'),false);await act('stand');assert.equal(run('player.bolts'),wallet);await act('back');assert.equal(run('stage'),'motelCasino');await act('back');assert.equal(run('stage'),'motelLounge');assert.equal(run('player.turns'),30);
 console.log('PASS Poker: native deal/stand, reload preservation, no duplicate debit, independent Seaport access, casino/Lounge returns');
 await act('gamble');await act('slots');assert.deepEqual(offered(),['wager 10','wager 20','wager 50','back']);
 ctx.Math.random=()=>0;
 for(const bet of [10,20,50]){
  const before=run('player.bolts');await act('wager '+bet);assert.equal(run('r6Round().status'),'settled');assert.equal(run('r6Round().payout'),bet*10);assert.equal(run('player.bolts'),before+bet*9);
  const settled=run('JSON.stringify([player.bolts,r6Round().reels,r6Round().id])');await act('load auto');assert.equal(run('JSON.stringify([player.bolts,r6Round().reels,r6Round().id])'),settled);assert.equal(run('r6Wager('+bet+')'),false);await act('play again');
 }
 for(const bet of [1,25,100,1001])assert.equal(run('r6Wager('+bet+')'),false);
 assert.equal(run('player.turns'),30);console.log('PASS Slots: fixed wagers, supplied paytable mapping, shared boosted payout path, single credit and reload');
 await act('back');await act('big six wheel');assert.equal(offered().length,7);await act('number 1');
 for(let winner=1;winner<=6;winner++){
  ctx.Math.random=()=> (winner-.5)/6;const before=run('player.bolts');await act('wager 10');assert.equal(run('r6Round().winner'),winner);assert.equal(run('player.bolts'),before-10+(winner===1?50:0));
  const settled=run('JSON.stringify([player.bolts,r6Round().winner])');await act('load auto');assert.equal(run('JSON.stringify([player.bolts,r6Round().winner])'),settled);await act('play again');await act('number 1');
 }
 assert.equal(run('r6Wager(1001)'),false);assert.equal(run('player.turns'),30);
 console.log('PASS Big Six: six uniform outcomes, 5x total return, losing/winning reloads, cap and zero turns');
 await act('back');await act('keno');
 for(const t of [[1],[1,1],[0,2],[1,81],[1,2.5],Array.from({length:11},(_,i)=>i+1)])assert.equal(run('MotelCasino.setTicket('+JSON.stringify(t)+')'),false);
 ctx.Math.random=()=>0;
 for(let spots=2;spots<=10;spots++){
  const ticket=Array.from({length:spots},(_,i)=>i+1);assert(run('MotelCasino.setTicket('+JSON.stringify(ticket)+')'));const before=run('player.bolts');
  await act('wager 10');assert.equal(run('r6Round().draw.length'),20);assert.equal(run('new Set(r6Round().draw).size'),20);assert.equal(run('r6Round().hits.length'),spots);
  assert.equal(run('player.bolts'),before-10+run('MotelCasino.KENO['+spots+']['+spots+']')*10);const wallet=run('player.bolts');await act('load auto');assert.equal(run('player.bolts'),wallet);assert.equal(run('r6Wager(10)'),false);await act('play again');
 }
 const choose=(n,k)=>{if(k<0||k>n)return 0;let x=1;for(let i=1;i<=k;i++)x=x*(n-i+1)/i;return x;};
 const tables=JSON.parse(run('JSON.stringify(MotelCasino.KENO)'));
 for(let spots=2;spots<=10;spots++){
  let mass=0,rtp=0;for(let hits=0;hits<=spots;hits++){const p=choose(spots,hits)*choose(80-spots,20-hits)/choose(80,20);mass+=p;rtp+=p*(tables[spots][hits]||0);}
  assert(Math.abs(mass-1)<1e-12);assert(rtp>0&&rtp<1);console.log('Keno '+spots+' spots RTP '+(rtp*100).toFixed(4)+'%');
 }
 assert.equal(run('player.turns'),30);console.log('PASS Keno: all 2–10 tickets, 20 unique draws, full-match payouts, validation, reload, hypergeometric probability/return checks');
 await act('back');await act('roulette');
 const defs=JSON.parse(run('JSON.stringify(MotelCasino.BETS)'));
 assert.equal(run('new Set(MotelCasino.ORDER).size'),37);assert.equal(run('MotelCasino.RED.size'),18);
 for(const b of defs){
  assert.equal(b.numbers.length*b.mult,36,'Correct net payout and European house edge: '+b.id);
  for(let n=0;n<=36;n++)assert.equal(run('MotelCasino.rouletteReturn([{id:'+JSON.stringify(b.id)+',amount:10}],'+n+')'),b.numbers.includes(n)?10*b.mult:0,'Pocket '+n+' bet '+b.id);
 }
 for(let winner=0;winner<=36;winner++){
  ctx.Math.random=()=> (winner+.5)/37;
  await act('place n0');await act('place red');await act('place street1');await act('place split1-2');await act('place corner1');await act('place six1');await act('place dozen1');await act('place column1');
  assert.equal(run('r6Round().bets.length'),8);const chips=JSON.parse(run('JSON.stringify(r6Round().bets)')),before=run('player.bolts');await act('spin');
  assert.equal(run('r6Round().winner'),winner);const payout=defs.reduce((sum,b)=>sum+chips.filter(c=>c.id===b.id&&b.numbers.includes(winner)).reduce((s,c)=>s+c.amount*b.mult,0),0);
  assert.equal(run('player.bolts'),before-80+payout);const wallet=run('player.bolts');await act('load auto');assert.equal(run('player.bolts'),wallet);assert.equal(run('r6Wager(80)'),false);await act('play again');
 }
 await act('wager 500');await act('place red');await act('place black');assert.equal(run('MotelCasino.place("n0")'),false);await act('undo bet');assert.equal(run('r6Round().bets.length'),1);await act('clear bets');assert.equal(run('r6Round().bets.length'),0);
 run('player.bolts=5');assert.equal(run('MotelCasino.place("red")'),false);run('player.bolts=10000;MotelCasino.place("red");player.turns=0;testMode=false');assert.equal(run('r6Wager(500)'),false);run('player.turns=30');
 console.log('PASS Roulette: every defined bet against all 37 pockets, all bet-family payouts, all 37 committed spins/reloads, zero rule, caps, undo/clear and insufficient funds');
 // Simulate closing after the native debit checkpoint but before settlement.
 run('player.bolts=100000;player.turns=30;testMode=false');await act('clear bets');await act('back');
 for(const game of ['slots','big six wheel','keno','roulette']){
  await act(game);if(game==='big six wheel')await act('number 1');if(game==='roulette')await act('place red');
  const before=run('player.bolts');run('globalThis.realMotelSettle=r6Settle;r6Settle=()=>false');await act(game==='roulette'?'spin':'wager 10');
  assert.equal(run('r6Round().status'),'active');assert.equal(run('player.bolts'),before-10);const committed=run('JSON.stringify([r6Round().winner,r6Round().draw,r6Round().reels])');
  run('r6Settle=realMotelSettle');await run("loadGame('auto')");await flush();assert.equal(run('r6Round().status'),'settled',game+' checkpoint recovery');assert.equal(run('JSON.stringify([r6Round().winner,r6Round().draw,r6Round().reels])'),committed);
  const wallet=run('player.bolts');await act('load auto');assert.equal(run('player.bolts'),wallet);await act('back');
 }
 // Exercise the published graphical dispatch, not only typed commands.
 const click=async command=>{const row=run('GraphicalUI.choices()').find(c=>c.command===command);assert(row,'Missing clickable command '+command);await run('GraphicalUI.dispatch('+JSON.stringify(row)+')');await flush();};
 for(const game of ['poker','slots','big six wheel','keno','roulette']){await click(game);assert.equal(run('stage'),'r6Casino');await click('back');assert.equal(run('stage'),'motelCasino');}
 await click('back');assert.equal(run('stage'),'motelLounge');assert.equal(run('player.turns'),30);
 console.log('PASS committed debit interruption/reload for all instant games; all five native graphical dispatch/return paths; unchanged turns');
})().catch(e=>{console.error(e);process.exitCode=1});
