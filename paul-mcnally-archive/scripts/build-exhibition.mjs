import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { loadExhibitionArticles } from '../exhibition/content.mjs';

const archive=path.resolve(process.env.PABLONET_CONTENT_ROOT||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const root=archive;
const source=path.join(root,'exhibition');
const out=path.resolve(process.env.EXHIBITION_OUTPUT||path.join(root,'public/exhibition'));
const base=(process.env.EXHIBITION_BASE??'/exhibition').replace(/\/$/,'');
const embedMedia=process.env.EXHIBITION_EMBED_MEDIA==='true';
// Give the image renderer a workspace-local font cache, including on restricted Windows hosts.
const fontCache=path.join(root,'.exhibition-cache/fontconfig');
await fs.mkdir(fontCache,{recursive:true});
const fontConfig=path.join(root,'.exhibition-cache/fonts.conf');
const xmlPath=s=>s.replaceAll('\\','/').replaceAll('&','&amp;');
await fs.writeFile(fontConfig,`<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "urn:fontconfig:fonts.dtd"><fontconfig><dir>${xmlPath(path.join(archive,'public/fonts/vt323'))}</dir><cachedir>${xmlPath(fontCache)}</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE=fontConfig;
async function dependency(name,entry){
  try{return await import(name);}catch{}
  const base=path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules');
  return import(pathToFileURL(path.join(base,name,entry)).href);
}
const {default:sharp}=await dependency('sharp','dist/index.cjs');
const {Marked}=await dependency('marked','lib/marked.esm.js');
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
await fs.mkdir(path.join(out,'data'),{recursive:true});
await fs.mkdir(path.join(out,'assets/previews'),{recursive:true});
await fs.mkdir(path.join(out,'assets/media'),{recursive:true});
await fs.cp(path.join(source,'src'),out,{recursive:true});
for(const name of ['index.html','app.js','styles.css']){
 const filename=path.join(out,name);
 let text=await fs.readFile(filename,'utf8');
 text=text.replace(/(["'])\/(assets\/|data\/|styles\.css|app\.js|favicon\.svg)/g,(_all,quote,asset)=>`${quote}${base}/${asset}`);
 if(base)text=text.replace(/href="\/" data-view="explore"/g,`href="${base}" data-view="explore"`);
 await fs.writeFile(filename,text);
}
await fs.cp(path.join(source,'vendor'),path.join(out,'assets/vendor'),{recursive:true});
await fs.cp(path.join(source,'audio'),path.join(out,'assets/audio'),{recursive:true});
await fs.cp(path.join(archive,'public/fonts/vt323'),path.join(out,'assets/fonts'),{recursive:true});
const raw=await loadExhibitionArticles(archive);
if(!raw.length)throw new Error('No illustrated articles were found for Exhibition.');
const atlasRows=Math.max(6,Math.ceil(raw.length/7));
const localMedia=new Set();
const known=new Map(raw.map(a=>[`/${a.kind}/${a.slug}`,a.slug]));
function safeUrl(href){return /^(?:https?:\/\/|\/[^/]|#[\w-]|mailto:)/i.test(href||'')?href:'';}
function mediaUrl(href){
 if(!safeUrl(href))return '';
 if(!href.startsWith('/'))return href;
 const normalized=path.posix.normalize(href.split(/[?#]/)[0]);
 if(!normalized.startsWith('/')||normalized.includes('..'))return '';
 localMedia.add(normalized);return embedMedia?`${base}/assets/media${normalized}`:normalized;
}
const markdown=new Marked({gfm:true,breaks:false,renderer:{
 html({text}){return /^<br\s*\/?>$/i.test(text.trim())?'<br>':escape(text);},
 link({href,title,tokens}){const url=safeUrl(href);const slug=known.get(href?.split('#')[0]);const label=this.parser.parseInline(tokens);if(!url)return label;const destination=slug?`?article=${slug}`:url.startsWith('/')?`https://paulmcnally.online${url}`:url;return `<a href="${escape(destination)}"${slug?' data-article="'+escape(slug)+'"':destination.startsWith('http')?' target="_blank" rel="noopener noreferrer"':''}${title?' title="'+escape(title)+'"':''}>${label}</a>`;},
 image({href,title,text}){const url=mediaUrl(href);if(!url)return '';return `<figure><img src="${escape(url)}" alt="${escape(text)}" loading="lazy" decoding="async">${title?'<figcaption>'+escape(title)+'</figcaption>':''}</figure>`;}
}});
const short=(s,n=42)=>s.length>n?s.slice(0,n-1).trim()+'…':s;
const fontFile=path.join(archive,'public/fonts/vt323/VT323-Regular.ttf');
async function stamp(text,size,color){
 const buffer=await sharp({text:{text:`<span foreground="${color}">${escape(text)}</span>`,font:`VT323 ${size}`,fontfile:fontFile,rgba:true,dpi:72}}).png().toBuffer({resolveWithObject:true});
 return buffer;
}
const cells=[];
const articles=[];
for(let index=0;index<raw.length;index++){
 const a=raw[index];
 const source=path.join(archive,'public',a.originalImage);
 const preview=`${base}/assets/previews/${a.slug}.webp`;
 await sharp(source).resize({width:1000,height:780,fit:'inside',withoutEnlargement:true}).webp({quality:85,effort:4}).toFile(path.join(out,'assets/previews',`${a.slug}.webp`));
 const image=await sharp(source).resize({width:464,height:342,fit:'inside'}).toBuffer({resolveWithObject:true});
 const badge=a.kind==='blog'?'JOURNAL':a.kind.toUpperCase();
 const svg='<svg width="512" height="460" xmlns="http://www.w3.org/2000/svg"><path d="M0 459.5H512M511.5 0V460" stroke="#292b29"/></svg>';
 const publication=await stamp(short(a.publication.toUpperCase(),30),19,'#b5b5b0');
 const number=await stamp(String(index+1).padStart(3,'0'),19,'#b5b5b0');
 const title=await stamp(short(a.title,48),23,'#eeeae1');
 const footer=await stamp(`${badge} · ${a.date?.slice(0,4)}`,17,'#9da492');
 const cell=await sharp({create:{width:512,height:460,channels:3,background:'#090a09'}}).composite([{input:image.data,left:Math.round((512-image.info.width)/2),top:42+Math.round((342-image.info.height)/2)},{input:Buffer.from(svg),left:0,top:0},{input:publication.data,left:24,top:13},{input:number.data,left:488-number.info.width,top:13},{input:title.data,left:24,top:398},{input:footer.data,left:24,top:433}]).png().toBuffer();
 cells.push({input:cell,left:(index%7)*512,top:Math.floor(index/7)*460});
 const bodyHtml=markdown.parse(a.body);
 articles.push({slug:a.slug,title:a.title,excerpt:a.excerpt,publication:a.publication,date:a.date,kind:a.kind,category:a.category||'',tag:a.tag||'',topics:(a.topics||'').split(',').map(x=>x.trim()).filter(Boolean),href:`/${a.kind}/${a.slug}`,image:preview,heroImage:preview,bodyHtml,sourceUrl:safeUrl(a.sourceUrl),author:a.author||'Paul McNally',atlasIndex:index,readingMinutes:Math.max(1,Math.round(a.body.split(/\s+/).length/230))});
}
await sharp({create:{width:3584,height:atlasRows*460,channels:3,background:'#090a09'}}).composite(cells).webp({quality:87,effort:5}).toFile(path.join(out,'assets/wall-atlas.webp'));
const copied=[];const missing=[];
for(const href of localMedia){
 const from=path.join(archive,'public',href);const dest=path.join(out,'assets/media',href);
 try{await fs.access(from);if(embedMedia){await fs.mkdir(path.dirname(dest),{recursive:true});await fs.copyFile(from,dest);}copied.push(href);}catch(error){missing.push(href);}
}
if(missing.length)throw new Error(`Article media missing: ${missing.join(', ')}`);
const about=JSON.parse(await fs.readFile(path.join(archive,'data/about.json'),'utf8'));
const contact=JSON.parse(await fs.readFile(path.join(archive,'data/contact.json'),'utf8'));
const payload={title:'Exhibition — Paul McNally',articles,about,contact,atlas:{url:`${base}/assets/wall-atlas.webp`,columns:7,rows:atlasRows,cellWidth:512,cellHeight:460},sourceDigest:createHash('sha256').update(JSON.stringify(raw)).digest('hex')};
await fs.writeFile(path.join(out,'data/content.json'),JSON.stringify(payload));
const stats={articles:articles.length,localMedia:copied.length,atlasBytes:(await fs.stat(path.join(out,'assets/wall-atlas.webp'))).size,contentBytes:(await fs.stat(path.join(out,'data/content.json'))).size};
await fs.writeFile(path.join(out,'data/build.json'),JSON.stringify(stats,null,2));
console.log('Exhibition built:',JSON.stringify(stats));
