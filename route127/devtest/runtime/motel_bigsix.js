/* Six equally sized visible sectors. Uniform 1/6, 5x total return (4:1 net). */
(()=>{'use strict';if(!globalThis.MotelCasino)return;const M=MotelCasino;
const draft=()=>player.flags.motelBigSix||(player.flags.motelBigSix={pick:1});
const bets=['WAGER 10','WAGER 50','WAGER 100','WAGER 500','CUSTOM WAGER','BACK'];
function render(r){M.choices('BIG SIX — EACH NUMBER 1 IN 6 · WIN RETURNS 5× STAKE',r.custom?['BACK']:bets);}
function command(cmd,r){if(M.locked(r))return M.notice('The wheel is still spinning.');
 const pick=Number(cmd.match(/^pick ([1-6])$/)?.[1]);if(pick){draft().pick=pick;v49Autosave();return render(r);}
 if(cmd==='back'&&r.custom){delete r.custom;return render(r);}
 if(cmd==='custom wager'){if(r.status==='settled'){M.open('bigsix');r=M.round();}r.custom=true;return render(r);}
 const bet=cmd==='spin'?draft().bet:Number(cmd.match(/^(?:wager|bet) (\d+)$/)?.[1]||(r.custom&&/^\d+$/.test(cmd)?cmd:NaN));if(!Number.isSafeInteger(bet)||bet<1||bet>1000||bet>player.bolts)return M.notice('Enter an affordable whole wager from 1 to 1,000 Bolts.');
 if(cmd!=='spin'){draft().bet=bet;delete r.custom;v49Autosave();return render(r);}
 const from=r.wheelAngle||0;if(r.status==='settled'){M.open('bigsix');r=M.round();}
 const winner=1+Math.floor(Math.random()*6),jitter=(Math.random()-.5)*42,angle=from+2160+((-(winner-1)*60-from)%360+360)%360+jitter;
 M.commit(r,bet,{pick:draft().pick,winner,wheelFrom:from,wheelAngle:angle},winner===draft().pick?bet*5:0,'WINNING NUMBER '+winner+(winner===draft().pick?' — YOU WIN':' — NO MATCH'),4600);
}
function paint(canvas,panel,r){if(!r)return;
 if(!canvas.children.length){const wheel=M.node('img','mc-bigsix-wheel');wheel.src=M.asset('casino/motel_bigsix_wheel.png');wheel.alt='Six equally sized numbered wheel sectors';const pointer=M.node('img','mc-bigsix-pointer');pointer.src=M.asset('casino/motel_bigsix_pointer.png');pointer.alt='Stationary winning pointer';canvas.append(wheel,pointer);}
 const w=canvas.firstChild,signature=r.id+'|'+r.status;
 w.style.transform='rotate('+(r.wheelAngle||0)+'deg)';
 if(canvas.dataset.round!==signature){canvas.dataset.round=signature;if(r.status==='settled'&&M.liveAnimations.has(r.id)&&w.animate&&!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches)w.mcAnimation=w.animate([{transform:'rotate('+(r.wheelFrom||0)+'deg)'},{transform:'rotate('+r.wheelAngle+'deg)'}],{duration:4600,easing:'cubic-bezier(.42,0,.12,1)'});}
 if(!M.locked(r))w.mcAnimation?.cancel();
 const sig=signature+'|'+!!r.custom+'|'+draft().pick+'|'+draft().bet+'|'+M.locked(r);if(panel.dataset.state===sig)return;panel.dataset.state=sig;panel.replaceChildren();
 const label=M.node('label','','Your number');const select=M.node('select');select.setAttribute('aria-label','Big Six number');for(let n=1;n<=6;n++){const option=M.node('option','',n);option.value=String(n);option.selected=n===draft().pick;select.append(option);}select.disabled=M.locked(r);select.addEventListener('change',()=>M.command('pick '+select.value));label.append(select);const spin=M.node('button','','SPIN');spin.type='button';spin.disabled=!draft().bet||M.locked(r);spin.addEventListener('click',()=>M.command('spin'));panel.append(label,M.node('span','','Selected wager: '+(draft().bet||'none')+' Bolts '),spin,M.node('p','casino-status',M.locked(r)?'WHEEL SPINNING…':M.status(r)),M.node('p','','Six equally likely numbers. Winning return 5× stake (4:1 net). Expected return 83.333%; house edge 16.667%.'));
}
M.register('bigsix',{title:'BIG SIX WHEEL',art:'casino/motel_bigsix_background.png',render,command,paint});
const css=M.node('style');css.textContent='.motel-casino-canvas>.mc-bigsix-wheel{left:31.65%;top:15.6%;width:36.7%;height:auto;aspect-ratio:1;transform-origin:50% 50%;z-index:1}.motel-casino-canvas>.mc-bigsix-pointer{left:46.5%;top:8%;width:7%;height:15%;z-index:3;object-fit:contain}';document.head.append(css);
})();
