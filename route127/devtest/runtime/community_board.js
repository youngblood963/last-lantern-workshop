(() => {
 if(globalThis.ROUTE127_ENV?.name!=='DEVTEST')return;
 // DEVTEST characters are browser-local. This board preview never contacts the public service.
 const canDiscuss=()=>player.turns>0;
 const sampleDate=Date.UTC(2026,10,22);
 const samples=[
  {id:'sample-news',identity:'Last Lantern Workshop',title:'DEVTEST camp preview',message:'This sample notice shows how pinned news appears while waiting for dawn.',pinned:true,locked:true},
  {id:'sample-discussion',title:'Stories from the road',author:'Sample Survivor',level:1,message:'What did you find on the road today?'}
 ].map(post=>({created_at:sampleDate,replies:0,...post,preview:post.message}));
 let lastDiscussionPost=0;
 const readOnlyMessage='Read-only while you have no turns. Posting and replies return when your turns replenish.';
 const entries=[['announcement','Wasteland News'],['discussion','Community Discussions']];
 const categories=['Report a Bug','Suggest a Feature','Gameplay Balancing','Artwork or Visual Issue','General Feedback'];
 let dialog,renderVersion=0,returningFromBounties=false,origin='town',view=null,permission=canDiscuss();
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
  const {pathname,searchParams}=new URL(path,'https://devtest.invalid/');
  if(pathname==='/feedback'&&payload)return {ok:true};
  if(payload){
   if(!canDiscuss())throw new Error(readOnlyMessage);
   const post=samples.find(sample=>sample.id===payload.id&&sample.owned);
   if(payload.action==='edit'&&post){
    Object.assign(post,{title:payload.title,message:payload.message,preview:payload.message});
   }else if(payload.action==='remove'&&post){
    for(let i=samples.length-1;i>=0;i--){
     if(samples[i]===post||samples[i].parent_id===post.id)samples.splice(i,1);
    }
   }else if(payload.action==='create'&&!payload.identity){
    const now=Date.now();
    if(now-lastDiscussionPost<600000)throw new Error('Wait ten minutes between public notes or responses.');
    samples.unshift({id:payload.id,parent_id:payload.parent,owned:true,author:'Local Survivor',
     level:player.level,title:payload.title,message:payload.message,preview:payload.message,created_at:now});
    lastDiscussionPost=now;
   }else throw new Error('This action is unavailable from a local DEVTEST character.');
   return {ok:true};
  }
  const id=searchParams.get('id');
  if(id){
   const post=samples.find(sample=>sample.id===id&&!sample.parent_id);
   if(!post)throw new Error('This sample notice is unavailable.');
   return {post,replies:samples.filter(sample=>sample.parent_id===id).reverse(),more:false};
  }
  const announcement=searchParams.get('kind')==='announcement';
  const posts=samples.filter(post=>!post.parent_id&&Boolean(post.identity)===announcement);
  return {posts:posts.map(post=>({...post,replies:samples.filter(reply=>reply.parent_id===post.id).length})),
   more:false,latest:posts[0]?.created_at||0,viewer:'devtest-preview'};
 }
 function town(){
  dialog.close();
 }
 function page(title,back){
  const panel=make('section'),heading=make('h2',title);
  panel.className='community-paper';heading.id='community-board-title';heading.tabIndex=-1;
  panel.append(heading);
  if(back)panel.append(control(back===backToOrigin&&origin==='waiting'?'Return to Waiting for Dawn':'Back',back));
  dialog.replaceChildren(panel);
  dialog.scrollTop=0;
  heading.focus();
  return {panel,version:++renderVersion};
 }
 function backToOrigin(){
  if(origin==='waiting')town();
  else if(origin==='news')town();
  else home();
 }
 function home(){
  view=home;
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
  view=()=>listing(kind,index);
  const {panel,version}=page(entries.find(entry=>entry[0]===kind)[1],backToOrigin);
  const line=status();line.textContent='Reading the board…';panel.append(line);
  try{
   const data=await request('board?kind='+kind+'&page='+index);
   if(version!==renderVersion)return;
   markSeen(data,kind);
   line.textContent=data.posts.length?'':'There are no notices here yet.';
   panel.append(make('p',kind==='discussion'&&!canDiscuss()?readOnlyMessage:'DEVTEST preview · sample notices'));
   if(kind==='discussion'&&canDiscuss())panel.append(control('Leave a Test Note',()=>editor({kind})));
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
  view=()=>thread(kind,id,index);
  const {panel,version}=page('Notice',()=>listing(kind));
  const line=status();line.textContent='Reading the notice…';panel.append(line);
  try{
   const data=await request('board?id='+encodeURIComponent(id)+'&page='+index);
   if(version!==renderVersion)return;
   panel.querySelector('h2').textContent=(data.post.pinned?'Important Notice · ':'')+data.post.title;
   line.textContent=data.post.identity||data.post.locked?'Closed to responses.':'';
   for(const post of [data.post,...data.replies]){
    const item=make('article');
    if(post.identity)item.className='community-official';
    const message=make('p',post.message);message.className='community-message';
    item.append(make('strong',byline(post)),message);
    const actions=[];
    if(post.owned&&canDiscuss())
     item.append(control('Edit Notice',()=>editor({kind,parent:post.parent_id,post,threadId:id})));
    if(post.owned&&canDiscuss())actions.push(['Remove Test Notice',{action:'remove'}]);
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
   if(kind==='discussion'&&!canDiscuss())panel.append(make('p',readOnlyMessage));
   if(kind==='discussion'&&canDiscuss()&&!data.post.locked)panel.append(control('Write a Test Response',()=>editor({kind,parent:id,threadId:id})));
  }catch(error){if(version===renderVersion){line.textContent=error.message;panel.append(control('Retry',()=>thread(kind,id,index)));}}
 }
 function editor({kind,parent,post,threadId}){
  if(!canDiscuss())return listing('discussion');
  view=()=>listing('discussion');
  const back=()=>threadId?thread(kind,threadId):listing(kind);
  const {panel,version}=page(post?'Edit Notice':parent?'Write a Response':kind==='announcement'?'Publish an Announcement':'Leave a Note',back);
  const form=make('form');
  const title=parent?null:field(form,'Subject',required('input',100,post?.title));
  const message=field(form,'Message',required('textarea',4000,post?.message));message.rows=6;
  const id=post?.id||crypto.randomUUID();
  mutation(form,()=>({id,action:post?'edit':'create',parent,title:title?.value,message:message.value}),
   ()=>{if(version===renderVersion)thread(kind,threadId||id);},'board','Save Test Note');
  panel.append(form);
 }
 function feedback(){
  view=null;
  const {panel,version}=page('Workshop Feedback',backToOrigin);
  const form=make('form'),id=crypto.randomUUID();
  panel.append(make('p','DEVTEST preview. This form tests private feedback locally. No message or character information is sent.'));
  const category=field(form,'Feedback Category',select(['Choose a category',...categories]));
  category.options[0].value='';category.required=true;
  const subject=field(form,'Subject',required('input',100));
  const message=field(form,'Message',required('textarea',4000));message.rows=7;
  mutation(form,()=>({id,category:category.value,subject:subject.value,message:message.value,
  }),()=>{
   if(version!==renderVersion)return;
   const {panel}=page('Feedback Preview Complete',backToOrigin);
   panel.append(make('p','The test submission completed locally.'));
  },'feedback','Test Feedback Submission');
  form.append(control('Cancel',backToOrigin));panel.append(form);
 }
 function openBoard(source,draw){
  origin=source;
  if(!dialog){
   dialog=make('dialog');dialog.className='route127-community-board';
   dialog.setAttribute('aria-labelledby','community-board-title');
   dialog.addEventListener('close',()=>{
    if(dialog.open||returningFromBounties)return;
    renderVersion++;if(origin==='town')mercyMenu();
   });
   dialog.addEventListener('keydown',event=>event.stopPropagation());
   document.body.append(dialog);
  }
  if(!dialog.open)dialog.showModal();
  draw();
 }
 showBulletinBoard=function(){
  mercyLocation='town';townWandererFocus=null;player.flags.solaceMenu='board';
  openBoard('town',home);
 };
 // Public-service enforcement is a separate release requirement; this adapter stays local.
 globalThis.Route127Community=Object.freeze({
  news(){openBoard('waiting',()=>listing('announcement'));},
  discussions(){openBoard('waiting',()=>listing('discussion'));},
  feedback(){openBoard('waiting',feedback);},
  close(){if(dialog?.open)dialog.close();},
  refreshPermissions(){const next=canDiscuss();if(next!==permission){permission=next;if(dialog?.open&&view)view();}}
 });
 const previousOptions=TravelerPanels.options;
 TravelerPanels.options=function(...args){
  const result=previousOptions.apply(this,args);
  if(this.which!=='options')return result;
  const panel=this.body.querySelector('.traveler-detail');
  if(!panel)return result;
  const close=[...panel.querySelectorAll('button')].find(button=>button.textContent==='Close');
  for(const [label,draw] of [['Wasteland News',()=>listing('announcement')],['Workshop Feedback',feedback]]){
   panel.insertBefore(this.button(label,()=>{this.close();openBoard('news',draw);}),close||null);
  }
  return result;
 };
})();
