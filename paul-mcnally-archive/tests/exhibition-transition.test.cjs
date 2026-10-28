const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const math=fs.readFile(path.join(__dirname,'../exhibition/src/wall-math.js'),'utf8').then(source=>import('data:text/javascript;base64,'+Buffer.from(source).toString('base64')));

test('artwork projection reverses the rendered wall mapping across desktop, touch and zoom',async()=>{
 const {worldToScreen,pointToCell}=await math;
 for(const [width,height] of [[1440,1000],[390,844]])for(const scale of [1.8,3.1,4.7])for(const bend of [0,-.07]){
  const pan={x:-2.4,y:8.3};
  for(const px of [-.9,-.4,0,.4,.9])for(const py of [-.9,0,.9]){
   const factor=.91+bend*(px*px+py*py),x=px*factor*(width/height)*scale*.5+pan.x,y=py*factor*scale*.5+pan.y;
   const projected=worldToScreen(x,y,width,height,pan,scale,bend);
   assert.ok(Math.abs(projected.x-(px*.5+.5)*width)<.001);
   assert.ok(Math.abs(projected.y-(.5-py*.5)*height)<.001);
   assert.deepEqual(pointToCell(projected.x,projected.y,width,height,pan,scale,bend),{x:Math.floor(x),y:Math.floor(y/.9)});
  }
 }
});

test('the flight matrix lands every full-resolution image corner on its warped tile',async()=>{
 const {quadTransform,artworkQuad}=await math;
 const width=1000,height=750;
 for(const cell of [{x:3,y:1},{x:4,y:2},{x:1,y:-1}]){
  const quad=artworkQuad(cell,{x:28,y:42,width:456,height:342},1440,1000,{x:3.5,y:1.35},3.1,-.07);
  const matrix=quadTransform(quad,width,height).slice(9,-1).split(',').map(Number);
  [[0,0],[width,0],[width,height],[0,height]].forEach(([x,y],i)=>{
   const w=matrix[3]*x+matrix[7]*y+matrix[15];
   assert.ok(Math.abs((matrix[0]*x+matrix[4]*y+matrix[12])/w-quad[i].x)<.001);
   assert.ok(Math.abs((matrix[1]*x+matrix[5]*y+matrix[13])/w-quad[i].y)<.001);
  });
 }
 assert.equal(quadTransform(Array(4).fill({x:0,y:0}),width,height),null);
});
