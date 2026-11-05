/* WO31: Devtest-only display formatting. Never change persistence or commands. */
(function(){
 'use strict';
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST'||typeof RouteIdentity==='undefined')return;
 const suffix=/\s*(?:[-–—|:]\s*)?(?:\[|\()?\s*(?:Forge[ _-]*)?(?:Common|Uncommon|Rare|Epic|Legendary)[ _-]*\d+(?:\s*[\])])?(?=\s|$|[—–,:])/gi;
 const F={
  clean(value){return PlaythroughRepairs.cleanLabel(String(value)).replace(suffix,'').trim();},
  index:null,
  equipment(){
   if(this.index)return this.index;
   const index=new Map();
   // Generated and catalog instances are deliberately non-enumerable in GEAR.
   const names=Object.getOwnPropertyNames(GEAR).sort((a,b)=>b.length-a.length);
   for(const raw of names){const g=GEAR[raw];if(!g?.rarity)continue;
    for(const name of new Set([raw,this.clean(raw)])){
     const word=name.match(/\w+/)?.[0]?.toUpperCase();if(!word)continue;
     const list=index.get(word)||[];
     if(!list.some(x=>x.name.toUpperCase()===name.toUpperCase()))list.push({name,kind:g.rarity});
     index.set(word,list);
    }
   }
   for(const list of index.values())list.sort((a,b)=>b.name.length-a.name.length);
   return this.index=index;
  },
  title(value){
   const small=new Set(['a','an','and','as','at','but','by','for','in','of','on','or','the','to','via','with']);
   const acronyms=new Set(['HP','XP','DMG','DEF','NPC','BBS','RPS','LV','ID','QA','UI','OK']);
   let result=String(value).replace(/[A-Za-z][A-Za-z0-9]*(?:['’][A-Za-z]+)*/g,(word,at,text)=>{
    if(acronyms.has(word.toUpperCase()))return word.toUpperCase();
    // Preserve established mixed-case terminology and numbered names.
    if(/[a-z]/.test(word)&&/[A-Z]/.test(word.slice(1))||/\d/.test(word))return word;
    const lower=word.toLowerCase();return small.has(lower)&&at>0&&/[A-Za-z]/.test(text.slice(at+word.length))&&!/[—–:!?]\s*$/.test(text.slice(0,at))?lower:lower[0].toUpperCase()+lower.slice(1);
   });
   // Restore canonical spelling for proper names and established item terms.
   const names=this.properNames||(this.properNames=[...RouteIdentity.people().map(p=>p.name),...EQUIPMENT_CATALOG.map(g=>g.name),...Object.values(ROUTE127_ART).map(a=>a.title)].sort((a,b)=>b.length-a.length));
   for(const name of names)result=result.replace(new RegExp('\\b'+RouteIdentity.escape(name)+'\\b','gi'),name);
   return result;
  },
  paint(node,raw){
   const text=RouteIdentity.display(String(raw)),upper=text.toUpperCase(),ranges=[];
   // Match the full internal instance before stripping its label. Rarity comes
   // from that exact definition, never a visible suffix or a substring match.
   for(const m of upper.matchAll(/\b\w+/g)){
    const item=this.equipment().get(m[0])?.find(g=>upper.startsWith(g.name.toUpperCase(),m.index)&&!/[A-Z0-9]/.test(upper[m.index+g.name.length]||''));
    if(item){let end=m.index+item.name.length;const badge=text.slice(end).match(/^\s*\[(?:COMMON|UNCOMMON|RARE|EPIC|LEGENDARY)\]/i);if(badge)end+=badge[0].length;
     ranges.push({start:m.index,end,kind:item.kind,label:this.clean(item.name)});
    }
   }
   // Reuse established person-context rules, but discard the old equipment and
   // visible-rarity guesses. Equipment takes priority over a person substring.
   for(const r of RouteIdentity.ranges(text))if(['npc','wanderer'].includes(r.kind)&&!ranges.some(g=>r.start<g.end&&r.end>g.start))ranges.push(r);
   ranges.sort((a,b)=>a.start-b.start||b.end-a.end);
   node.replaceChildren();let at=0;
   for(const r of ranges){if(r.start<at)continue;if(r.start>at)node.appendChild(document.createTextNode(this.cleanFragment(text.slice(at,r.start))));
    const span=document.createElement('span');span.className='route-color-'+r.kind;span.textContent=r.label??text.slice(r.start,r.end);node.appendChild(span);at=r.end;
   }
   if(at<text.length)node.appendChild(document.createTextNode(this.cleanFragment(text.slice(at))));
  },
  cleanFragment(text){return text.replace(suffix,'');},
  buttons(root){if(!root)return;for(const b of root.querySelectorAll('button')){
   const walk=n=>{for(const c of [...n.childNodes]){if(c.nodeType===3)c.textContent=this.title(c.textContent);else if(!c.classList?.contains('gfx-choice-key')&&!/^route-color-/.test(c.className||''))walk(c);}};
   walk(b);
  }}
 };
 globalThis.DevtestPresentation=F;
 const paint=RouteIdentity.paint;
 RouteIdentity.paint=function(node,raw){return this.graphical()?F.paint(node,raw):paint.call(this,node,raw);};
 const choices=GraphicalUI.choices;
 GraphicalUI.choices=function(){const rows=choices.call(this);return this.preference()==='graphics'?rows.map(c=>({...c,presentationSource:c.label,label:F.title(F.clean(c.label))})):rows;};
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){const result=sync.apply(this,args);if(this.preference()==='graphics'){
  const rows=this.choices();
  for(const [i,button] of [...(this.element?.choices?.children||[])].entries()){
   const label=button.querySelector('.gfx-choice-label');
   if(label&&rows[i])F.paint(label,F.title(rows[i].presentationSource??rows[i].label));
  }
  F.buttons(this.element?.frame);
 }return result;};
 const render=TravelerPanels.render;
 TravelerPanels.render=function(...args){const result=render.apply(this,args);if(RouteIdentity.graphical())F.buttons(this.body);return result;};
 const style=document.createElement('style');style.textContent=`
 body.full-graphics .gfx-nav-button,body.full-graphics .gfx-frame button,
 body.full-graphics .traveler-overlay button {text-transform:none!important}
 body.full-graphics .route-color-common {color:#ffffff!important}
 body.full-graphics .route-color-uncommon {color:#65c77b!important}
 body.full-graphics .route-color-rare {color:#78afff!important}
 body.full-graphics .route-color-epic {color:#b68cdd!important}
 body.full-graphics .route-color-legendary {color:#e39a51!important}`;
 document.head.appendChild(style);
})();
