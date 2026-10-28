import fs from 'node:fs/promises';
import path from 'node:path';

export const directories={features:'content/portfolio/features',interviews:'content/portfolio/interviews',opinion:'content/portfolio/opinion',reviews:'content/reviews',blog:'content/blog'};
export function parseArticle(text,name='article'){
 const parts=text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
 if(!parts)throw new Error(`Missing front matter: ${name}`);
 const meta=Object.fromEntries(parts[1].split(/\r?\n/).filter(l=>l.includes(':')).map(l=>{const i=l.indexOf(':');return[l.slice(0,i).trim(),l.slice(i+1).trim().replace(/^["']|["']$/g,'')];}));
 return {...meta,body:parts[2]};
}
export async function loadExhibitionArticles(archive){
 const registry=await fs.readFile(path.join(archive,'data/portfolioPreviews.ts'),'utf8');
 const mappings=new Map([...registry.matchAll(/"([^"]+)":\s*"([^"]+)"/g)].map(m=>[m[1],m[2]]));
 const articles=[];
 for(const [kind,dir] of Object.entries(directories)){
  for(const name of (await fs.readdir(path.join(archive,dir))).filter(n=>n.endsWith('.md')&&n.toLowerCase()!=='readme.md')){
   const meta=parseArticle(await fs.readFile(path.join(archive,dir,name),'utf8'),name);
   // The publisher saves micronetImage directly in front matter. The registry is only a legacy fallback.
   const originalImage=meta.micronetImage?.trim()||mappings.get(meta.slug);
   if(originalImage)articles.push({...meta,publication:meta.publication||'Independent writing',author:meta.author||'Paul McNally',kind,originalImage});
  }
 }
 const order=[...mappings.keys()];
 return articles.sort((a,b)=>{
  const ai=order.indexOf(a.slug),bi=order.indexOf(b.slug);
  if(ai>=0&&bi>=0)return ai-bi;
  if(ai>=0)return -1;if(bi>=0)return 1;
  return b.date.localeCompare(a.date)||a.slug.localeCompare(b.slug);
 });
}
