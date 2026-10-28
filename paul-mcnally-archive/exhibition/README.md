# Exhibition

The third site edition lives at `/exhibition`, alongside Pablonet and Pro. It keeps the Pablonet wordmark and offers a curved WebGL image wall, index, filters, reader and About section. It is served as an independent HTML document so terminal/Pro scripts and styles do not affect its renderer.

`npm run build` automatically runs `scripts/build-exhibition.mjs` before the Next.js build. It creates ignored static output in `public/exhibition/`. The Next rewrite serves its HTML at `/exhibition` and retains query-based article links. Source files and the vendored MIT-licensed Three.js modules live here.

## Publishing articles

The article editor saves `micronetImage` (the Pablonet featured image) into article front matter. `content.mjs` discovers it automatically, with `data/portfolioPreviews.ts` retained only as a fallback for older material. There is no new manual image list to update. Publishing the article and images to GitHub triggers the existing Vercel deployment; Exhibition is regenerated along with both other editions. It becomes visible after that deployment succeeds. An already-open tab needs refreshing to load the new build.

Portfolio features, interviews, opinion and reviews plus Journal posts with a Pablonet illustration are included. Articles without dedicated artwork are not put into the wall automatically. The renderer uses a texture-based index so the collection is not limited to the prototype's original 64 uniform slots.

The main build references existing article media directly instead of duplicating it. The standalone local preview at `../pablonet-3d` invokes the same builder with a different output directory and embeds those media files for its small static server.

## Interaction

Hover gives a 340 ms horizontal glitch and RGB split, then settles. There is no green hover rectangle. It is disabled for reduced-motion visitors, who initially see the index. Rendering pauses when static or hidden.

Paul's original `stars.wav` supplies the looping soundtrack, delivered as `audio/stars.mp3` (about 2.3 MB). The original WAV is retained locally in the standalone project's ignored `audio-masters/` directory. Sound starts off and the audio context is created only after a visitor enables it. Dragging bends playback speed/pitch according to distance from viewport centre, with a 100 ms press threshold and a smooth release back to the original rate. It is clamped above zero to avoid stalls, fades on mute, and suspends while the page is hidden. The article reader also has a sound switch. The Phantom teardown notes remain in `phantom-research/AUDIO.md`; no Phantom sound recordings are included.

## Checks

`npm run check:publish` runs the content audit, Node tests (including an actual editor-format article-discovery fixture), Exhibition generation and the production Next build. Browser checks should cover the three edition links, the independent Exhibition document, story selection/filtering and desktop/mobile layouts. No live editor publication or contact submission is required for QA.
