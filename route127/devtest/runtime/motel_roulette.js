/* European single-zero roulette. Visuals consume the committed native casino result. */
(()=>{'use strict';if(!globalThis.MotelCasino)return;const M=MotelCasino,K=MotelCasinoMath;
const draft=()=>player.flags.motelRoulette||(player.flags.motelRoulette={amount:10,mode:'straight',bets:[],pending:null,version:0});
const total=()=>draft().bets.reduce((a,b)=>a+b.amount,0);
const pos=n=>{if(n===0)return {x:41.1,y:52};const row=(n-1)%3,col=Math.floor((n-1)/3),y=405+(row+.5)*59,min=735+(y-405)*(699-735)/177,max=1440+(y-405)*(1507-1440)/177;return {x:(min+(col+.5)*(max-min)/12)/1671*100,y:y/941*100};};
function addBet(type,value){const d=draft();let bet;try{bet=K.rouletteBet(type,value,d.amount);}catch(e){d.pending=null;return M.notice(e.message);}
 if(total()+bet.amount>1000)return M.notice('Maximum combined wager: 1,000 Bolts per spin.');if(total()+bet.amount>player.bolts)return M.notice('You do not have enough Bolts for that combined wager.');
 d.bets.push(bet);d.pending=null;d.version++;v49Autosave();M.render();
}
function felt(id){const d=draft();if(id.startsWith('number:')){const n=Number(id.slice(7));if(!Number.isInteger(n)||n<0||n>36)return;
 if(d.mode==='straight')return addBet('straight',n);
 if(d.mode==='split'){if(d.pending==null){d.pending=n;d.version++;M.render();return;}return addBet('split',[d.pending,n]);}
 if(n===0)return M.notice('Use a straight or split bet on zero.');
 const street=1+3*Math.floor((n-1)/3);return addBet(d.mode,d.mode==='corner'?n:street);
 }
 const [type,v]=id.split(':');return addBet(type,v?Number(v):null);
}
function render(r){M.choices('EUROPEAN ROULETTE — SINGLE ZERO',['UNDO BET','CLEAR BETS','SPIN','BACK']);}
function command(cmd,r){if(M.locked(r))return M.notice('The wheel and ball are still moving.');const d=draft();
 if(cmd==='back'&&r.custom){delete r.custom;return render(r);}
 if(cmd==='custom wager'){if(r.status==='settled'){M.open('roulette');r=M.round();}r.custom=true;return render(r);}
 const chip=Number(cmd.match(/^(?:wager|bet) (\d+)$/)?.[1]||(r.custom&&/^\d+$/.test(cmd)?cmd:NaN));if(Number.isFinite(chip)){if(!Number.isSafeInteger(chip)||chip<1||chip>1000||chip>player.bolts)return M.notice('Choose an affordable whole chip value from 1 to 1,000 Bolts.');d.amount=chip;delete r.custom;d.version++;v49Autosave();return render(r);}
 if(cmd.startsWith('mode ')){const mode=cmd.slice(5);if(['straight','split','street','corner','sixline'].includes(mode)){d.mode=mode;d.pending=null;d.version++;return render(r);}}
 if(cmd.startsWith('felt '))return felt(cmd.slice(5));
 if(cmd==='undo bet'){d.bets.pop();d.pending=null;d.version++;v49Autosave();return render(r);}
 if(cmd==='clear bets'){d.bets=[];d.pending=null;d.version++;v49Autosave();return render(r);}
 if(cmd==='spin'){
  if(!d.bets.length)return M.notice('Place at least one bet directly on the felt before spinning.');
  const bets=d.bets.map(b=>({...b,value:Array.isArray(b.value)?[...b.value]:b.value,numbers:[...b.numbers]}));let result;
  const winner=Math.floor(Math.random()*37);try{result=K.roulette(bets,winner);}catch(e){return M.notice(e.message);}
  if(result.stake>player.bolts)return M.notice('You do not have enough Bolts for those bets.');
  const rotorFrom=r.rotorAngle||0,ballFrom=r.ballAngle||0,rotorAngle=rotorFrom+2160+Math.random()*360,target=rotorAngle+K.wheel.indexOf(winner)*360/37,ballAngle=ballFrom-2520-((ballFrom-target)%360+360)%360;
  if(r.status==='settled'){M.open('roulette');r=M.round();}
  d.bets=[];d.pending=null;d.version++;
  if(!M.commit(r,result.stake,{bets,winner,rotorFrom,rotorAngle,ballFrom,ballAngle},result.payout,'WINNING NUMBER '+winner+' — '+(winner===0?'GREEN':K.reds.has(winner)?'RED':'BLACK'),5200)){d.bets=bets;d.version++;v49Autosave();return render(r);}
  return;
 }
 return M.notice('Choose a chip, place bets on the felt, then Spin.');
}
function rotor(canvas){const c=canvas.getContext('2d');if(!c)return;const size=800,step=2*Math.PI/37;canvas.width=size;canvas.height=size;c.translate(400,400);
 const rim=c.createRadialGradient(0,0,270,0,0,398);rim.addColorStop(0,'#55391b');rim.addColorStop(.25,'#d2ad62');rim.addColorStop(.85,'#6d4823');rim.addColorStop(1,'#e7c77c');c.fillStyle=rim;c.beginPath();c.arc(0,0,398,0,Math.PI*2);c.arc(0,0,250,Math.PI*2,0,true);c.fill();
 K.wheel.forEach((n,i)=>{const start=-Math.PI/2+i*step-step/2,end=start+step;c.beginPath();c.arc(0,0,381,start,end);c.arc(0,0,280,end,start,true);c.closePath();c.fillStyle=n===0?'#1f623b':K.reds.has(n)?'#8f2520':'#1b1b19';c.fill();c.lineWidth=3;c.strokeStyle='#d0aa61';c.stroke();c.save();c.rotate(i*step);c.fillStyle='#fff2ce';c.font='bold 27px Georgia';c.textAlign='center';c.textBaseline='middle';c.fillText(String(n),0,-340);c.restore();});
 // Deterministic patina is independent of the game's random draw.
 let seed=127;for(let i=0;i<1800;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const a=seed/2**32*2*Math.PI;seed=(Math.imul(seed,1664525)+1013904223)>>>0;const radius=282+seed/2**32*112;c.fillStyle=i%2?'#dfbd6c22':'#00000026';c.fillRect(Math.cos(a)*radius,Math.sin(a)*radius,1.5,2.5);}
 canvas.setAttribute('aria-label','European roulette rotor: '+K.wheel.join(', '));
}
function fillSurface(parent,mobile){
 function button(id,label,x,y,w,h,text,color){const b=M.node('button','mc-roulette-cell'+(color?' '+color:''),text);b.type='button';b.dataset.bet=id;b.setAttribute('aria-label',label);Object.assign(b.style,{left:x+'%',top:y+'%',width:w+'%',height:h+'%'});b.addEventListener('click',()=>M.command('felt '+id));parent.append(b);return b;}
 for(let n=1;n<=36;n++){const row=(n-1)%3,col=Math.floor((n-1)/3),p=pos(n);button('number:'+n,'Number '+n,mobile?6+col*7:p.x-1.8,mobile?4+row*19:p.y-3.1,mobile?7:3.65,mobile?19:6.2,String(n),K.reds.has(n)?'red':'black');}
 button('number:0','Number 0',mobile?0:39,mobile?4:43,mobile?6:4.2,mobile?57:18.6,'0','green');
 for(let i=1;i<=3;i++){button('column:'+i,'Column '+i,mobile?90:88,mobile?4+(i-1)*19:43+(i-1)*6.3,mobile?10:5.4,mobile?19:6.3,'2:1','green');button('dozen:'+i,'Dozen '+i,mobile?6+(i-1)*28:42.1+(i-1)*16.2,mobile?61:62.2,mobile?28:16.2,mobile?17:6.3,['1st 12','2nd 12','3rd 12'][i-1],'green');}
 const out=[['low','1–18'],['even','Even'],['red','Red'],['black','Black'],['odd','Odd'],['high','19–36']];out.forEach(([id,label],i)=>button(id,label,mobile?6+i*14:41.6+i*8.8,mobile?78:68.6,mobile?14:8.8,mobile?18:7.4,label,id==='red'?'red':id==='black'?'black':'green'));
}
function chipPosition(b,mobile){if(b.type==='dozen')return {x:mobile?20+(b.value-1)*28:50.2+(b.value-1)*16.2,y:mobile?69:65.3};if(b.type==='column')return {x:mobile?95:90.7,y:mobile?13.5+(b.value-1)*19:46.15+(b.value-1)*6.3};const outside=['low','even','red','black','odd','high'].indexOf(b.type);if(outside>=0)return {x:mobile?13+outside*14:46+outside*8.8,y:mobile?87:72.3};
 const coords=b.numbers.map(n=>{if(!mobile)return pos(n);if(n===0)return {x:3,y:32.5};return {x:9.5+Math.floor((n-1)/3)*7,y:13.5+(n-1)%3*19};});const p={x:coords.reduce((a,p)=>a+p.x,0)/coords.length,y:coords.reduce((a,p)=>a+p.y,0)/coords.length};if(['street','sixline'].includes(b.type))p.y=mobile?60:61.5;return p;}
function showBets(parent,mobile){for(const old of parent.querySelectorAll('.mc-roulette-chip'))old.remove();const sums=new Map();for(const b of (M.locked(M.round())&&M.round()?.bets||draft().bets)){const k=b.type+JSON.stringify(b.value);if(sums.has(k))sums.get(k).amount+=b.amount;else sums.set(k,{...b});}
 for(const bet of sums.values()){const p=chipPosition(bet,mobile),chip=M.node('span','mc-roulette-chip',bet.amount);chip.style.left=p.x+'%';chip.style.top=p.y+'%';chip.setAttribute('aria-label',bet.label+', '+bet.amount+' Bolts');parent.append(chip);}
 for(const b of parent.querySelectorAll('.mc-roulette-cell')){b.disabled=M.locked(M.round());b.classList.toggle('pending',b.dataset.bet==='number:'+draft().pending);}
}
function point(angle,radius,width,height){const w=width*.316,theta=angle*Math.PI/180,x=Math.sin(theta)*w*radius,y=-Math.cos(theta)*w*radius,z=y*Math.sin(56*Math.PI/180),scale=1000/(1000-z);return {left:width*.194+x*scale,top:height*.521+y*Math.cos(56*Math.PI/180)*scale};}
function paint(canvas,panel,r){if(!r)return;const d=draft();
 if(!canvas.children.length){const plane=M.node('div','mc-roulette-plane'),wheel=M.node('canvas','mc-roulette-rotor');rotor(wheel);plane.append(wheel);const ball=M.node('img','mc-roulette-ball');ball.src=M.asset('casino/motel_roulette_ball.png');ball.alt='Roulette ball';const handle=M.node('img','mc-roulette-handle');handle.src=M.asset('casino/motel_roulette_handle.png');handle.alt='Brass roulette spindle';const feltLayer=M.node('div','mc-roulette-felt');fillSurface(feltLayer,false);canvas.append(plane,ball,handle,feltLayer);}
 const plane=canvas.children[0],wheel=plane.firstChild,ball=canvas.children[1],box=canvas.getBoundingClientRect(),last=point(r.ballAngle||0,.405,box.width,box.height);wheel.style.transform='rotate('+(r.rotorAngle||0)+'deg)';ball.style.left=last.left+'px';ball.style.top=last.top+'px';
 const signature=r.id+'|'+r.status;if(canvas.dataset.round!==signature){canvas.dataset.round=signature;
  if(r.status==='settled'&&M.liveAnimations.has(r.id)&&wheel.animate&&!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches){wheel.mcAnimation=wheel.animate([{transform:'rotate('+(r.rotorFrom||0)+'deg)'},{transform:'rotate('+r.rotorAngle+'deg)'}],{duration:5200,easing:'cubic-bezier(.32,0,.12,1)'});
   const frames=Array.from({length:91},(_,i)=>{const t=i/90,eased=1-(1-t)**3,angle=(r.ballFrom||0)+(r.ballAngle-(r.ballFrom||0))*eased,radius=.48-.075*Math.max(0,(t-.65)/.35),p=point(angle,radius,box.width,box.height);return {left:p.left+'px',top:p.top+'px',offset:t};});ball.mcAnimation=ball.animate(frames,{duration:5200,easing:'linear'});
  }
 }
 if(!M.locked(r)){wheel.mcAnimation?.cancel();ball.mcAnimation?.cancel();}
 showBets(canvas.children[3],false);
 const state=r.id+'|'+r.status+'|'+d.version+'|'+!!r.custom+'|'+M.locked(r);if(panel.dataset.state===state)return;panel.dataset.state=state;panel.replaceChildren();
 const row=M.node('div','mc-roulette-options');for(const value of [10,50,100,500]){const b=M.node('button','',value+' Bolts');b.type='button';b.disabled=M.locked(r);b.setAttribute('aria-pressed',String(d.amount===value));b.addEventListener('click',()=>M.command('wager '+value));row.append(b);}const custom=M.node('button','','Custom');custom.type='button';custom.disabled=M.locked(r);custom.addEventListener('click',()=>M.command('custom wager'));row.append(custom);
 const label=M.node('label','','Inside bet');const select=M.node('select');select.setAttribute('aria-label','Roulette inside bet type');for(const [value,text]of [['straight','Single number'],['split','Split — tap two adjacent numbers'],['street','Street — tap any number in the street'],['corner','Corner — tap lowest corner number'],['sixline','Six-line — tap first street']]){const opt=M.node('option','',text);opt.value=value;opt.selected=value===d.mode;select.append(opt);}select.disabled=M.locked(r);select.addEventListener('change',()=>M.command('mode '+select.value));label.append(select);row.append(label);panel.append(row,M.node('p','casino-status',M.locked(r)?'WHEEL AND BALL SPINNING…':M.status(r)),M.node('p','','CHIP '+d.amount+' · PLACED '+total()+' / 1,000 Bolts. '+(d.pending!=null?'Tap an adjacent second number to finish the split.':'Tap the felt to place a bet. Outside positions always use their printed bet.')));
 const scroll=M.node('div','mc-roulette-mobile-scroll');const mobile=M.node('div','mc-roulette-mobile-table');mobile.style.backgroundImage='url("'+M.asset('casino/motel_roulette_background.png')+'")';fillSurface(mobile,true);showBets(mobile,true);scroll.append(mobile);panel.append(scroll);
 panel.append(M.node('p','mc-roulette-bet-list',d.bets.length?d.bets.map(b=>b.label+' '+b.amount).join(' · '):'No bets placed.'));
 const details=M.node('details'),summary=M.node('summary','','Payouts and controls');details.append(summary,M.node('p','','Single 35:1 · Split 17:1 · Street 11:1 · Corner 8:1 · Six-line 5:1 · Dozen/Column 2:1 · Red/Black, Odd/Even, Low/High 1:1. Winning stakes also return. Zero loses ordinary outside bets. Undo removes the last chip; Clear Bets returns all uncommitted chips.'));panel.append(details);
}
M.register('roulette',{title:'ROULETTE',art:'casino/motel_roulette_background.png',render,command,paint});
const style=M.node('style');style.textContent=`.mc-roulette-plane{position:absolute;left:19.4%;top:52.1%;width:31.6%;aspect-ratio:1;transform:translate(-50%,-50%) perspective(1000px) rotateX(56deg);z-index:1}.mc-roulette-rotor{display:block;width:100%;height:100%}.motel-casino-canvas>.mc-roulette-ball{width:4%;height:7.1%;transform:translate(-50%,-50%);z-index:2}.motel-casino-canvas>.mc-roulette-handle{left:9.4%;top:33%;width:20%;height:25%;z-index:3}.mc-roulette-felt{position:absolute;inset:0;pointer-events:none;z-index:4}.mc-roulette-cell{position:absolute;pointer-events:auto;padding:0;border:1px solid transparent;border-radius:2px;background:transparent;color:transparent;cursor:pointer;min-width:0;min-height:0}.r127-motel-casino .motel-casino-canvas .mc-roulette-cell{background:transparent!important;border:0!important;color:transparent!important;box-shadow:none!important;text-shadow:none!important}.r127-motel-casino .motel-casino-canvas .mc-roulette-cell:hover,.r127-motel-casino .motel-casino-canvas .mc-roulette-cell:focus-visible,.r127-motel-casino .motel-casino-canvas .mc-roulette-cell.pending{background:#ffda6a3d!important;outline:1px solid #f8e1a7!important}.mc-roulette-cell:hover,.mc-roulette-cell:focus-visible,.mc-roulette-cell.pending{background:#ffda6a3d;border-color:#f8e1a7;outline:1px solid #f8e1a7}.mc-roulette-chip{position:absolute;display:flex;align-items:center;justify-content:center;transform:translate(-50%,-50%);width:25px;height:25px;border-radius:50%;border:3px dashed #fff0c9;background:#933d25;box-shadow:1px 3px 4px #000b;color:#fff;font:bold 10px/1 system-ui;pointer-events:none;z-index:5}.mc-roulette-options{display:flex;flex-wrap:wrap;gap:4px;align-items:center}.mc-roulette-options button[aria-pressed=true]{outline:2px solid #e7ba63}.mc-roulette-options select{max-width:310px}.mc-roulette-bet-list{max-height:45px;overflow:auto}.mc-roulette-mobile-scroll{display:none;overflow:auto;width:100%;border:1px solid #967444}.mc-roulette-mobile-table{position:relative;width:720px;height:210px;background-size:1300px 731px;background-position:-530px -300px}.mc-roulette-mobile-table .mc-roulette-cell{color:#fff;font:700 15px Georgia;border-color:#b99a5f;background:#15482b}.mc-roulette-mobile-table .mc-roulette-cell.red{background:#7d201d}.mc-roulette-mobile-table .mc-roulette-cell.black{background:#181a18}.mc-roulette-mobile-table .mc-roulette-cell.pending{outline:3px solid #ffd16c}.mc-roulette-mobile-table .mc-roulette-chip{width:22px;height:22px;font-size:9px}@media(max-width:600px){.mc-roulette-mobile-scroll{display:block;min-height:225px}.mc-roulette-felt{display:none}.mc-roulette-options select{max-width:100%}.mc-roulette-options>button{font-size:12px;min-height:32px;padding:4px 6px}.motel-casino-panel:has(.mc-roulette-mobile-scroll){max-height:295px}.mc-roulette-options label{max-width:100%;display:flex;flex-direction:column;align-items:start}}`;document.head.append(style);
})();
