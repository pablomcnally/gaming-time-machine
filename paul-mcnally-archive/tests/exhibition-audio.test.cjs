const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path');
test('drag audio follows the screen-centre curve while preventing a stalled loop',async()=>{
 const source=await fs.readFile(path.join(__dirname,'../exhibition/src/audio.js'),'utf8');
 const {dragPlaybackRate}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 assert.equal(dragPlaybackRate(.5,.5),1);
 assert.ok(dragPlaybackRate(.75,.5)<1&&dragPlaybackRate(.75,.5)>.15);
 assert.equal(dragPlaybackRate(1,1),.15);
 assert.equal(dragPlaybackRate(-1,2),.15);
 assert.equal(dragPlaybackRate(.25,.5),dragPlaybackRate(.75,.5));
});
