/* Legacy saves may have the old text maze open. The DEVTEST encounter now
   enters the shared full-window maze from its normal Enter Tire Maze action. */
if(globalThis.ROUTE127_ENV?.name==='PLAYTEST'){
 r18MazeActive=()=>null;
 r18MazeControls=()=>{};
}
