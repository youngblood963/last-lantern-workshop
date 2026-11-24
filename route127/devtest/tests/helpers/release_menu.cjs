/* Real offline DEVTEST engine, with DOM features used by menu overlays. */
const create=require('./release_dom.cjs');
const walk=n=>[n,...(n.children||[]).flatMap(walk)];
module.exports=function(){
 const game=create(),{run,ctx,ids}=game,E=ids.screen.constructor;
 const match=(node,selector)=>{
  if(selector.includes(','))return selector.split(',').some(s=>match(node,s.trim()));
  const attribute=selector.match(/^\[([^=]+)=['\"]?([^'\"]+)['\"]?\]$/);if(attribute)return node.getAttribute(attribute[1])===attribute[2];
  if(selector.startsWith('.'))return selector.slice(1).split('.').every(s=>node.classList.contains(s));
  if(selector.startsWith('#'))return node.id===selector.slice(1);
  return node.tagName===selector.toUpperCase();
 };
 E.prototype.querySelectorAll=function(s){return walk(this).slice(1).filter(n=>match(n,s));};
 E.prototype.querySelector=function(s){return this.querySelectorAll(s)[0]||null;};
 Object.defineProperty(E.prototype,'options',{get(){return this.children;},configurable:true});
 ctx.window.removeEventListener=()=>{};ctx.fetch=()=>{throw Error('Public network disabled for isolated menu audit');};
 run(`globalThis.menuAuditMessages=[];const menuAuditAdd=add;add=function(text,...args){menuAuditMessages.push(String(text??''));return menuAuditAdd.call(this,text,...args)};
 const menuAuditImmediate=addImmediate;addImmediate=function(text,...args){menuAuditMessages.push(String(text??''));return menuAuditImmediate.call(this,text,...args)};
 `);
 const visible=node=>{for(let n=node;n;n=n.parentNode)if(n.hidden||n.style.display==='none'||n.tagName==='DIALOG'&&!n.open)return false;return true;};
 return {...game,walk,buttons:()=>walk(ctx.document.body).filter(n=>n.tagName==='BUTTON'&&!n.disabled&&visible(n))};
};
