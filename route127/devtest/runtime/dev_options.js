/* Devtest-only Options: unlimited turns and wanderer art composition preview.
 * The preview never calls gameplay handlers, RNG, or persistence.
 * It does not affect Playtest, Production, or account/backend state. */
(() => {
  'use strict';
  if (globalThis.ROUTE127_ENV?.name !== 'DEVTEST' ||
      !/^\/route127\/devtest\/(?:index\.html)?$/.test(location.pathname)) return;
  if (typeof TravelerPanels === 'undefined' || typeof GraphicalUI === 'undefined') return;

  const REGIONS = ['CENTRAL','NORTH','WEST','INDUSTRIAL','LOWLANDS','SEAPORT','EAST'];
  const TOWNS = [
    {name:'Solace',file:'solace.png'},
    {name:'Seaport',file:'seaport.png'}
  ];
  // Owner-approved first forty wanderer portraits.
  const PORTRAITS = [
    {name:'Tess',file:'tess.png'},
    {name:'Patch',file:'patch.png'},
    {name:'Hollis',file:'hollis.png'},
    {name:'Rook',file:'rook.png'},
    {name:'June',file:'june.png'},
    {name:'Moss',file:'moss.png'},
    {name:'Kettle',file:'kettle.png'},
    {name:'Vera',file:'vera.png'},
    {name:'Deke',file:'deke.png'},
    {name:'Ash',file:'ash.png'},
    {name:'Bram',file:'bram.png'},
    {name:'Lark',file:'lark.png'},
    {name:'Flint',file:'flint.png'},
    {name:'Sable',file:'sable.png'},
    {name:'Cricket',file:'cricket.png'},
    {name:'Rowan',file:'rowan.png'},
    {name:'Harlow',file:'harlow.png'},
    {name:'Bolt',file:'bolt.png'},
    {name:'Crowley',file:'crowley.png'},
    {name:'Mercer',file:'mercer.png'},
    {name:'Finch',file:'finch.png'},
    {name:'Vale',file:'vale.png'},
    {name:'Bishop',file:'bishop.png'},
    {name:'Wren',file:'wren.png'},
    {name:'Cutter',file:'cutter.png'},
    {name:'Iona Pike',file:'iona_pike.png'},
    {name:'Cal Voss',file:'cal_voss.png'},
    {name:'Ada Quill',file:'ada_quill.png'},
    {name:'Merritt Shaw',file:'merritt_shaw.png'},
    {name:'Sabine Reed',file:'sabine_reed.png'},
    {name:'Orla Finch',file:'orla_finch.png'},
    {name:'Bex Calder',file:'bex_calder.png'},
    {name:'Nolan Rusk',file:'nolan_rusk.png'},
    {name:'Maeve Kline',file:'maeve_kline.png'},
    {name:'Galen Ward',file:'galen_ward.png'},
    {name:'Cora Bell',file:'cora_bell.png'},
    {name:'Dorian Hale',file:'dorian_hale.png'},
    {name:'Petra Sol',file:'petra_sol.png'},
    {name:'Soren Beck',file:'soren_beck.png'},
    {name:'Leda Marsh',file:'leda_marsh.png'}
  ];
  const playtestRoot = new URL('../playtest/', document.baseURI);
  const devtestRoot = new URL('../devtest/', document.baseURI);
  const regionUrl = region => new URL('../assets/regions/'+region.toLowerCase()+'.png', playtestRoot).href;
  const townUrl = town => new URL('assets/locations/'+town.file, playtestRoot).href;
  const portraitUrl = w => new URL('assets/wanderers/'+w.file, devtestRoot).href;
  const el = (tag,cls,text) => {
    const node=document.createElement(tag);
    if(cls)node.className=cls;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const addStyle=()=>{
    if(document.getElementById('dev-wanderer-preview-style'))return;
    const style=el('style');style.id='dev-wanderer-preview-style';
    style.textContent=`
      .dw-preview{border:1px solid #8f7356;background:#181411;color:#eee2cb;padding:14px;max-width:min(1000px,95vw);max-height:92vh;overflow:auto;box-shadow:0 18px 75px #000c}
      .dw-preview::backdrop{background:#000c}
      .dw-head{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:12px}
      .dw-head h2{margin:0;font:700 1.2rem Georgia,serif;letter-spacing:.07em;color:#edc48a}
      .dw-close,.dw-controls select{font:inherit;background:#31271f;color:#f4e1c5;border:1px solid #9d8060;padding:8px 11px}
      .dw-controls{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px}
      .dw-controls label{display:grid;gap:5px;font-size:.83rem;letter-spacing:.03em}
      .dw-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
      .dw-figure{margin:0;min-width:0}
      .dw-figure figcaption{padding:7px 0 9px;font-weight:bold}
      .dw-scene{position:relative;overflow:hidden;isolation:isolate;aspect-ratio:16/9;background:linear-gradient(115deg,#38352d,#171d21);border:2px solid #635340}
      .dw-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
      .dw-location{position:absolute;bottom:6%;left:4%;z-index:3;max-width:50%;background:#100e0cc9;border:1px solid #8e704c;padding:5px 9px;font:700 .75rem Georgia,serif;text-shadow:0 1px 2px black}
      .dw-person{position:absolute;bottom:0;right:var(--dw-road-person-right,15%);height:95%;max-width:56%;object-fit:contain;object-position:bottom center;filter:drop-shadow(0 5px 5px #0008);z-index:2}
      .dw-frame{position:absolute;right:3%;bottom:4%;height:28%;aspect-ratio:3/4;max-width:18%;border:2px ridge #a08051;box-shadow:0 4px 12px #000c;background:#201913;z-index:3;overflow:hidden}
      .dw-frame .dw-person{height:calc(100% - 18px);width:100%;max-width:none;right:0;bottom:18px;object-fit:contain}
      .dw-name{position:absolute;bottom:0;left:0;right:0;background:#18130f;text-align:center;font:700 .56rem Georgia,serif;padding:3px 2px;white-space:nowrap}
      .dw-missing{position:absolute;z-index:2;right:10%;bottom:12%;width:36%;text-align:center;background:#211912d9;color:#f3d09b;border:1px dashed #bea179;padding:12px 3px;font-size:.75rem}
      .dw-frame .dw-missing{right:5%;bottom:24px;width:90%;padding:3px 1px;font-size:.52rem}
      .dw-note{font-size:.84rem;line-height:1.5;color:#cfc0aa;margin:12px 0 0}
      @media(max-width:760px){.dw-grid{grid-template-columns:1fr}.dw-preview{width:95vw}.dw-scene{aspect-ratio:16/9}}
    `;
    document.head.appendChild(style);
  };

  function showPortraitPreview(){
    addStyle();
    const dialog=el('dialog','dw-preview');
    dialog.setAttribute('aria-label','Devtest Wanderer Portrait Preview');
    const header=el('div','dw-head'),title=el('h2','','WANDERER PORTRAIT PREVIEW');
    const close=el('button','dw-close','X — Close');close.type='button';
    close.addEventListener('click',()=>dialog.close());
    header.append(title,close);dialog.appendChild(header);

    const controls=el('div','dw-controls');
    function dropdown(labelText,items){
      const wrap=el('label','',labelText),select=el('select');
      for(const item of items){const option=el('option','',typeof item==='string'?item:item.name);option.value=typeof item==='string'?item:item.name;select.appendChild(option);}
      wrap.appendChild(select);controls.appendChild(wrap);return select;
    }
    const personSelect=dropdown('Wanderer',PORTRAITS);
    const regionSelect=dropdown('Road region',REGIONS);
    const townSelect=dropdown('Town',TOWNS);
    dialog.appendChild(controls);

    const grid=el('div','dw-grid');
    function scene(label){
      const fig=el('figure','dw-figure'),caption=el('figcaption','',label),canvas=el('div','dw-scene'),bg=el('img','dw-bg'),locationPlate=el('span','dw-location');
      bg.alt='';canvas.append(bg,locationPlate);fig.append(caption,canvas);grid.appendChild(fig);
      return {canvas,bg,locationPlate};
    }
    const road=scene('ROAD ENCOUNTER — full transparent figure');
    const town=scene('TOWN ENCOUNTER — small bottom-right portrait');
    dialog.appendChild(grid);
    dialog.appendChild(el('p','dw-note','Preview only: browse the twenty approved wanderer portraits over existing regional and town backgrounds. No encounters, turns, recruitment, saves, or gameplay state are changed.'));

    function placePortrait(canvas,w,framed){
      canvas.querySelectorAll('.dw-person,.dw-frame,.dw-missing').forEach(node=>node.remove());
      const holder=framed?el('div','dw-frame'):canvas;
      const img=el('img','dw-person');img.alt=w.name;
      const missing=el('div','dw-missing','Portrait artwork pending');
      img.addEventListener('load',()=>{missing.remove();img.hidden=false;});
      img.addEventListener('error',()=>{img.hidden=true;if(!missing.isConnected)holder.appendChild(missing);});
      img.hidden=true;holder.appendChild(missing);holder.appendChild(img);
      if(framed){holder.appendChild(el('div','dw-name',w.name));canvas.appendChild(holder);}
      img.src=portraitUrl(w);
    }
    function update(){
      const wanderer=PORTRAITS.find(w=>w.name===personSelect.value)||PORTRAITS[0];
      const location=TOWNS.find(t=>t.name===townSelect.value)||TOWNS[0];
      // Four region compositions place their roads further left. Keep all others untouched.
      const roadRightByRegion={CENTRAL:'25%',NORTH:'25%',WEST:'25%',SEAPORT:'25%'};
      road.canvas.style.setProperty('--dw-road-person-right',roadRightByRegion[regionSelect.value]||'15%');
      road.bg.src=regionUrl(regionSelect.value);road.locationPlate.textContent=regionSelect.value+' REGION';
      town.bg.src=townUrl(location);town.locationPlate.textContent=location.name;
      placePortrait(road.canvas,wanderer,false);placePortrait(town.canvas,wanderer,true);
    }
    for(const select of [personSelect,regionSelect,townSelect])select.addEventListener('change',update);
    dialog.addEventListener('close',()=>dialog.remove(),{once:true});
    document.body.appendChild(dialog);update();dialog.showModal();close.focus();
  }

  const originalOptions=TravelerPanels.options;
  TravelerPanels.options=function(...args){
    const result=originalOptions.apply(this,args);
    if(this.which!=='options'||!this.body)return result;
    const panel=this.body.querySelector('.traveler-detail');
    if(!panel)return result;
    const close=[...panel.querySelectorAll('button')].find(btn=>btn.textContent==='Close');
    const turns=this.button('Unlimited Turns: '+(testMode?'ON':'OFF'),()=>{
      testMode=!testMode;
      updateHud();
      if(typeof updateRefillDisplay==='function')updateRefillDisplay();
      turns.textContent='Unlimited Turns: '+(testMode?'ON':'OFF');
      turns.setAttribute('aria-pressed',String(testMode));
    });
    turns.dataset.devtestUnlimited='true';
    turns.setAttribute('aria-pressed',String(testMode));
    const preview=this.button('Wanderer Portrait Preview',showPortraitPreview);
    preview.dataset.devtestWandererPreview='true';
    panel.insertBefore(turns,close||null);
    panel.insertBefore(preview,close||null);
    return result;
  };
})();
