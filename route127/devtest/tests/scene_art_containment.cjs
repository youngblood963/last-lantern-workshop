const assert=require('node:assert/strict');
const {run}=require('./helpers/devtest.cjs')();
for(const file of ['the_road_enforcer.png','the_shattered_silo.png','the_hollow_statue.png','ridgeline.gif','the_sprained_runner.png']){
 const values=run(`(()=>{
  const values={};const node={tagName:'IMG',src:'https://example.test/${file}',
   hasAttribute:()=>false,classList:{contains:c=>c==='gfx-image',add(){},toggle(){}},
   style:{setProperty:(key,value)=>values[key]=value}};
  const layout={x:97,y:2,width:140,height:120,scale:2,z:1,flip:false};
  Route127CombatLayouts.applyCemeteryLayout(node,layout,true);
  return {values,original:layout};
 })()`);
 const v=values.values,scale=Number(v['--r127-layout-scale']);
 const x=parseFloat(v['--r127-layout-x']),y=parseFloat(v['--r127-layout-y']);
 const w=parseFloat(v['--r127-layout-width'])*scale,h=parseFloat(v['--r127-layout-height'])*scale;
 assert(w<=100&&h<=100,file);assert(x-w/2>=-1e-8&&x+w/2<=100+1e-8,file);assert(y-h/2>=-1e-8&&y+h/2<=100+1e-8,file);
 assert.equal(values.original.scale,2,'Saved editor values must not be rewritten');
}
const sprite=run(`(()=>{const values={};const node={tagName:'IMG',hasAttribute:()=>false,classList:{contains:()=>false,add(){},toggle(){}},style:{setProperty:(k,v)=>values[k]=v}};Route127CombatLayouts.applyCemeteryLayout(node,{x:95,y:5,width:140,height:120,scale:2,z:4,flip:false},false);return values;})()`);
assert.equal(sprite['--r127-layout-scale'],'2','Foreground sprite composition is preserved');
console.log('PASS: oversized saved primary-scene boxes stay inside the viewport for all five reported scenes; foreground sprite layouts and saved values remain unchanged');
