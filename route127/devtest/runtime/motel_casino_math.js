/* Pure, testable rules for the Lounge's new games. No money or UI mutations. */
(()=>{'use strict';
const kenoTable={2:{2:11},3:{2:2,3:27},4:{2:1,3:5,4:72},5:{3:2,4:18,5:410},6:{3:1,4:7,5:57,6:1100},7:{3:1,4:5,5:11,6:100,7:2000},8:{4:2,5:15,6:50,7:300,8:10000},9:{4:2,5:5,6:20,7:100,8:2000,9:25000},10:{0:5,5:2,6:10,7:50,8:500,9:5000,10:100000}};
function draw(count,max=80,rng=Math.random){if(!Number.isInteger(count)||count<0||count>max)throw Error('Invalid draw count');const pool=Array.from({length:max},(_,i)=>i+1);for(let i=0;i<count;i++){const j=i+Math.floor(rng()*(max-i));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,count);}
function ticket(numbers){return Array.isArray(numbers)&&numbers.length>=2&&numbers.length<=10&&new Set(numbers).size===numbers.length&&numbers.every(n=>Number.isInteger(n)&&n>=1&&n<=80);}
function keno(numbers,drawn,bet){if(!ticket(numbers)||!Array.isArray(drawn)||drawn.length!==20||new Set(drawn).size!==20||!drawn.every(n=>Number.isInteger(n)&&n>=1&&n<=80)||!Number.isSafeInteger(bet)||bet<1)throw Error('Invalid Keno ticket, draw or wager');const hits=numbers.filter(n=>drawn.includes(n)).length;return {hits,payout:(kenoTable[numbers.length][hits]||0)*bet};}
function choose(n,k){if(k<0||k>n)return 0;let c=1;for(let i=1;i<=k;i++)c=c*(n-i+1)/i;return c;}
function kenoProbability(spots,hits){return choose(20,hits)*choose(60,spots-hits)/choose(80,spots);}
function kenoReturn(spots){return Array.from({length:spots+1},(_,h)=>kenoProbability(spots,h)*(kenoTable[spots][h]||0)).reduce((a,b)=>a+b,0);}
const wheel=[0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const reds=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
function rouletteBet(type,value,amount){
 if(!Number.isSafeInteger(amount)||amount<1||amount>1000)throw Error('Wager must be 1–1,000 whole Bolts');let numbers,mult,label;
 const range=(a,n)=>Array.from({length:n},(_,i)=>a+i),integer=(a,b)=>Number.isInteger(value)&&value>=a&&value<=b;
 if(type==='straight'&&integer(0,36)){numbers=[value];mult=36;label='Number '+value;}
 if(type==='split'&&Array.isArray(value)&&value.length===2&&new Set(value).size===2&&value.every(n=>Number.isInteger(n)&&n>=0&&n<=36)){
  const [a,b]=[...value].sort((a,b)=>a-b);if(a===0&&b<=3||a>0&&(b-a===3||b-a===1&&Math.floor((a-1)/3)===Math.floor((b-1)/3))){numbers=[a,b];value=numbers;mult=18;label='Split '+numbers.join('/');}
 }
 if(type==='street'&&integer(1,34)&&value%3===1){numbers=range(value,3);mult=12;label='Street '+value+'–'+(value+2);}
 if(type==='corner'&&integer(1,32)&&value%3!==0){numbers=[value,value+1,value+3,value+4];mult=9;label='Corner '+numbers.join('/');}
 if(type==='sixline'&&integer(1,31)&&value%3===1){numbers=range(value,6);mult=6;label='Six-line '+value+'–'+(value+5);}
 if(type==='dozen'&&integer(1,3)){numbers=range((value-1)*12+1,12);mult=3;label='Dozen '+value;}
 if(type==='column'&&integer(1,3)){numbers=range(1,36).filter(n=>(n-1)%3===value-1);mult=3;label='Column '+value;}
 if(['red','black','odd','even','low','high'].includes(type)){numbers=range(1,36).filter(n=>type==='red'?reds.has(n):type==='black'?!reds.has(n):type==='odd'?n%2===1:type==='even'?n%2===0:type==='low'?n<=18:n>=19);mult=2;label={red:'Red',black:'Black',odd:'Odd',even:'Even',low:'1–18',high:'19–36'}[type];value=null;}
 if(!numbers)throw Error('Select a valid '+type+' betting position');return {type,value,amount,numbers,mult,label};
}
function roulette(bets,winner){if(!Number.isInteger(winner)||winner<0||winner>36||!Array.isArray(bets)||!bets.length)throw Error('Choose valid bets before spinning');const canonical=bets.map(b=>rouletteBet(b.type,b.value,b.amount)),stake=canonical.reduce((a,b)=>a+b.amount,0);if(stake>1000)throw Error('Combined wager exceeds 1,000 Bolts');return {stake,payout:canonical.reduce((a,b)=>a+(b.numbers.includes(winner)?b.amount*b.mult:0),0)};}
globalThis.MotelCasinoMath={wheel,reds,rouletteBet,roulette,kenoTable,draw,ticket,keno,choose,kenoProbability,kenoReturn};
})();
