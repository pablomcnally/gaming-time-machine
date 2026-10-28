import {quadTransform} from './wall-math.js';

export function imageQuad(image){
 const rect=image.getBoundingClientRect();
 const ratio=(image.naturalWidth||image.width)/(image.naturalHeight||image.height);
 const width=Math.min(rect.width,rect.height*ratio),height=width/ratio;
 const x=rect.left+(rect.width-width)/2,y=rect.top+(rect.height-height)/2;
 return [{x,y},{x:x+width,y},{x:x+width,y:y+height},{x,y:y+height}];
}

export function imageOrigin(image,slug){
 return image?{slug,quad:()=>image.isConnected?imageQuad(image):null,hide:()=>image.style.visibility='hidden',restore:()=>image.style.removeProperty('visibility')}:null;
}

export class ArticleTransition{
 constructor(dialog,scene,reduced){
  this.dialog=dialog;this.scene=scene;this.reduced=reduced;this.animations=[];this.version=0;
  addEventListener('resize',()=>{if(dialog.classList.contains('is-transitioning'))this.reset();});
 }
 animate(element,frames,options){const animation=element.animate(frames,{fill:'both',...options});this.animations.push(animation);return animation;}
 cancelAnimations(){for(const animation of this.animations)animation.cancel();this.animations=[];}
 reset(){
  this.version++;this.cancelAnimations();this.flight?.remove();this.flight=null;
  this.image?.style.removeProperty('visibility');this.origin?.restore();this.origin=null;
  this.dialog.classList.remove('is-transitioning');this.dialog.style.removeProperty('background-color');
  this.scene.style.removeProperty('transform');this.scene.style.removeProperty('filter');
 }
 async open(image,origin){
  this.reset();this.image=image;this.origin=origin;
  if(!origin||this.reduced.matches)return;
  const quad=origin.quad();if(!quad)return;
  const version=this.version;
  this.dialog.classList.add('is-transitioning');this.dialog.style.backgroundColor='transparent';
  // A short decode wait avoids a blank flying image on a cold connection.
  await Promise.race([image.decode().catch(()=>{}),new Promise(resolve=>setTimeout(resolve,300))]);
  if(version!==this.version)return;
  if(!image.complete||!image.naturalWidth){this.reset();return;}
  const width=image.naturalWidth,height=image.naturalHeight;
  const from=quadTransform(quad,width,height),to=quadTransform(imageQuad(image),width,height);
  if(!from||!to){this.reset();return;}
  const flight=image.cloneNode();flight.alt='';flight.setAttribute('aria-hidden','true');flight.className='tile-flight';
  flight.style.width=`${width}px`;flight.style.height=`${height}px`;flight.style.transform=from;
  this.dialog.append(flight);this.flight=flight;this.image.style.visibility='hidden';origin.hide();
  this.animate(this.dialog,[{backgroundColor:'transparent'},{backgroundColor:'#090a09'}],{duration:680,easing:'ease-in'});
  this.animate(this.scene,[{transform:'scale(1)',filter:'brightness(1) blur(0px)'},{transform:'scale(.94)',filter:'brightness(.4) blur(3px)'}],{duration:700,easing:'cubic-bezier(.22,.75,.2,1)'});
  for(const content of this.dialog.querySelectorAll('#article-content,.reader-toolbar'))this.animate(content,[{opacity:0,translate:'0 16px'},{opacity:1,translate:'0 0'}],{duration:380,delay:320,easing:'ease-out'});
  const movement=this.animate(flight,[{transform:from},{transform:to}],{duration:700,easing:'cubic-bezier(.22,.75,.2,1)'});
  await movement.finished.catch(()=>{});
  if(version!==this.version)return;
  this.scene.style.transform='scale(.94)';this.scene.style.filter='brightness(.4) blur(3px)';
  this.cancelAnimations();flight.remove();this.flight=null;image.style.removeProperty('visibility');
  this.dialog.classList.remove('is-transitioning');this.dialog.style.removeProperty('background-color');
 }
 async close(){
  const origin=this.origin,image=this.image;
  if(!origin||!image?.isConnected||this.reduced.matches){this.reset();return;}
  const quad=origin.quad();if(!quad){this.reset();return;}
  // Preserve a flight already in progress when Escape is pressed quickly.
  const existing=this.flight;
  const current=existing?getComputedStyle(existing).transform:null;
  const sceneStyle=getComputedStyle(this.scene),sceneFrom={transform:sceneStyle.transform,filter:sceneStyle.filter};
  const background=getComputedStyle(this.dialog).backgroundColor;
  this.version++;const version=this.version;this.cancelAnimations();
  this.dialog.scrollTop=0;
  const width=image.naturalWidth||image.width,height=image.naturalHeight||image.height;
  const from=current||quadTransform(imageQuad(image),width,height),to=quadTransform(quad,width,height);
  if(!from||!to){this.reset();return;}
  const flight=existing||image.cloneNode();flight.alt='';flight.setAttribute('aria-hidden','true');flight.className='tile-flight';
  flight.style.width=`${width}px`;flight.style.height=`${height}px`;flight.style.transform=from;
  if(!existing)this.dialog.append(flight);this.flight=flight;image.style.visibility='hidden';origin.hide();
  this.dialog.classList.add('is-transitioning');
  this.animate(this.dialog,[{backgroundColor:background},{backgroundColor:'transparent'}],{duration:550,easing:'ease-out'});
  this.animate(this.scene,[sceneFrom,{transform:'scale(1)',filter:'brightness(1) blur(0px)'}],{duration:600,easing:'cubic-bezier(.4,0,.2,1)'});
  const movement=this.animate(flight,[{transform:from},{transform:to}],{duration:600,easing:'cubic-bezier(.4,0,.2,1)'});
  await movement.finished.catch(()=>{});
  if(version===this.version)this.reset();
 }
}
