/* Existing number-board artwork with an accessible, editable paper ticket. */
(()=>{'use strict';if(!globalThis.MotelCasino)return;const M=MotelCasino,K=MotelCasinoMath;
const draft=()=>player.flags.motelKeno||(player.flags.motelKeno={spots:2,numbers:[null,null],version:0});
function render(r){M.choices('KENO — 20 NUMBERS DRAWN FROM 1–80',r.custom?['BACK']:['WAGER 10','WAGER 50','WAGER 100','WAGER 500','CUSTOM WAGER','BACK']);}
function command(cmd,r){if(M.locked(r))return M.notice('The Keno drawing is still underway.');const d=draft();
 const spots=Number(cmd.match(/^spots (\d+)$/)?.[1]);if(spots>=2&&spots<=10){d.spots=spots;d.numbers=Array.from({length:spots},(_,i)=>d.numbers[i]??null);d.version++;v49Autosave();return render(r);}
 if(cmd==='quick pick'){d.numbers=K.draw(d.spots);d.version++;v49Autosave();return render(r);}
 if(cmd==='clear ticket'){d.numbers=Array(d.spots).fill(null);d.version++;v49Autosave();return render(r);}
 if(cmd.startsWith('ticket ')){const numbers=cmd.slice(7).trim().split(/\s+/).map(Number);if(!K.ticket(numbers))return M.notice('Choose 2–10 unique whole numbers from 1 to 80.');d.spots=numbers.length;d.numbers=numbers;d.version++;v49Autosave();return render(r);}
 if(cmd==='back'&&r.custom){delete r.custom;return render(r);}
 if(cmd==='custom wager'){if(r.status==='settled'){M.open('keno');r=M.round();}r.custom=true;return render(r);}
 const bet=Number(cmd.match(/^(?:wager|bet) (\d+)$/)?.[1]||(r.custom&&/^\d+$/.test(cmd)?cmd:NaN));if(!K.ticket(d.numbers)||d.numbers.length!==d.spots)return M.notice('Choose '+d.spots+' unique whole numbers from 1 to 80 before wagering.');
 if(!Number.isSafeInteger(bet)||bet<1||bet>1000||bet>player.bolts)return M.notice('Enter an affordable whole wager from 1 to 1,000 Bolts.');
 if(r.status==='settled'){M.open('keno');r=M.round();}const numbers=[...d.numbers],draw=K.draw(20),result=K.keno(numbers,draw,bet);
 M.commit(r,bet,{ticket:numbers,draw,hits:result.hits},result.payout,result.hits+' OF '+numbers.length+' MATCHED — '+(result.payout?'YOU WIN':'NO WIN'),3400);
}
function paint(canvas,panel,r){if(!r)return;const d=draft(),selected=M.locked(r)?r.ticket:d.numbers;
 if(!canvas.children.length){const cells=M.node('div','mc-keno-cells');for(let n=1;n<=80;n++){const cell=M.node('span');cell.dataset.number=String(n);cells.append(cell);}canvas.append(cells);}
 const signature=r.id+'|'+r.status+'|'+selected.join(',');if(canvas.dataset.round!==signature){canvas.dataset.round=signature;
  for(const cell of canvas.firstChild.children){const n=Number(cell.dataset.number),chosen=selected.includes(n),drawn=r.draw?.includes(n),hit=chosen&&drawn;
   cell.className=chosen?'selected':'';cell.classList.toggle('drawn',!!drawn);cell.classList.toggle('match',!!hit);cell.style.animation='';cell.style.setProperty('--before',chosen?'#2675ce55':'transparent');cell.setAttribute('aria-label','Number '+n+(hit?', matching':drawn?', drawn':chosen?', selected':''));
   if(drawn&&M.liveAnimations.has(r.id)&&!window.matchMedia?.('(prefers-reduced-motion:reduce)').matches)cell.style.animation='mc-keno-draw 1ms step-end '+(r.draw.indexOf(n)*160)+'ms both';
  }
 }
 if(!M.locked(r))for(const cell of canvas.firstChild.children)cell.style.animation='';
 const state=r.id+'|'+r.status+'|'+d.spots+'|'+d.version+'|'+M.locked(r);if(panel.dataset.state===state)return;panel.dataset.state=state;panel.replaceChildren();
 const form=M.node('form','mc-keno-ticket');form.addEventListener('submit',event=>event.preventDefault());const label=M.node('label','','SPOTS');const select=M.node('select');select.setAttribute('aria-label','Keno spot count');for(let n=2;n<=10;n++){const o=M.node('option','',n);o.value=String(n);o.selected=n===d.spots;select.append(o);}select.disabled=M.locked(r);select.addEventListener('change',()=>M.command('spots '+select.value));label.append(select);form.append(label);
 const fields=M.node('div','mc-keno-fields');for(let i=0;i<d.spots;i++){const field=M.node('input');field.type='number';field.min='1';field.max='80';field.step='1';field.inputMode='numeric';field.value=d.numbers[i]??'';field.setAttribute('aria-label','Keno number '+(i+1));field.disabled=M.locked(r);field.classList.toggle('hit',r.ticket?.[i]===d.numbers[i]&&r.draw?.includes(d.numbers[i]));field.addEventListener('input',()=>{d.numbers[i]=field.value===''?null:Number(field.value);});fields.append(field);}form.append(fields);
 for(const [label,cmd]of [['Quick Pick','quick pick'],['Clear Ticket','clear ticket']]){const b=M.node('button','',label);b.type='button';b.disabled=M.locked(r);b.addEventListener('click',()=>M.command(cmd));form.append(b);}panel.append(form);
 panel.append(M.node('p','casino-status',M.locked(r)?'DRAWING 20 NUMBERS…':M.status(r)),M.node('p','','BLUE selected · AMBER drawn · GREEN matching. Total returns per Bolt wagered:'));
 const table=M.node('table'),head=M.node('tr'),values=M.node('tr');head.append(M.node('th','','Matches'));values.append(M.node('th','','Return'));
 for(let h=0;h<=d.spots;h++){head.append(M.node('th','',h));values.append(M.node('td','',(K.kenoTable[d.spots][h]||0)+'×'));}table.append(head,values);panel.append(table);
}
M.register('keno',{title:'KENO',art:'casino/motel_keno_board.png',render,command,paint});
const style=M.node('style');style.textContent=`.mc-keno-cells{position:absolute;left:6.1%;top:17.5%;width:88.7%;height:75.1%;display:grid;grid-template-columns:repeat(10,1fr);grid-template-rows:repeat(8,1fr);gap:2px}.mc-keno-cells span{border-radius:3px}.mc-keno-cells .selected{background:#2675ce55;box-shadow:inset 0 0 10px #4aa6ff}.mc-keno-cells .drawn{background:#dd8f1555;box-shadow:inset 0 0 12px #ffb83d;--light:#dd8f1555}.mc-keno-cells .match{background:#229b475e;box-shadow:inset 0 0 12px #76ff8a;--light:#229b475e}.mc-keno-ticket{background:#d4bf96;color:#302519;padding:7px;border:2px dashed #806645;box-shadow:inset 0 0 14px #6c4b3b44}.mc-keno-fields{display:inline-flex;flex-wrap:wrap;gap:4px;vertical-align:middle}.mc-keno-fields input{width:48px!important;color:#261e16!important;background:#efe1bd!important;border:1px solid #886b45!important}.mc-keno-fields input.hit{background:#8dc991!important}.mc-keno-ticket button{margin:3px}.mc-keno-ticket select{margin-right:6px}@keyframes mc-keno-draw{from{background:var(--before);box-shadow:none}to{background:var(--light);box-shadow:inset 0 0 12px #ffd47f}}`;document.head.append(style);
})();
