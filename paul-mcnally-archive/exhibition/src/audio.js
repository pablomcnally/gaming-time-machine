export function dragPlaybackRate(x,y){
 const distance=Math.hypot((x-.5)*2,(y-.5)*2)/Math.SQRT2;
 return Math.max(.15,Math.min(1,1-distance));
}

export class ExhibitionAudio{
 constructor(url,onState){
  this.url=url;this.onState=onState;this.enabled=false;this.wanted=false;this.context=null;this.source=null;this.buffer=null;this.loading=null;this.dragging=false;this.dragTimer=null;this.suspendTimer=null;
  document.addEventListener('visibilitychange',()=>{
   if(!this.context)return;
   if(document.hidden){this.endDrag();this.gain.gain.cancelScheduledValues(this.context.currentTime);this.gain.gain.setValueAtTime(0,this.context.currentTime);this.context.suspend().catch(()=>{});}
   else if(this.enabled)this.context.resume().then(()=>this.fade(.24)).catch(()=>{});
  });
  addEventListener('pagehide',()=>this.context?.suspend().catch(()=>{}));
 }
 async setEnabled(wanted){
  this.wanted=wanted;clearTimeout(this.suspendTimer);
  if(!wanted){
   this.enabled=false;this.endDrag();this.fade(0);this.onState('off');
   this.suspendTimer=setTimeout(()=>{if(!this.wanted)this.context?.suspend().catch(()=>{});},400);return;
  }
  try{
   this.onState('loading');
   if(!this.context){
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw new Error('Audio is not supported by this browser.');
    this.context=new Audio();this.gain=this.context.createGain();this.gain.gain.value=0;
    this.filter=this.context.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=10000;
    this.filter.connect(this.gain);this.gain.connect(this.context.destination);
   }
   // Resume inside the button's user gesture, before the asynchronous track download.
   await this.context.resume();
   if(!this.loading)this.loading=fetch(this.url).then(r=>{if(!r.ok)throw new Error('The soundtrack could not load.');return r.arrayBuffer();}).then(bytes=>this.context.decodeAudioData(bytes));
   this.buffer=await this.loading;
   if(!this.wanted)return;
   if(!this.source){this.source=this.context.createBufferSource();this.source.buffer=this.buffer;this.source.loop=true;this.source.loopStart=0;this.source.loopEnd=this.buffer.duration;this.source.connect(this.filter);this.source.start();}
   this.enabled=true;this.fade(.24);this.onState('on');
  }catch(error){this.enabled=false;this.wanted=false;this.loading=null;this.onState('error',error.message);}
 }
 fade(value){if(!this.context||!this.gain)return;const now=this.context.currentTime;this.gain.gain.cancelScheduledValues(now);this.gain.gain.setTargetAtTime(value,now,.09);}
 rate(value){if(!this.source||!this.context)return;const param=this.source.playbackRate,now=this.context.currentTime;param.cancelScheduledValues(now);param.setTargetAtTime(value,now,.065);}
 beginDrag(x,y){
  if(!this.enabled)return;clearTimeout(this.dragTimer);this.dragging=false;
  this.dragPoint={x,y};this.dragTimer=setTimeout(()=>{if(!this.enabled)return;this.dragging=true;this.rate(dragPlaybackRate(this.dragPoint.x,this.dragPoint.y));},100);
 }
 moveDrag(x,y){this.dragPoint={x,y};if(this.enabled&&this.dragging)this.rate(dragPlaybackRate(x,y));}
 endDrag(){clearTimeout(this.dragTimer);this.dragging=false;this.rate(1);}
}
