/* Presentation identities stay separate from the original save keys and commands. */
const RouteIdentity={
 npc:{Tim:'Tim Mercer',Jen:'Jen Holloway',Johnny:'Johnny Briggs',Murphy:'Murphy Keane',Wayne:'Wayne Barrett',Amii:'Amii Sato',Mia:'Mia Torres',Nessa:'Nessa Quinn',Kaiden:'Kaiden Shaw',Forge:'Forge Maddox',Mara:'Mara Voss','Crazy Steve':'Crazy Steve Calloway'},
 wanderer:{Tess:'Tess Arden',Patch:'Patch Hensley',Hollis:'Hollis Crane',Rook:'Rook Bennett',June:'June Whitaker',Moss:'Moss Ellery',Kettle:'Kettle Dawson',Vera:'Vera Holt',Deke:'Deke Talbot',Ash:'Ash Merrick',Bram:'Bram Prescott',Lark:'Lark Sutton',Flint:'Flint Carver',Sable:'Sable Monroe',Cricket:'Cricket Hayes',Rowan:'Rowan Beckett',Harlow:'Harlow Pierce',Bolt:'Bolt Ramsey',Crowley:'Crowley Nash',Mercer:'Mercer Dalton',Finch:'Finch Avery',Vale:'Vale Kendrick',Bishop:'Bishop Langley',Wren:'Wren Foster',Cutter:'Cutter Raines'},
 rows:new Map(),gearIndex:null,
 graphical(){return GraphicalUI.preference()==='graphics';},
 escape(s){return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');},
 people(){return [...Object.entries(this.npc).map(([key,name])=>({key,name,kind:'npc'})),...wanderers.map(w=>({key:w.name,name:this.wanderer[w.name]||w.name,kind:'wanderer'}))].sort((a,b)=>b.name.length-a.name.length);},
 // Only expand ambiguous short handles where the text identifies a person.
 personContext(text,start,end){const before=text.slice(0,start),after=text.slice(end);return /^\s*(?:>|\(?\d+\)?[.)\-:]?\s*)?$/.test(before)&&/^(?:\s*(?:>|\[|—|–|:|\(|$)|\s+(?:LV|Level|is here|stands|offers|asks|says)\b)/i.test(after)||/\b(?:talk(?: to)?|speak(?: to)?|meet|hire|inspect|dismiss|recruit|companion|wanderer|assigned to|visit)\s*[:—-]?\s*$/i.test(before)||/—\s*$/.test(before)&&/^\s*—\s*(?:LV|WANDERER)/i.test(after);},
 display(text){let value=String(text);for(const p of this.people()){
  if(p.key===p.name)continue;
  const re=new RegExp('\\b'+this.escape(p.key)+'\\b','gi');
  value=value.replace(re,(match,offset)=>{
   if(value.slice(offset,offset+p.name.length).toLowerCase()===p.name.toLowerCase())return match;
   if(!this.personContext(value,offset,offset+match.length))return match;
   return match===match.toUpperCase()?p.name.toUpperCase():p.name;
  });
 }return value;},
 ranges(text){const ranges=[],upper=text.toUpperCase();
  for(const p of this.people())for(const name of new Set([p.name,p.key])){
   const re=new RegExp('\\b'+this.escape(name)+'\\b','gi');let m;
   while((m=re.exec(text))){if(name!==p.name&&!this.personContext(text,m.index,m.index+m[0].length)&&!(p.kind==='npc'&&p.key!=='Forge'&&m[0][0]===m[0][0].toUpperCase()))continue;ranges.push({start:m.index,end:m.index+m[0].length,kind:p.kind});}
  }
  if(!this.gearIndex){this.gearIndex=new Map();for(const [raw,g]of [...Object.entries(GEAR),...['Wild Honey','Old World Pocket Compass','Pre-War Silver Coin'].map(n=>[n,{rarity:'uncommon'}])]){const name=PlaythroughRepairs.cleanLabel(raw);const word=name.toUpperCase().match(/\w+/)?.[0];if(!word)continue;const list=this.gearIndex.get(word)||[];list.push({name:name.toUpperCase(),kind:g.rarity});this.gearIndex.set(word,list);}for(const list of this.gearIndex.values())list.sort((a,b)=>b.name.length-a.name.length);}
  for(const m of upper.matchAll(/\b\w+/g)){const item=this.gearIndex.get(m[0])?.find(g=>upper.startsWith(g.name,m.index)&&!/[A-Z0-9]/.test(upper[m.index+g.name.length]||''));if(item)ranges.push({start:m.index,end:m.index+item.name.length,kind:item.kind});}
  // Explicit rarity labels also cover quest supplies outside the equipment catalog.
  for(const m of text.matchAll(/\[?(UNCOMMON|RARE|EPIC|LEGENDARY)\]?/gi))ranges.push({start:m.index,end:m.index+m[0].length,kind:m[1].toLowerCase()});
  return ranges.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));
 },
 paint(node,raw){const text=this.display(raw),ranges=this.ranges(text);node.replaceChildren();let at=0;for(const r of ranges){if(r.start<at)continue;if(r.start>at)node.appendChild(document.createTextNode(text.slice(at,r.start)));const span=document.createElement('span');span.className='route-color-'+r.kind;span.textContent=text.slice(r.start,r.end);node.appendChild(span);at=r.end;}if(at<text.length)node.appendChild(document.createTextNode(text.slice(at)));},
 renderRow(node,text,cls){if(/casino-art|v48-art|title-logo|r5-tone-|r11-card|r11-die/.test(cls))return identityPreviousEvolution(node,text,cls);if(this.graphical())this.paint(node,text);else identityPreviousEvolution(node,this.display(text),cls);},
 decorate(root){if(!root)return;for(const node of [...root.children]){if(/^(INPUT|TEXTAREA|SELECT|SVG|IMG)$/.test(node.tagName)||/\broute-color-/.test(node.className))continue;if(node.children.length)this.decorate(node);else if(node.textContent)this.paint(node,node.textContent);}},
 sync(){for(const node of this.rows.keys())if(!node.isConnected)this.rows.delete(node);const mode=this.graphical();if(this.lastMode!==mode){for(const [node,row]of this.rows){if(!node.isConnected){this.rows.delete(node);continue;}this.renderRow(node,row.text,row.cls);}this.lastMode=mode;}if(mode)this.decorate(GraphicalUI.element?.choices);}
};
const identityPreviousEvolution=applyLevelEvolution;
applyLevelEvolution=function(node,text,cls=''){RouteIdentity.rows.set(node,{text:String(text),cls});RouteIdentity.renderRow(node,String(text),cls);};
const identitySync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const result=identitySync.apply(this,args);RouteIdentity.sync();return result;};
const identityPanelRender=TravelerPanels.render;
TravelerPanels.render=function(...args){const result=identityPanelRender.apply(this,args);if(RouteIdentity.graphical())RouteIdentity.decorate(this.body);return result;};
// Accept full names in identity lookup while retaining the original persistence key.
const identityWandererLookup=wandererByName;
wandererByName=function(name){const short=Object.keys(RouteIdentity.wanderer).find(key=>RouteIdentity.wanderer[key].toLowerCase()===String(name).toLowerCase());return identityWandererLookup(short||name);};
