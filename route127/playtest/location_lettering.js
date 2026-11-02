/* Keep dynamic location labels live while scoping the worn lettering to text. */
const IronLettering={
 decorate(){
  const e=GraphicalUI.element;if(!e)return;
  for(const label of [e.caption,e.where]){
   if(!label)continue;
   if(label.children.length===1&&label.firstChild?.classList?.contains('iron-title-text'))continue;
   const text=label.textContent,span=document.createElement('span');
   span.className='iron-title-text';span.textContent=text;label.replaceChildren(span);
  }
 }
};
const ironLetteringSync=GraphicalUI.sync;
GraphicalUI.sync=function(...args){const result=ironLetteringSync.apply(this,args);IronLettering.decorate();return result;};
addEventListener('DOMContentLoaded',()=>IronLettering.decorate());
