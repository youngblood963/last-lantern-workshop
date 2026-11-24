/* PLAYTEST retains the public text maze and its existing directional controls
   from r18_completion-release.js. The full-window DEVTEST package is not loaded
   here, so do not replace those controls with no-ops. */
(()=>{
 const sync=GraphicalUI.sync;
 GraphicalUI.sync=function(...args){
  const result=sync.apply(this,args);
  for(const button of document.getElementById('r18-maze-controls')?.querySelectorAll('button')||[])
   button.disabled=busy||commandProcessing;
  return result;
 };
})();
