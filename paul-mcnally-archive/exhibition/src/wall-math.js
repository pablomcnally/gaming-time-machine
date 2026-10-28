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

// Invert the wall shader's radial mapping so a tile can leave the WebGL wall
// without jumping to an undistorted approximation of its screen position.
export function worldToScreen(x,y,width,height,pan,scale,bend){
 const qx=(x-pan.x)*2/((width/height)*scale),qy=(y-pan.y)*2/scale;
 const radius=Math.hypot(qx,qy);if(!radius)return {x:width/2,y:height/2};
 const limit=bend<0?Math.sqrt(-.91/(3*bend)):.0;
 let lo=0,hi=bend<0?limit:Math.max(2,radius/.91);
 const max=hi*(.91+bend*hi*hi);
 let r;
 if(bend<0&&radius>max)r=hi+(radius-max)/.3;
 else{for(let i=0;i<45;i++){const mid=(lo+hi)/2;if(mid*(.91+bend*mid*mid)<radius)lo=mid;else hi=mid;}r=(lo+hi)/2;}
 return {x:(qx*r/radius*.5+.5)*width,y:(.5-qy*r/radius*.5)*height};
}
export function artworkQuad(cell,rect,width,height,pan,scale,bend){
 return [[0,0],[1,0],[1,1],[0,1]].map(([x,y])=>worldToScreen(cell.x+(rect.x+x*rect.width)/512,(cell.y+1-(rect.y+y*rect.height)/460)*CELL_HEIGHT,width,height,pan,scale,bend));
}

// Project a full-resolution image onto a four-corner CSS plane.
export function quadTransform(quad,width,height){
 const rows=[];
 [[0,0],[1,0],[1,1],[0,1]].forEach(([u,v],i)=>{
  const {x,y}=quad[i];rows.push([u,v,1,0,0,0,-x*u,-x*v,x],[0,0,0,u,v,1,-y*u,-y*v,y]);
 });
 for(let col=0;col<8;col++){
  let pivot=col;for(let row=col+1;row<8;row++)if(Math.abs(rows[row][col])>Math.abs(rows[pivot][col]))pivot=row;
  [rows[col],rows[pivot]]=[rows[pivot],rows[col]];
  const divisor=rows[col][col];if(Math.abs(divisor)<1e-10)return null;
  for(let j=col;j<9;j++)rows[col][j]/=divisor;
  for(let row=0;row<8;row++){if(row===col)continue;const factor=rows[row][col];for(let j=col;j<9;j++)rows[row][j]-=factor*rows[col][j];}
 }
 const h=rows.map(row=>row[8]);
 return `matrix3d(${[h[0]/width,h[3]/width,0,h[6]/width,h[1]/height,h[4]/height,0,h[7]/height,0,0,1,0,h[2],h[5],0,1].join(',')})`;
}
