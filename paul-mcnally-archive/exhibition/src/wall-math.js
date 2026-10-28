export const CELL_HEIGHT=.9;
export const GRID_COLUMNS=13;
export function wrap(value,count){return ((value%count)+count)%count;}
export function pointToCell(x,y,width,height,pan,scale,bend){
 const px=(x/width-.5)*2,py=(.5-y/height)*2;
 const factor=.91+bend*(px*px+py*py);
 return {x:Math.floor(px*factor*(width/height)*scale*.5+pan.x),y:Math.floor((py*factor*scale*.5+pan.y)/CELL_HEIGHT)};
}
export function articleAtCell(cell,indices){return indices.length?indices[wrap(cell.x+cell.y*GRID_COLUMNS,indices.length)]:null;}
export function isClick(distance,duration){return distance<7&&duration<650;}
