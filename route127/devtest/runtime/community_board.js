(() => {
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 const endpoint='/route127/devtest/api/community/';
 const entries=[['announcement','Wasteland Announcements'],['discussion','Survivor Discussions']];
 const categories=['Report a Bug','Suggest a Feature','Gameplay Balancing','Artwork or Visual Issue','General Feedback'];
 let dialog,renderVersion=0,returningFromBounties=false;
 const make=(tag,text)=>{
  const node=document.createElement(tag);
  if(text!==undefined)node.textContent=text;
  return node;
 };
 const control=(label,action)=>{
  const button=make('button',label);
  button.type='button';button.addEventListener('click',action);return button;
 };
 const status=()=>{
  const line=make('p');line.setAttribute('role','status');return line;
 };
 const field=(form,label,node)=>{
  const wrapper=make('label',label);wrapper.append(node);form.append(wrapper);return node;
 };
 const required=(tag,max,value='')=>{
  const field=make(tag);field.required=true;field.maxLength=max;field.value=value;return field;
 };
 const select=options=>{
  const input=make('select');
  for(const name of options){const option=make('option',name);option.value=name;input.append(option);}
  return input;
 };
 const seenKey=(viewer,kind)=>'route127.community.seen.'+viewer+'.'+kind;
 function hasFresh(data,kind){
  try{return data.latest>Number(localStorage.getItem(seenKey(data.viewer,kind))||0);}catch{return !!data.latest;}
 }
 function markSeen(data,kind){
  try{localStorage.setItem(seenKey(data.viewer,kind),String(data.latest));}catch{}
 }
 async function request(path,payload){
  const reply=await fetch(endpoint+path,{
   method:payload?'POST':'GET',credentials:'same-origin',cache:'no-store',
   ...(payload?{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}:{})
  });
  const data=await reply.json().catch(()=>null);
  if(!reply.ok||!data)throw new Error(data?.error||'The community service is temporarily unavailable.');
  return data;
 }
 function town(){
  dialog.close();
 }
 function page(title,back){
  const panel=make('section'),heading=make('h2',title);
  panel.className='community-paper';heading.id='community-board-title';heading.tabIndex=-1;
  panel.append(heading);
  if(back)panel.append(control('Back',back));
  dialog.replaceChildren(panel);
  dialog.scrollTop=0;
  heading.focus();
  return {panel,version:++renderVersion};
 }
 function home(){
  const {panel,version}=page('Community Bulletin Board');
  panel.classList.add('community-home');
  for(const [kind,label] of entries){
   const button=control(label,()=>listing(kind));
   panel.append(button);
   request('board?kind='+kind).then(data=>{
    if(version===renderVersion&&hasFresh(data,kind))button.textContent=label+' · Fresh Notices';
   }).catch(()=>{});
  }
  panel.append(control('Workshop Feedback',feedback),control("Wasteland's Most Wanted",()=>{
   returningFromBounties=true;dialog.close();
   if(globalThis.DailyBounties?.openBoard){
    DailyBounties.openBoard(()=>{
     returningFromBounties=false;
     dialog.showModal();home();
    });
   }else{
    returningFromBounties=false;dialog.showModal();
    panel.append(make('p','Wanted posters are temporarily unavailable.'));
   }
  }),control('Back to Town',town));
 }
 function mutation(form,values,onSuccess,path='board',label='Post Notice'){
  const send=make('button',label),line=status();
  send.type='submit';
  form.append(send,line);
  form.addEventListener('submit',async event=>{
   event.preventDefault();
   if(send.disabled)return;
   send.disabled=true;line.textContent='Sending…';
   try{await request(path,values());onSuccess();}
   catch(error){line.textContent=error.message||'Unable to send. Please retry.';send.disabled=false;}
  });
 }
 const when=post=>new Date(post.created_at).toLocaleString();
 const byline=post=>post.identity?'Official · '+post.identity+' · '+when(post):post.author+' · Level '+post.level+' · '+when(post);
 async function listing(kind,index=0){
  const {panel,version}=page(entries.find(entry=>entry[0]===kind)[1],home);
  const line=status();line.textContent='Reading the board…';panel.append(line);
  try{
   const data=await request('board?kind='+kind+'&page='+index);
   if(version!==renderVersion)return;
   markSeen(data,kind);
   line.textContent=data.posts.length?'':'There are no notices here yet.';
   if(kind==='discussion'||data.admin)panel.append(control(kind==='discussion'?'Leave a Note':'Publish an Announcement',()=>editor({kind})));
   for(const post of data.posts){
    const item=make('article');
    item.append(control((post.pinned?'Important Notice · ':'')+post.title,()=>thread(kind,post.id)),
     make('p',byline(post)+' · '+post.replies+(post.replies===1?' response':' responses')),make('p',post.preview));
    panel.append(item);
   }
   if(index>0)panel.append(control('Previous Notices',()=>listing(kind,index-1)));
   if(data.more)panel.append(control('More Notices',()=>listing(kind,index+1)));
  }catch(error){if(version===renderVersion){line.textContent=error.message;panel.append(control('Retry',()=>listing(kind,index)));}}
 }
 async function thread(kind,id,index=0){
  const {panel,version}=page('Notice',()=>listing(kind));
  const line=status();line.textContent='Reading the notice…';panel.append(line);
  try{
   const data=await request('board?id='+encodeURIComponent(id)+'&page='+index);
   if(version!==renderVersion)return;
   panel.querySelector('h2').textContent=(data.post.pinned?'Important Notice · ':'')+data.post.title;
   line.textContent=data.post.locked?'Closed to responses.':'';
   for(const post of [data.post,...data.replies]){
    const item=make('article');
    if(post.identity)item.className='community-official';
    const message=make('p',post.message);message.className='community-message';
    item.append(make('strong',byline(post)),message);
    const actions=[];
    if(post.owned&&!post.identity||data.admin&&post.identity)
     item.append(control('Edit Notice',()=>editor({kind,parent:post.parent_id,post,threadId:id})));
    if(data.admin||post.owned&&!post.identity)actions.push(['Remove Notice',{action:'remove'}]);
    if(data.admin&&!post.parent_id){
     actions.push([post.pinned?'Unpin Notice':'Pin Notice',{action:'pinned',enabled:!post.pinned}]);
     actions.push([post.locked?'Unlock Responses':'Lock Responses',{action:'locked',enabled:!post.locked}]);
    }
    for(const [label,value] of actions)item.append(control(label,async event=>{
     if(value.action==='remove'&&!confirm('Remove this notice?'))return;
     const button=event.currentTarget;button.disabled=true;
     try{
      await request('board',{...value,id:post.id});
      if(version!==renderVersion)return;
      if(value.action==='remove'&&!post.parent_id)listing(kind);else thread(kind,id,index);
     }catch(error){line.textContent=error.message;button.disabled=false;}
    }));
    panel.append(item);
   }
   if(index>0)panel.append(control('Previous Responses',()=>thread(kind,id,index-1)));
   if(data.more)panel.append(control('More Responses',()=>thread(kind,id,index+1)));
   if(!data.post.locked)panel.append(control('Write a Response',()=>editor({kind,parent:id,threadId:id})));
  }catch(error){if(version===renderVersion){line.textContent=error.message;panel.append(control('Retry',()=>thread(kind,id,index)));}}
 }
 function editor({kind,parent,post,threadId}){
  const back=()=>threadId?thread(kind,threadId):listing(kind);
  const {panel,version}=page(post?'Edit Notice':parent?'Write a Response':kind==='announcement'?'Publish an Announcement':'Leave a Note',back);
  const form=make('form');
  const title=parent?null:field(form,'Subject',required('input',100,post?.title));
  const identity=!parent&&!post&&kind==='announcement'?field(form,'Publish as',select(['Last Lantern Workshop','Luna'])):null;
  const message=field(form,'Message',required('textarea',4000,post?.message));message.rows=6;
  const id=post?.id||crypto.randomUUID();
  mutation(form,()=>({id,action:post?'edit':'create',parent,title:title?.value,message:message.value,identity:identity?.value}),
   ()=>{if(version===renderVersion)thread(kind,threadId||id);});
  panel.append(form);
 }
 function feedback(){
  const {panel,version}=page('Workshop Feedback');
  const form=make('form'),id=crypto.randomUUID();
  panel.append(make('p','This report goes privately to Last Lantern Workshop. Your character, location, game build, and basic browser information accompany it for troubleshooting.'));
  const category=field(form,'Feedback Category',select(['Choose a category',...categories]));
  category.options[0].value='';category.required=true;
  const subject=field(form,'Subject',required('input',100));
  const message=field(form,'Message',required('textarea',4000));message.rows=7;
  mutation(form,()=>({id,category:category.value,subject:subject.value,message:message.value,
   location:stage==='mercy'?'Solace':route127CurrentRegion(lanternState())||lanternState()?.nodeId,
   encounter:stage==='encounter'?currentEncounter()?.title:stage==='combat'?combatState?.name:undefined,
   build:globalThis.ROUTE127_ENV?.build||'community-board-1'
  }),()=>{
   if(version!==renderVersion)return;
   const {panel}=page('Message Sent to the Workshop');
   panel.append(make('p','Your message has been sent to Last Lantern Workshop. Thank you for helping improve Route 127.'),
    control('Return to Bulletin Board',home));
  },'feedback','Send to Workshop');
  form.append(control('Cancel',home));panel.append(form);
 }
 showBulletinBoard=function(){
  mercyLocation='town';townWandererFocus=null;player.flags.solaceMenu='board';
  if(!dialog){
   dialog=make('dialog');dialog.className='route127-community-board';
   dialog.setAttribute('aria-labelledby','community-board-title');
   dialog.addEventListener('close',()=>{
    if(dialog.open||returningFromBounties)return;
    renderVersion++;mercyMenu();
   });
   dialog.addEventListener('keydown',event=>event.stopPropagation());
   document.body.append(dialog);
  }
  if(!dialog.open)dialog.showModal();
  home();
 };
})();
