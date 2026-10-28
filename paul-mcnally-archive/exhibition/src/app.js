import * as THREE from '/assets/vendor/three.module.js';
import {pointToCell,articleAtCell,isClick} from './wall-math.js';
import {ExhibitionAudio} from './audio.js';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const html=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={features:'Features',interviews:'Interviews',reviews:'Reviews',opinion:'Opinion',blog:'Journal'};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const state={data:null,view:'explore',kind:'',publication:'',topic:'',search:'',filtered:[],wall:null,wallPromise:null,wallUnavailable:false,activeArticle:null,articleOpenedHere:false,audio:null};
const date=iso=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric'}).format(new Date(`${iso}T12:00:00`));
const short=(str,n=96)=>str.length>n?str.slice(0,n-1)+'…':str;
function notify(message){const el=$('#app-message');el.textContent=message;el.hidden=false;clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.hidden=true,5000);}
function articleUrl(article){const query=new URLSearchParams();if(state.view!=='explore')query.set('view',state.view);query.set('article',article.slug);return '?'+query;}
function navigateView(view,push=true){
 if(!['explore','index','about'].includes(view))view='explore';
 if(view==='explore'&&state.wallUnavailable){view='index';notify('The image wall is unavailable on this device. You can explore every story in the index.');}
 state.view=view;for(const name of ['explore','index','about'])$(`#${name}-view`).hidden=name!==view;
 $$('.main-nav a').forEach(a=>{if(a.dataset.view===view)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 document.body.classList.toggle('list-mode',view==='index');document.body.classList.toggle('about-mode',view==='about');
 $('#collection-count').textContent=`${state.filtered.length} ${state.filtered.length===1?'STORY':'STORIES'} IN THE COLLECTION`;
 $('#open-filter').hidden=view==='about';
 if(view==='explore')ensureWall();
 if(push){const u=new URL(location.href);u.searchParams.delete('article');view==='explore'?u.searchParams.delete('view'):u.searchParams.set('view',view);history.pushState({view},'',u);}
 document.title=view==='explore'?'Exhibition — The work & words of Paul McNally':`${view==='index'?'The collection':'About Paul McNally'} — Exhibition`;
 state.wall?.setVisible(view==='explore'&&!$('#article-dialog').open&&!$('#filter-dialog').open);
}
function matchesTopic(a,topic){
 const text=`${a.title} ${a.slug} ${a.tag} ${a.topics.join(' ')}`;
 return !topic||({retro:/retro|amiga|commodore|mister|fpga|prestel|micronet|amberstar|intellivision|8bitdo|ere-informatique|jobs-vs-gates|old.consoles/i,games:/game|arcade|pinball|nba.jam|kitzrow|mutant.football|ssx|slipknot/i,tech:/tech|3d.print|3d.scan|laser|uv.print|eufymake|acmer|moose|monitor|screenbar|flexispot|telescope|keyboard/i,simulation:/simulat|dcs.world|head.track|delanclip|drone.sim|eve.fanfest/i}[topic]?.test(text));
}
function filterArticles(){
 const query=state.search.trim().toLocaleLowerCase();
 state.filtered=state.data.articles.filter(a=>(!state.kind||a.kind===state.kind)&&(!state.publication||a.publication===state.publication)&&matchesTopic(a,state.topic)&&(!query||`${a.title} ${a.excerpt} ${a.publication} ${a.tag} ${a.kind} ${a.topics.join(' ')}`.toLocaleLowerCase().includes(query)));
 renderIndex();state.wall?.setArticles(state.filtered);
 $('#index-total').textContent=`${state.filtered.length} ${state.filtered.length===1?'story':'stories'}`;
 $('#filter-results').textContent=state.filtered.length;
 $('#collection-count').textContent=`${state.filtered.length} ${state.filtered.length===1?'STORY':'STORIES'} IN THE COLLECTION`;
 const count=[state.kind,state.publication,state.topic,state.search.trim()].filter(Boolean).length;
 $('#filter-count').textContent=count;$('#filter-count').hidden=count===0;
 $('#index-search').value=state.search;$('#filter-search').value=state.search;
 $$('#kind-filters button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.kind===state.kind)));
 $('#publication-filter').value=state.publication;$('#topic-filter').value=state.topic;
 if(!state.filtered.length&&state.view==='explore'){
  $('.explore-caption').classList.add('is-visible');$('.caption-kicker').textContent='NOTHING DOWN THIS RABBIT HOLE';$('.explore-caption p').textContent='Try a different search.';$('#selected-link').hidden=true;
 }
}
function resetFilters(){state.kind='';state.publication='';state.topic='';state.search='';filterArticles();}
function renderIndex(){
 const groups=Map.groupBy?Map.groupBy([...state.filtered].sort((a,b)=>b.date.localeCompare(a.date)),a=>a.date.slice(0,4)):groupYears(state.filtered);
 if(!state.filtered.length){$('#story-index').innerHTML='<div class="empty-state"><span class="eyebrow">NO SIGNAL THIS TIME</span><h2>No stories found.</h2><p>Try a broader search or clear your filters.</p><button class="pill" data-reset-filters>Show all stories ↗</button></div>';return;}
 $('#story-index').innerHTML=[...groups].map(([year,articles])=>`<section class="year-group" aria-label="Stories from ${html(year)}"><h2 class="year-label">${html(year)}</h2><div class="year-stories">${articles.map(a=>`<a class="story-row" href="${html(articleUrl(a))}" data-article="${html(a.slug)}"><span class="story-name"><img src="${html(a.image)}" alt="" loading="lazy" width="60" height="45"><span>${html(a.title)}</span></span><span class="kind-tag">${html(labels[a.kind])}</span><span class="publication">${html(a.publication)}</span></a>`).join('')}</div></section>`).join('');
}
function groupYears(articles){const groups=new Map();for(const a of [...articles].sort((a,b)=>b.date.localeCompare(a.date))){const year=a.date.slice(0,4);if(!groups.has(year))groups.set(year,[]);groups.get(year).push(a);}return groups;}
function renderAbout(){
 const data=state.data;
 $('#about-intro').textContent=data.about.intro;
 const preferred=['amiga-a500-mini-retro-creators-interview','eve-fanfest-hilmar-interview-25-years','prestel-micronet-lost-online-world','jobs-vs-gates'];
 $('#about-strip').innerHTML=preferred.map(slug=>data.articles.find(a=>a.slug===slug)).filter(Boolean).map(a=>`<img src="${html(a.image)}" alt="" loading="lazy">`).join('');
 $('#about-panels').innerHTML=data.about.panels.map(panel=>`<section class="about-section"><h2>${html(panel.title)}</h2><div>${panel.title==='SELECTED PUBLICATIONS'?`<div class="publication-cloud">${panel.paragraphs.map(p=>`<span>${html(p)}</span>`).join('')}</div>`:panel.paragraphs.map(p=>`<p>${html(p)}</p>`).join('')}</div></section>`).join('');
 $('#contact-intro').textContent=data.contact.intro;
 $('#contact-links').innerHTML=data.contact.links.map(l=>`<a href="${html(l.href)}" target="_blank" rel="noopener noreferrer">${html(l.label)} <span aria-hidden="true">↗</span></a>`).join('');
}
function openArticle(slug,push=true){
 const a=state.data.articles.find(a=>a.slug===slug);
 if(!a){notify('That story is not in this collection yet.');return;}
 const index=state.data.articles.indexOf(a),next=state.data.articles[(index+1)%state.data.articles.length];
 state.activeArticle=a;
 const dialog=$('#article-dialog');
 $('#reader-position').textContent=`${String(index+1).padStart(3,'0')} / ${String(state.data.articles.length).padStart(3,'0')} STORIES`;
 $('#article-content').innerHTML=`<header class="reader-hero"><div class="reader-meta"><span>${html(labels[a.kind])} / ${html(a.publication)}</span><span>${html(date(a.date))} · ${a.readingMinutes} MIN READ</span></div><h1 id="article-title">${html(a.title)}</h1><div class="reader-art"><img src="${html(a.heroImage)}" alt="Pablonet artwork for ${html(a.title)}" width="1000" height="750"><div><p class="reader-excerpt">${html(a.excerpt)}</p><p class="reader-source">By ${html(a.author)}. Originally published by ${html(a.publication)} on ${html(date(a.date))}.<br>${a.sourceUrl?`<a href="${html(a.sourceUrl)}" target="_blank" rel="noopener noreferrer">Read at the original publication ↗</a>`:''}</p></div></div></header><div class="reader-body">${a.bodyHtml}</div><footer class="reader-next"><span class="eyebrow">ONE MORE RABBIT HOLE</span><a href="${html(articleUrl(next))}" data-article="${html(next.slug)}">${html(next.title)} <span aria-hidden="true">↗</span></a></footer>`;
 if(!dialog.open)dialog.showModal();
 dialog.scrollTop=0;$('#reader-progress').style.width='0';document.body.classList.add('reader-open');
 state.wall?.setVisible(false);
 document.title=`${a.title} — Pablonet`;
 if(push){history.pushState({article:slug},'',articleUrl(a));state.articleOpenedHere=true;}
 $('#close-article').focus({preventScroll:true});
}
function closeArticle(){
 const dialog=$('#article-dialog');if(dialog.open)dialog.close();
 state.activeArticle=null;document.body.classList.remove('reader-open');
 const u=new URL(location.href);u.searchParams.delete('article');history.pushState({view:state.view},'',u);
 navigateView(state.view,false);
 if(state.view==='explore')$('#wall').focus({preventScroll:true});
}
function syncRoute(){
 if(!state.data)return;
 const query=new URLSearchParams(location.search);
 const view=query.get('view')||(reduced.matches?'index':'explore');
 if($('#article-dialog').open)$('#article-dialog').close();document.body.classList.remove('reader-open');
 navigateView(view,false);
 const slug=query.get('article');if(slug)openArticle(slug,false);
}
function openFilter(){const dialog=$('#filter-dialog');if(!dialog.open)dialog.showModal();state.wall?.setVisible(false);$('#filter-search').focus({preventScroll:true});}
function closeFilter(){if($('#filter-dialog').open)$('#filter-dialog').close();state.wall?.setVisible(state.view==='explore'&&!$('#article-dialog').open);}
function selectionChanged(article,keyboard=false){
 const caption=$('.explore-caption');
 if(!article){caption.classList.remove('is-visible');$('#selected-link').hidden=true;return;}
 $('.caption-kicker').textContent=`${labels[article.kind].toUpperCase()} / ${article.publication.toUpperCase()} / ${article.date.slice(0,4)}`;
 $('.explore-caption p').textContent=short(article.title,115);caption.classList.add('is-visible');
 $('#wall-selection').textContent=article.title;
 const link=$('#selected-link');link.href=articleUrl(article);link.dataset.article=article.slug;link.hidden=!keyboard;
}
async function ensureWall(){
 if(state.wall){state.wall.setVisible(true);return;}
 if(state.wallPromise)return state.wallPromise;
 state.wallPromise=(async()=>{
  await Promise.resolve();
  try{state.wall=new StoryWall($('#wall'),state.data,state.filtered,selectionChanged,a=>openArticle(a.slug));await state.wall.load();state.wall.setVisible(state.view==='explore'&&!$('#article-dialog').open&&!$('#filter-dialog').open);}
  catch(error){console.warn('The image wall could not start.',error);state.wallUnavailable=true;$('#wall-loader').hidden=true;navigateView('index');notify('The collection is available in Index view on this device.');}
 })();return state.wallPromise;
}

class StoryWall{
 constructor(element,data,articles,onSelect,onOpen){
  this.element=element;this.data=data;this.articles=articles;this.onSelect=onSelect;this.onOpen=onOpen;
  this.pan={x:3.5,y:1.35};this.initialPan={...this.pan};this.velocity={x:0,y:0};
  this.scale=innerWidth<760?3.8:3.1;this.targetScale=this.scale;this.bend=reduced.matches?0:-.07;
  this.pointer=null;this.hover=null;this.selected=null;this.visible=false;this.lastTime=0;this.frame=0;this.lastMoveAt=0;this.lastAnnounced='';this.hoverCellKey='';this.hoverAt=-1000;this.glitchUntil=0;
  this.renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:'low-power'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.setClearColor(0x090a09);this.element.append(this.renderer.domElement);
  this.uniforms={uAtlas:{value:null},uAtlasGrid:{value:new THREE.Vector2(data.atlas.columns,data.atlas.rows)},uAspect:{value:1},uScale:{value:this.scale},uPan:{value:new THREE.Vector2(this.pan.x,this.pan.y)},uBend:{value:this.bend},uCount:{value:articles.length},uIndexMap:{value:null},uIndexWidth:{value:1},uHoverCell:{value:new THREE.Vector2(9999,9999)},uGlitchTime:{value:1},uGlitchStrength:{value:reduced.matches?0:1},uReady:{value:0}};
  this.scene=new THREE.Scene();this.camera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  this.material=new THREE.ShaderMaterial({uniforms:this.uniforms,depthTest:false,depthWrite:false,
   vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
   fragmentShader:`
    uniform sampler2D uAtlas;
    uniform vec2 uAtlasGrid;
    uniform float uAspect; uniform float uScale; uniform vec2 uPan; uniform float uBend;
    uniform int uCount; uniform sampler2D uIndexMap; uniform float uIndexWidth; uniform vec2 uHoverCell; uniform float uGlitchTime; uniform float uGlitchStrength; uniform float uReady;
    varying vec2 vUv;
    float noise(vec2 seed){return fract(sin(dot(seed,vec2(127.1,311.7)))*43758.5453);}
    void main(){
     vec2 p=(vUv-.5)*2.;float factor=.91+uBend*dot(p,p);
     vec2 world=p*factor*vec2(uAspect,1.)*uScale*.5+uPan;
     vec2 grid=world/vec2(1.,.9);vec2 cell=floor(grid);vec2 local=fract(grid);
     vec3 color=vec3(.009,.012,.009);
     if(uCount>0){
      float item=mod(mod(cell.x+cell.y*13.,float(uCount))+float(uCount),float(uCount));
      vec2 packed=texture2D(uIndexMap,vec2((item+.5)/uIndexWidth,.5)).rg;
      float atlas=floor(packed.r*255.+.5)+floor(packed.g*255.+.5)*256.;vec2 tile=vec2(mod(atlas,uAtlasGrid.x),floor(atlas/uAtlasGrid.x));
      float hover=1.-step(.1,distance(cell,uHoverCell));
      float glitch=hover*uGlitchStrength*(1.-smoothstep(.03,.34,uGlitchTime));
      float row=floor(local.y*32.);float beat=floor(uGlitchTime*28.);
      float slice=step(.7,noise(vec2(row,beat)));
      float shift=(noise(vec2(beat,row+7.))-.5)*.055*slice*glitch;
      vec2 shifted=vec2(clamp(local.x+shift,.001,.999),local.y);
      vec2 sampleUv=vec2((tile.x+shifted.x)/uAtlasGrid.x,1.-(tile.y+1.-shifted.y)/uAtlasGrid.y);
      color=texture2D(uAtlas,sampleUv).rgb;
      vec2 split=vec2(.008*glitch/uAtlasGrid.x,0.);
      color.r=texture2D(uAtlas,sampleUv+split).r;
      color.b=texture2D(uAtlas,sampleUv-split).b;
      color*=1.-.14*glitch*step(.5,fract(local.y*140.));
     }
     float vignette=1.-smoothstep(.35,1.5,length(p*vec2(.75,.7)))*.43;
     color*=vignette;
     gl_FragColor=vec4(color*uReady,1.);
     #include <colorspace_fragment>
    }`
  });
  this.mesh=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.material);this.scene.add(this.mesh);
  this.setArticles(articles);this.resize();
  this.onResize=()=>this.resize();addEventListener('resize',this.onResize);
  this.element.addEventListener('pointerdown',e=>this.down(e));
  this.element.addEventListener('pointermove',e=>this.move(e));
  this.element.addEventListener('pointerup',e=>this.up(e));
  this.element.addEventListener('pointercancel',()=>{this.pointer=null;this.velocity={x:0,y:0};this.element.classList.remove('is-dragging');state.audio?.endDrag();});
  this.element.addEventListener('pointerleave',()=>{if(!this.pointer){this.hover=null;this.updateSelection(null);this.requestFrame();}});
  this.element.addEventListener('wheel',e=>this.wheel(e),{passive:false});
  this.element.addEventListener('keydown',e=>this.key(e));
  this.element.addEventListener('focus',()=>{this.hover={x:this.width/2,y:this.height/2};this.updateHover(true);});
  this.element.addEventListener('blur',()=>{$('#selected-link').hidden=true;});
  this.renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();this.setVisible(false);state.wallUnavailable=true;navigateView('index');notify('The collection has switched to Index view.');});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(this.frame);this.frame=0;}else if(this.visible)this.requestFrame();});
 }
 async load(){
  const texture=await new THREE.TextureLoader().loadAsync(this.data.atlas.url);
  texture.colorSpace=THREE.SRGBColorSpace;texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;texture.generateMipmaps=false;
  this.uniforms.uAtlas.value=texture;this.uniforms.uReady.value=1;this.ready=true;
  this.renderer.render(this.scene,this.camera);this.element.classList.add('is-ready');this.element.dataset.ready='true';
  $('#wall-loader').setAttribute('aria-hidden','true');
  if(this.visible)this.requestFrame();
 }
 resize(){this.width=this.element.clientWidth||innerWidth;this.height=this.element.clientHeight||innerHeight;this.renderer.setSize(this.width,this.height);this.uniforms.uAspect.value=this.width/this.height;if(this.ready)this.renderer.render(this.scene,this.camera);this.requestFrame();}
 setArticles(articles){
  this.articles=articles;this.uniforms.uCount.value=articles.length;
  const width=Math.max(1,articles.length),mapping=new Uint8Array(width*4);
  articles.forEach((a,i)=>{mapping[i*4]=a.atlasIndex%256;mapping[i*4+1]=Math.floor(a.atlasIndex/256);mapping[i*4+3]=255;});
  this.indexTexture?.dispose();this.indexTexture=new THREE.DataTexture(mapping,width,1,THREE.RGBAFormat,THREE.UnsignedByteType);
  this.indexTexture.minFilter=THREE.NearestFilter;this.indexTexture.magFilter=THREE.NearestFilter;this.indexTexture.generateMipmaps=false;this.indexTexture.needsUpdate=true;
  this.uniforms.uIndexMap.value=this.indexTexture;this.uniforms.uIndexWidth.value=width;
  this.updateSelection(null);this.requestFrame();
 }
 setVisible(value){this.visible=value;if(value)this.requestFrame();else{cancelAnimationFrame(this.frame);this.frame=0;this.velocity={x:0,y:0};}}
 requestFrame(){if(this.frame||!this.visible||!this.ready||document.hidden)return;this.frame=requestAnimationFrame(t=>this.tick(t));}
 tick(time){
  this.frame=0;const dt=Math.min((time-(this.lastTime||time-16))/1000,.04);this.lastTime=time;
  let moving=false;
  if(!this.pointer&&!reduced.matches){this.pan.x+=this.velocity.x*dt;this.pan.y+=this.velocity.y*dt;const friction=Math.exp(-6*dt);this.velocity.x*=friction;this.velocity.y*=friction;moving=Math.abs(this.velocity.x)+Math.abs(this.velocity.y)>.003;}
  const zoomDelta=this.targetScale-this.scale;this.scale+=reduced.matches?zoomDelta:zoomDelta*Math.min(1,dt*10);moving=moving||Math.abs(zoomDelta)>.001;
  this.uniforms.uScale.value=this.scale;this.uniforms.uPan.value.set(this.pan.x,this.pan.y);
  if(this.hover&&!this.pointer)this.updateHover();
  this.uniforms.uGlitchTime.value=Math.max(0,(time-this.hoverAt)/1000);
  this.renderer.render(this.scene,this.camera);
  if(moving||this.pointer||time<this.glitchUntil)this.requestFrame();
 }
 pick(x,y){const cell=pointToCell(x,y,this.width,this.height,this.pan,this.scale,this.bend);return{cell,article:articleAtCell(cell,this.articles)};}
 updateHover(keyboard=false){if(!this.hover)return;const {cell,article}=this.pick(this.hover.x,this.hover.y);const key=`${cell.x},${cell.y}`;if(key!==this.hoverCellKey){this.hoverCellKey=key;this.hoverAt=performance.now();this.glitchUntil=reduced.matches?0:this.hoverAt+360;}this.uniforms.uHoverCell.value.set(cell.x,cell.y);this.updateSelection(article,keyboard);}
 updateSelection(article,keyboard=false){this.selected=article;this.element.classList.toggle('has-hover',!!article&&!this.pointer);if(article?.slug!==this.lastAnnounced||keyboard){this.lastAnnounced=article?.slug;this.onSelect(article,keyboard);}if(!article){this.uniforms.uHoverCell.value.set(9999,9999);this.hoverCellKey='';}}
 down(e){
  if(e.button!==0||this.pointer)return;
  this.element.focus({preventScroll:true});this.element.setPointerCapture(e.pointerId);
  this.pointer={id:e.pointerId,x:e.clientX,y:e.clientY,startX:e.clientX,startY:e.clientY,time:performance.now(),last:performance.now(),distance:0};this.velocity={x:0,y:0};this.hover=null;
  state.audio?.beginDrag(e.clientX/this.width,e.clientY/this.height);
 }
 move(e){
  const rect=this.element.getBoundingClientRect();
  if(!this.pointer){if(e.pointerType==='touch')return;this.hover={x:e.clientX-rect.left,y:e.clientY-rect.top};this.updateHover();this.requestFrame();return;}
  if(e.pointerId!==this.pointer.id)return;
  state.audio?.moveDrag(e.clientX/this.width,e.clientY/this.height);
  const p=this.pointer;const now=performance.now();const elapsed=Math.max((now-p.last)/1000,.008);
  const dx=e.clientX-p.x,dy=e.clientY-p.y;const k=this.scale*.91/this.height;
  const px=-dx*k,py=dy*k;this.pan.x+=px;this.pan.y+=py;
  this.velocity.x=this.velocity.x*.4+(px/elapsed)*.6;this.velocity.y=this.velocity.y*.4+(py/elapsed)*.6;
  p.distance=Math.max(p.distance,Math.hypot(e.clientX-p.startX,e.clientY-p.startY));p.x=e.clientX;p.y=e.clientY;p.last=now;
  if(p.distance>6){this.element.classList.add('is-dragging');this.updateSelection(null);this.dismissHint();}
  e.preventDefault();this.requestFrame();
 }
 up(e){
  if(!this.pointer||e.pointerId!==this.pointer.id)return;
  const p=this.pointer;this.pointer=null;this.element.classList.remove('is-dragging');
  state.audio?.endDrag();
  if(performance.now()-p.last>100)this.velocity={x:0,y:0};
  if(isClick(p.distance,performance.now()-p.time)){
   const rect=this.element.getBoundingClientRect();const {article}=this.pick(e.clientX-rect.left,e.clientY-rect.top);if(article)this.onOpen(article);
  }else{this.hover=e.pointerType==='touch'?null:{x:e.clientX,y:e.clientY};this.requestFrame();}
 }
 wheel(e){e.preventDefault();this.targetScale=Math.max(1.8,Math.min(4.7,this.targetScale+e.deltaY*.0015));this.dismissHint();this.requestFrame();}
 key(e){
  const moves={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,.9],ArrowDown:[0,-.9]};
  if(moves[e.key]){e.preventDefault();this.pan.x+=moves[e.key][0];this.pan.y+=moves[e.key][1];this.velocity={x:0,y:0};this.hover={x:this.width/2,y:this.height/2};this.updateHover(true);this.dismissHint();this.requestFrame();}
  if(e.key==='Enter'){e.preventDefault();const {article}=this.pick(this.width/2,this.height/2);if(article)this.onOpen(article);}
  if(e.key==='Home'){e.preventDefault();this.reset();}
  if(e.key==='+'||e.key==='='){this.targetScale=Math.max(1.8,this.targetScale-.3);this.requestFrame();}
  if(e.key==='-'){this.targetScale=Math.min(4.7,this.targetScale+.3);this.requestFrame();}
 }
 reset(){this.pan={...this.initialPan};this.velocity={x:0,y:0};this.targetScale=innerWidth<760?3.8:3.1;this.hover=null;this.updateSelection(null);this.requestFrame();}
 dismissHint(){$('#wall-hint').classList.add('dismissed');}
}

