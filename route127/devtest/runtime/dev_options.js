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
  // Owner-approved first fifty wanderer portraits.
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
    {name:'Leda Marsh',file:'leda_marsh.png'},
    {name:'Ansel Crow',file:'ansel_crow.png'},
    {name:'Freya Dunn',file:'freya_dunn.png'},
    {name:'Otis Weller',file:'otis_weller.png'},
    {name:'Veda Knox',file:'veda_knox.png'},
    {name:'Silvie Hart',file:'silvie_hart.png'},
    {name:'Tobin Flint',file:'tobin_flint.png'},
    {name:'Elara Moss',file:'elara_moss.png'},
    {name:'Hector Vale',file:'hector_vale.png'},
    {name:'Nadia Rill',file:'nadia_rill.png'},
    {name:'Rhea Tarrant',file:'rhea_tarrant.png'}
  ];
  const playtestRoot = new URL('../playtest/', document.baseURI);
  const devtestRoot = new URL('../devtest/', document.baseURI);
  const regionUrl = region => new URL('../assets/regions/'+region.toLowerCase()+'.png', playtestRoot).href;
  const townUrl = town => new URL('assets/locations/'+town.file, playtestRoot).href;
  const portraitUrl = w => new URL('assets/wanderers/'+w.file, devtestRoot).href;
  const shortName = name => { const parts=name.trim().split(/\s+/); return parts.length>1 ? parts[0]+' '+parts.at(-1)[0]+'.' : name; };
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
      .dw-frame{position:absolute;right:3%;bottom:4%;height:28%;aspect-ratio:3/4;max-width:18%;border:2px ridge #a08051;box-shadow:0 4px 12px #000c;background:#201913;z-index:3;overflow:hidden;cursor:zoom-in}
      .dw-frame .dw-person{height:calc(100% - 18px);width:100%;max-width:none;right:0;bottom:18px;object-fit:contain}
      .dw-name{position:absolute;bottom:0;left:0;right:0;background:#18130f;color:#f3e0b8;text-align:center;font:700 clamp(5px,.48rem,8px) Georgia,serif;padding:3px 1px;white-space:nowrap;overflow:hidden;z-index:4}
      .dw-frame:focus-visible{outline:2px solid #edc48a;outline-offset:2px}
      .dw-expanded{border:1px solid #a08051;background:#18130f;color:#f3e0b8;padding:12px;max-width:min(480px,90vw);max-height:90vh;text-align:center;box-shadow:0 12px 60px #000d}
      .dw-expanded::backdrop{background:#000d}
      .dw-expanded h3{font:700 1.25rem Georgia,serif;margin:0 0 8px}
      .dw-expanded img{display:block;max-height:70vh;max-width:100%;object-fit:contain;margin:auto}
      .dw-expanded button{margin-top:8px;background:#31271f;color:#f4e1c5;border:1px solid #9d8060;padding:6px 16px;cursor:pointer}
      .dw-missing{position:absolute;z-index:2;right:10%;bottom:12%;width:36%;text-align:center;background:#211912d9;color:#f3d09b;border:1px dashed #bea179;padding:12px 3px;font-size:.75rem}
      .dw-frame .dw-missing{right:5%;bottom:24px;width:90%;padding:3px 1px;font-size:.52rem}
      .dw-shop{margin-top:16px;padding-top:12px;border-top:1px solid #72583d}
      .dw-shop .dw-scene{max-width:950px;margin:auto}
      .dw-shop .dw-person{right:var(--dw-shop-right,40%);height:var(--dw-shop-size,76%);max-width:75%;filter:drop-shadow(4px 8px 7px #0009)}
      .dw-shop-inputs{display:flex;flex-wrap:wrap;gap:10px 18px;align-items:end;margin:10px 0}
      .dw-shop-inputs label{display:grid;gap:4px;font-size:.82rem}
      .dw-shop-inputs input[type=file]{max-width:250px}
      .dw-shop-inputs input[type=range]{width:125px;accent-color:#ba7739}
      .dw-shop .dw-location{display:none}
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
    // Shop composition proof-of-concept: local background selection, no repo upload
    // and no changes to player-assigned wanderers or their saved shop state.
    const shopSection=el('section','dw-shop');
    shopSection.appendChild(el('h2','','GENERAL STORE — COMPOSITION TEST'));
    const shopControls=el('div','dw-shop-inputs');
    const fileLabel=el('label','','Shop background (PNG/JPG on this device)');
    const backgroundFile=el('input');backgroundFile.type='file';backgroundFile.accept='image/png,image/jpeg,image/webp';
    fileLabel.appendChild(backgroundFile);
    function slider(label,min,max,value){
      const wrap=el('label','',label);
      const input=el('input');input.type='range';input.min=min;input.max=max;input.value=value;
      wrap.appendChild(input);shopControls.appendChild(wrap);return input;
    }
    const horizontal=slider('Character position',0,90,40);
    const scale=slider('Character size',25,130,76);
    shopControls.prepend(fileLabel);shopSection.appendChild(shopControls);
    const shopFigure=el('figure','dw-figure'),shopCaption=el('figcaption','','Temporary shop + selected wanderer');
    const shopCanvas=el('div','dw-scene'),shopBackground=el('img','dw-bg');
    shopBackground.alt='Shop background selected locally';shopCanvas.appendChild(shopBackground);
    shopFigure.append(shopCaption,shopCanvas);shopSection.appendChild(shopFigure);dialog.appendChild(shopSection);
    let shopUrl=null;
    backgroundFile.addEventListener('change',()=>{
      if(shopUrl){URL.revokeObjectURL(shopUrl);shopUrl=null;}
      const file=backgroundFile.files?.[0];
      if(file){shopUrl=URL.createObjectURL(file);shopBackground.src=shopUrl;}
      else shopBackground.removeAttribute('src');
    });
    function positionShop(){
      shopCanvas.style.setProperty('--dw-shop-right',horizontal.value+'%');
      shopCanvas.style.setProperty('--dw-shop-size',scale.value+'%');
    }
    horizontal.addEventListener('input',positionShop);
    scale.addEventListener('input',positionShop);
    dialog.appendChild(el('p','dw-note','Preview only. Choose the empty General Store image from your device, select any of 50 wanderers, and adjust character position/size. Nothing is saved to your character, repository, or server.'));

    function expandPortrait(w){
      const expanded=el('dialog','dw-expanded');
      expanded.appendChild(el('h3','',w.name));
      const image=el('img');image.alt=w.name;image.src=portraitUrl(w);expanded.appendChild(image);
      const button=el('button','','Close');button.type='button';
      button.addEventListener('click',()=>expanded.close());expanded.appendChild(button);
      expanded.addEventListener('close',()=>expanded.remove(),{once:true});
      document.body.appendChild(expanded);expanded.showModal();button.focus();
    }
    function placePortrait(canvas,w,framed){
      canvas.querySelectorAll('.dw-person,.dw-frame,.dw-missing').forEach(node=>node.remove());
      const holder=framed?el('div','dw-frame'):canvas;
      const img=el('img','dw-person');img.alt=w.name;
      const missing=el('div','dw-missing','Portrait artwork pending');
      img.addEventListener('load',()=>{missing.remove();img.hidden=false;});
      img.addEventListener('error',()=>{img.hidden=true;if(!missing.isConnected)holder.appendChild(missing);});
      img.hidden=true;holder.appendChild(missing);holder.appendChild(img);
      if(framed){
        holder.appendChild(el('div','dw-name',shortName(w.name)));
        holder.title='Open '+w.name+' portrait';holder.tabIndex=0;holder.setAttribute('role','button');
        holder.setAttribute('aria-label','Open full portrait of '+w.name);
        holder.addEventListener('click',()=>{if(globalThis.Route127WandererInfo)globalThis.Route127WandererInfo.open(w.name,portraitUrl(w));else expandPortrait(w);});
        holder.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();if(globalThis.Route127WandererInfo)globalThis.Route127WandererInfo.open(w.name,portraitUrl(w));else expandPortrait(w);}});
        canvas.appendChild(holder);
      }
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
      placePortrait(shopCanvas,wanderer,false);positionShop();
    }
    for(const select of [personSelect,regionSelect,townSelect])select.addEventListener('change',update);
    dialog.addEventListener('close',()=>{
      if(shopUrl)URL.revokeObjectURL(shopUrl);
      dialog.remove();
    },{once:true});
    document.body.appendChild(dialog);update();dialog.showModal();close.focus();
  }

  // DEVTEST-only combat art composition tab, alongside Wanderer preview.
  function showCombatPreview(){
    addStyle();
    const dialog=el('dialog','dw-preview');
    dialog.setAttribute('aria-label','Combat Visual Testing');
    const header=el('div','dw-head'),title=el('h2','','COMBAT VISUAL TESTING');
    const close=el('button','dw-close','X — Close');close.type='button';
    close.addEventListener('click',()=>dialog.close());header.append(title,close);dialog.append(header);
    const controls=el('div','dw-controls');
    function select(label,values){
      const wrap=el('label','',label),node=el('select');
      for(const value of values){const opt=el('option','',value);opt.value=value;node.append(opt);}
      wrap.append(node);controls.append(wrap);return node;
    }
    const encounters={
      'Bat Colony':{asset:'bat_colony.png',count:4,size:27,positions:[[50,30],[31,16],[65,27],[43,37],[72,48]]},
      'Rabid Raccoons':{asset:'rabid_raccoon.png',count:3,size:32,positions:[[50,64],[32,65],[53,63],[69,68]]}
    };
    const encounter=select('Combat encounter',Object.keys(encounters));
    const region=select('Background region',REGIONS);
    const count=select('Enemies',['1','2','3','4']);
    const sizeWrap=el('label','','Enemy size'),size=el('input');size.type='range';size.min='10';size.max='50';sizeWrap.append(size);controls.append(sizeWrap);
    const fileWrap=el('label','','Transparent enemy artwork'),file=el('input');file.type='file';file.accept='image/png,image/webp,image/*';fileWrap.append(file);controls.append(fileWrap);
    dialog.append(controls);
    const stage=el('div','dw-scene');stage.style.marginTop='12px';stage.style.setProperty('aspect-ratio','16/9');
    const bg=el('img','dw-bg');bg.alt='Region background';stage.append(bg);
    const plate=el('span','dw-location');stage.append(plate);dialog.append(stage);
    dialog.append(el('p','dw-note','DEVTEST composition only. Select Bat Colony or Rabid Raccoons to preview installed artwork, or choose a local PNG. No combat, saves, or Playtest changes.'));
    const assetUrl=()=>new URL('assets/enemies/'+encounters[encounter.value].asset,devtestRoot).href;
    let localUrl=null;
    function render(){
      bg.src=regionUrl(region.value);
      plate.textContent=region.value+' — '+encounter.value.toUpperCase();
      stage.querySelectorAll('.dw-combat-enemy').forEach(n=>n.remove());
      const cfg=encounters[encounter.value],total=Number(count.value);
      for(let i=0;i<total;i++){
        const img=el('img','dw-combat-enemy');img.src=localUrl||assetUrl();img.alt=encounter.value+' '+(i+1);img.addEventListener('error',()=>img.remove(),{once:true});
        const pos=cfg.positions[total===1?0:i+1]||cfg.positions[i%cfg.positions.length];
        const flipped=encounter.value==='Rabid Raccoons'&&i===1&&total>1;
        const scale=encounter.value==='Rabid Raccoons'?[.9,.72,.86,1][i]:1;
        img.style.cssText='position:absolute;z-index:2;object-fit:contain;filter:drop-shadow(-2px -2px 1px rgba(255,198,126,.65)) drop-shadow(3px 7px 4px rgba(10,6,5,.85));width:'+size.value+'%;left:'+pos[0]+'%;top:'+pos[1]+'%;transform:translate(-50%,-50%) scale('+(flipped?-scale:scale)+','+scale+')';
        stage.append(img);
      }
    }
    function changeEncounter(){
      if(localUrl){URL.revokeObjectURL(localUrl);localUrl=null;file.value='';}
      const cfg=encounters[encounter.value];count.value=String(cfg.count);size.value=String(cfg.size);
      render();
    }
    file.addEventListener('change',()=>{
      if(localUrl)URL.revokeObjectURL(localUrl);
      localUrl=file.files?.[0]?URL.createObjectURL(file.files[0]):null;render();
    });
    encounter.addEventListener('change',changeEncounter);
    for(const input of [region,count,size])input.addEventListener('input',render);
    dialog.addEventListener('close',()=>{if(localUrl)URL.revokeObjectURL(localUrl);dialog.remove();},{once:true});
    document.body.append(dialog);changeEncounter();dialog.showModal();close.focus();
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
    const combat=this.button('Combat Visual Testing',showCombatPreview);
    combat.dataset.devtestCombatPreview='true';
    panel.insertBefore(combat,close||null);
    return result;
  };
})();