function bindEvents(){
 document.addEventListener('click',e=>{
  const sound=e.target.closest('[data-sound]');if(sound){state.audio?.setEnabled(!state.audio.wanted);return;}
  const article=e.target.closest('[data-article]');if(article){e.preventDefault();openArticle(article.dataset.article);return;}
  const view=e.target.closest('[data-view]');if(view){e.preventDefault();navigateView(view.dataset.view);if(view.dataset.view==='index')renderIndex();return;}
  if(e.target.closest('[data-contact]')){$('#contact-dialog').showModal();state.wall?.setVisible(false);}
  if(e.target.closest('[data-reset-filters]'))resetFilters();
 });
 $('#open-filter').addEventListener('click',openFilter);$('#index-filter').addEventListener('click',openFilter);
 $('#close-filter').addEventListener('click',closeFilter);$('#filter-dialog').addEventListener('click',e=>{if(e.target===$('#filter-dialog'))closeFilter();});
 $('#filter-dialog').addEventListener('close',()=>state.wall?.setVisible(state.view==='explore'&&!$('#article-dialog').open));
 $('#show-results').addEventListener('click',()=>{closeFilter();if(!state.filtered.length)navigateView('index');});
 $('#clear-filters').addEventListener('click',resetFilters);
 for(const id of ['index-search','filter-search'])$('#'+id).addEventListener('input',e=>{state.search=e.target.value;filterArticles();});
 $('#publication-filter').addEventListener('change',e=>{state.publication=e.target.value;filterArticles();});
 $('#topic-filter').addEventListener('change',e=>{state.topic=e.target.value;filterArticles();});
 $('#kind-filters').addEventListener('click',e=>{const button=e.target.closest('[data-kind]');if(button){state.kind=button.dataset.kind;filterArticles();}});
 $('#reset-camera').addEventListener('click',()=>state.wall?.reset());
 $('#close-article').addEventListener('click',closeArticle);
 $('[data-reader-close]').addEventListener('click',e=>{e.preventDefault();closeArticle();});
 $('#article-dialog').addEventListener('cancel',e=>{e.preventDefault();closeArticle();});
 $('#article-dialog').addEventListener('scroll',()=>{const el=$('#article-dialog');const max=el.scrollHeight-el.clientHeight;$('#reader-progress').style.width=`${max>0?el.scrollTop/max*100:0}%`;},{passive:true});
 $('#close-contact').addEventListener('click',()=>$('#contact-dialog').close());
 $('#contact-dialog').addEventListener('click',e=>{if(e.target===$('#contact-dialog'))$('#contact-dialog').close();});
 $('#contact-dialog').addEventListener('close',()=>state.wall?.setVisible(state.view==='explore'&&!$('#article-dialog').open));
 $('.skip-link').addEventListener('click',e=>{e.preventDefault();navigateView('index');$('#story-index').focus();});
 addEventListener('popstate',syncRoute);
}
async function init(){
 try{
  const response=await fetch('/data/content.json');if(!response.ok)throw new Error(`Content returned ${response.status}`);state.data=await response.json();
  const kinds=['',...Object.keys(labels)];
  $('#kind-filters').innerHTML=kinds.map(kind=>`<button data-kind="${kind}" aria-pressed="${kind===''}">${kind?labels[kind]:'Everything'}<small>${kind?state.data.articles.filter(a=>a.kind===kind).length:state.data.articles.length}</small></button>`).join('');
  const publications=[...new Set(state.data.articles.map(a=>a.publication))].sort();
  $('#publication-filter').insertAdjacentHTML('beforeend',publications.map(p=>`<option value="${html(p)}">${html(p)}</option>`).join(''));
  state.audio=new ExhibitionAudio('/assets/audio/stars.mp3',(status,message)=>{
   $$('[data-sound]').forEach(button=>{button.disabled=status==='loading';button.setAttribute('aria-pressed',String(status==='on'));button.setAttribute('aria-label',status==='on'?'Turn sound off':'Turn sound on');button.querySelector('[data-sound-label]').textContent=status==='loading'?'SOUND […]':status==='on'?'SOUND [ON]':'SOUND [OFF]';});
   if(status==='error')notify(message||'The soundtrack could not load. Please try again.');
  });
  bindEvents();filterArticles();renderAbout();syncRoute();document.body.classList.remove('is-loading');
  if(innerWidth<760)$('#wall-hint').innerHTML='<span aria-hidden="true">↔</span> DRAG TO EXPLORE';
  const tick=()=>$('#local-clock').textContent=new Intl.DateTimeFormat('en-GB',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/London'}).format(new Date());tick();setInterval(tick,60000);
  document.documentElement.dataset.ready='true';
 }catch(error){console.error(error);document.body.classList.remove('is-loading');$('#wall-loader').innerHTML='<span>The archive could not load. <button onclick="location.reload()">Try again ↻</button></span>';notify('The archive could not load. Please refresh to try again.');}
}
init();
