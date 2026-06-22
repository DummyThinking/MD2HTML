const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const renderTree = (nodes) =>
  `<ul>${nodes
    .map((n) =>
      n.dir
        ? `<li class="dir"><details open><summary>${esc(n.name)}</summary>${renderTree(n.children)}</details></li>`
        : `<li class="file"><a data-key="${esc(n.key)}" href="#/${esc(n.key)}">${esc(n.name)}</a></li>`
    )
    .join('')}</ul>`;

/**
 * @param {import('./bundle.mjs').Site} site
 * @returns {string}
 */
export const renderSite = ({ pages, tree, order = [], indexKey, siteTitle, usesMermaid, mermaidLib, favicon, defaultTheme = 'light' }) => {
  const data = JSON.stringify({ pages, indexKey, order }).replace(/</g, '\\u003c');
  const multiPage = Object.keys(pages).length > 1;
  const shellCols = multiPage ? '300px minmax(0,1fr) 220px' : 'minmax(0,1fr) 220px';
  const mermaidTag = usesMermaid && mermaidLib
    ? `<script>${mermaidLib.replace(/<\/script/gi, '<\\/script')}</script>`
    : '';
  const faviconTag = favicon ? `<link rel="icon" href="${favicon}">` : '';
  const theme = defaultTheme === 'dark' ? 'dark' : 'light';
  return `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(siteTitle)}</title>
${faviconTag}
<style>
:root{--bg:#fbfbfd;--surface:#fff;--text:#1d1d1f;--muted:#6e6e73;--border:#e3e3e8;--accent:#5b5bd6;
  --accent-soft:#eceaff;--code-bg:#f5f5f7;--shadow:0 1px 3px rgba(0,0,0,.06);
  --hl-kw:#9d2235;--hl-str:#1a7f37;--hl-num:#9a5700;--hl-com:#9a9aa5;--hl-fn:#5b5bd6;--hl-lit:#0b6bcb}
[data-theme=dark]{--bg:#0f1115;--surface:#171a21;--text:#e7e7ea;--muted:#9a9aa5;--border:#262a33;--accent:#9d9dff;
  --accent-soft:#22242e;--code-bg:#11141a;--shadow:0 1px 3px rgba(0,0,0,.4);
  --hl-kw:#ff7b9c;--hl-str:#7ee787;--hl-num:#ffb86c;--hl-com:#6a6a78;--hl-fn:#9d9dff;--hl-lit:#79c0ff}
*{box-sizing:border-box}
html{scroll-behavior:smooth;scroll-padding-top:1.5rem}
body{margin:0;background:var(--bg);color:var(--text);
  font:16px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;transition:background .2s,color .2s}
#progress{position:fixed;top:0;left:0;height:3px;width:0;background:var(--accent);z-index:50;transition:width .1s}
.shell{display:grid;grid-template-columns:${shellCols};max-width:1320px;margin:0 auto;gap:2.5rem;padding:0 1.5rem}
aside,.toc-rail{position:sticky;top:0;align-self:start;height:100vh;overflow-y:auto;padding:2rem 0;scrollbar-width:thin}
.brand{font-weight:700;font-size:.95rem;margin-bottom:1rem}
.tree-label,.toc-label{font-size:.72rem;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:1.2rem 0 .5rem}
#tree ul{list-style:none;margin:0;padding:0}
#tree li ul{margin-left:.55rem;border-left:1px solid var(--border);padding-left:.4rem}
#tree summary{cursor:pointer;font-size:.84rem;font-weight:600;padding:.25rem .3rem;border-radius:6px;color:var(--text)}
#tree summary:hover{background:var(--accent-soft)}
#tree a{display:block;padding:.28rem .5rem;color:var(--muted);text-decoration:none;font-size:.85rem;border-radius:6px}
#tree a:hover{color:var(--text);background:var(--accent-soft)}
#tree a.active{color:var(--accent);background:var(--accent-soft);font-weight:600}
#toc{list-style:none;margin:0;padding:0;border-left:1px solid var(--border)}
#toc a{display:block;padding:.3rem .9rem;color:var(--muted);text-decoration:none;font-size:.82rem;
  border-left:2px solid transparent;margin-left:-1px}
#toc a:hover{color:var(--text)}
#toc li.lvl-2 a{padding-left:1.6rem}#toc li.lvl-3 a{padding-left:2.3rem;font-size:.8rem}
#toc a.active{color:var(--accent);border-left-color:var(--accent);font-weight:600}
main{padding:2.5rem 0 6rem;min-width:0}
article{max-width:46rem}
h1,h2,h3,h4{line-height:1.25;position:relative}
h1{font-size:2.3rem;margin:.2em 0 .6em}
h2{font-size:1.6rem;margin:2em 0 .5em;padding-bottom:.3em;border-bottom:1px solid var(--border)}
h3{font-size:1.25rem;margin:1.6em 0 .4em}
.anchor{position:absolute;left:-1.2em;color:var(--border);text-decoration:none;opacity:0;transition:opacity .15s}
h1:hover .anchor,h2:hover .anchor,h3:hover .anchor{opacity:1}
a{color:var(--accent)}
blockquote{margin:1.2em 0;padding:.4em 1.1em;border-left:3px solid var(--accent);
  background:var(--accent-soft);border-radius:0 6px 6px 0;color:var(--muted)}
code{font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace;font-size:.88em}
:not(pre)>code{background:var(--code-bg);padding:.15em .4em;border-radius:5px;border:1px solid var(--border)}
pre{position:relative;background:var(--code-bg);border:1px solid var(--border);border-radius:10px;
  padding:1.1rem 1.2rem;overflow-x:auto;font-size:.86rem;line-height:1.55}
table{display:block;width:max-content;max-width:100%;overflow:auto;border-collapse:collapse;margin:1.3em 0;font-size:.9rem}
th,td{border:1px solid var(--border);padding:.55em .8em;text-align:left}th{background:var(--code-bg)}
img{max-width:100%;border-radius:8px}hr{border:none;border-top:1px solid var(--border);margin:2.5em 0}
.img-wrap{display:inline-block;position:relative;max-width:100%;vertical-align:bottom}
.img-fs-btn{position:absolute;top:6px;right:6px;display:grid;place-items:center;background:rgba(0,0,0,.45);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:6px;padding:5px;cursor:pointer;line-height:0;opacity:0;transition:opacity .15s;z-index:1}
.img-wrap:hover .img-fs-btn{opacity:1}
#fs-overlay{display:none;position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.85);cursor:zoom-out;padding:2rem;overflow:auto}
#fs-overlay.open{display:flex;align-items:center;justify-content:center}
#fs-content{cursor:default}
#fs-content img{max-width:90vw;max-height:90vh;border-radius:8px;object-fit:contain;display:block}
#fs-content svg{max-width:90vw!important;max-height:90vh!important;width:auto!important;height:auto!important;display:block!important}
#fs-close{position:fixed;top:1rem;right:1rem;background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:1.1rem;display:grid;place-items:center;transition:background .15s}
#fs-close:hover{background:rgba(255,255,255,.3)}
.mermaid:not([data-processed]){visibility:hidden}
.mermaid svg{max-width:100%;height:auto}
pre.mermaid{background:none;border:none;border-radius:0;padding:0;margin:0;overflow:visible}
.hljs-keyword,.hljs-built_in,.hljs-tag{color:var(--hl-kw)}
.hljs-string,.hljs-attr,.hljs-regexp{color:var(--hl-str)}
.hljs-number,.hljs-meta{color:var(--hl-num)}
.hljs-comment{color:var(--hl-com);font-style:italic}
.hljs-title,.hljs-section{color:var(--hl-fn)}
.hljs-literal,.hljs-type,.hljs-name{color:var(--hl-lit)}
.code-block,.preview-block{border:1px solid var(--border);border-radius:14px;overflow:hidden;
  background:var(--code-bg);margin:1.3em 0;font-size:.86rem}
.code-header,.preview-header{display:flex;justify-content:space-between;align-items:center;
  padding:6px 12px;background:var(--surface);border-bottom:1px solid var(--border)}
.code-title{display:flex;align-items:center;gap:7px}
.lang-dot{width:7px;height:7px;border-radius:50%;background:var(--accent);flex-shrink:0}
.language{color:var(--text);font-size:.7rem;font-weight:600;letter-spacing:.4px;
  text-transform:uppercase;font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace}
.code-filename{color:var(--muted);font-size:.78rem;font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace}
.code-block .copy-btn,.preview-block .copy-btn,.toggle-btn{display:flex;align-items:center;justify-content:center;
  background:transparent;color:var(--muted);border:1px solid var(--border);
  border-radius:6px;padding:4px 5px;cursor:pointer;line-height:0;transition:.15s}
.code-block .copy-btn:hover,.preview-block .copy-btn:hover,.toggle-btn:hover{color:var(--text);border-color:var(--muted)}
.toggle-btn .icon-prev{display:none}
.preview-block.showing-source .toggle-btn .icon-src{display:none}
.preview-block.showing-source .toggle-btn .icon-prev{display:flex}
.actions{display:flex;gap:6px}
.code-content{overflow-x:auto;scrollbar-width:thin;scrollbar-color:var(--border) transparent}
.code-content::-webkit-scrollbar{height:6px}.code-content::-webkit-scrollbar-track{background:transparent}
.code-content::-webkit-scrollbar-thumb{background:var(--border);border-radius:3px}
.code-content::-webkit-scrollbar-thumb:hover{background:var(--muted)}
.code-content table{display:table;width:max-content;min-width:100%;border-collapse:collapse;margin:0;font-size:inherit}
.code-content td{border:none;vertical-align:top}
.code-content .line-number{width:1%;padding:3px 14px 3px 16px;color:var(--muted);user-select:none;
  border-right:1px solid rgba(128,128,128,.15);text-align:right;white-space:nowrap;
  font-variant-numeric:tabular-nums;line-height:1.55}
.code-content .code-line{padding:3px 18px;white-space:pre;line-height:1.55;
  font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace}
.code-content tr:hover{background:var(--accent-soft)}
.render-view{position:relative;min-height:200px;background:var(--accent-soft);overflow:hidden;cursor:grab}
.render-view.data-view{overflow-x:auto;cursor:default;min-height:0;background:none}
.zoom-controls{position:absolute;top:8px;right:8px;display:flex;gap:4px;z-index:2}
.zoom-btn{display:flex;align-items:center;justify-content:center;background:var(--surface);
  color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:5px;
  cursor:pointer;line-height:0;transition:.15s;box-shadow:var(--shadow)}
.zoom-btn:hover{color:var(--text);border-color:var(--muted)}
.diagram-canvas{padding:24px}
.data-table{display:table;width:100%;margin:0;font-size:.85rem}
.diagram-inner{transform-origin:top center;transition:transform .15s}
.pkg-view{padding:16px 20px}
.pkg-header{padding-bottom:12px;margin-bottom:4px;border-bottom:1px solid var(--border)}
.pkg-name-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:5px}
.pkg-name{font-weight:700;font-size:1rem;font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace}
.pkg-badge{font-size:.72rem;padding:2px 9px;border-radius:20px;border:1px solid transparent;line-height:1.6}
.pkg-version{background:var(--accent-soft);color:var(--accent)}
.pkg-license{background:var(--code-bg);color:var(--muted);border-color:var(--border)}
.pkg-private{background:var(--code-bg);color:var(--muted);border-color:var(--border);font-style:italic}
.pkg-desc{font-size:.88rem;color:var(--muted)}
.pkg-section{margin-top:14px}
.pkg-section-title{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin-bottom:6px}
.pkg-dep-name,.pkg-script-name{font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace;font-size:.83rem;white-space:nowrap}
.pkg-dep-ver,.pkg-script-cmd{font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace;font-size:.83rem;color:var(--muted)}
pre.source-code{border:none;border-radius:0;margin:0}
.source-view.hidden{display:none}
.hidden{display:none}
.callout{border-radius:8px;padding:.75em 1.1em;margin:1.2em 0;border-left:4px solid}
.callout-title{font-weight:700;font-size:.82rem;text-transform:uppercase;letter-spacing:.05em;margin-bottom:.4em}
.callout-body>p:first-child{margin-top:0}.callout-body>p:last-child{margin-bottom:0}
.callout-note{background:#eef6ff;border-color:#0969da}.callout-note .callout-title{color:#0550ae}
.callout-tip{background:#dafbe1;border-color:#1a7f37}.callout-tip .callout-title{color:#116329}
.callout-important{background:#f0e6ff;border-color:#8250df}.callout-important .callout-title{color:#6639ba}
.callout-warning{background:#fff8c5;border-color:#d1a317}.callout-warning .callout-title{color:#7d4e00}
.callout-caution{background:#ffebe9;border-color:#cf222e}.callout-caution .callout-title{color:#a40e26}
[data-theme=dark] .callout-note{background:#031d40;border-color:#388bfd}
[data-theme=dark] .callout-note .callout-title{color:#79c0ff}
[data-theme=dark] .callout-tip{background:#04260f;border-color:#3fb950}
[data-theme=dark] .callout-tip .callout-title{color:#aff5b4}
[data-theme=dark] .callout-important{background:#230f47;border-color:#bc8cff}
[data-theme=dark] .callout-important .callout-title{color:#e2c5ff}
[data-theme=dark] .callout-warning{background:#341a00;border-color:#d29922}
[data-theme=dark] .callout-warning .callout-title{color:#f0b429}
[data-theme=dark] .callout-caution{background:#340c12;border-color:#f85149}
[data-theme=dark] .callout-caution .callout-title{color:#ffa198}
.page-nav{display:flex;justify-content:space-between;gap:1rem;margin-top:3rem;padding-top:1.5rem;
  border-top:1px solid var(--border);font-size:.9rem}
.page-nav a{color:var(--accent);text-decoration:none;max-width:46%}
.page-nav a:hover{text-decoration:underline}
.page-nav-prev::before{content:'← '}
.page-nav-next{text-align:right}.page-nav-next::after{content:' →'}
#theme{position:fixed;top:1.1rem;right:1.3rem;z-index:40;width:38px;height:38px;border-radius:50%;
  border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;font-size:1rem;
  box-shadow:var(--shadow);display:grid;place-items:center}
.menu{display:none}
@media(max-width:1080px){.shell{max-width:none;grid-template-columns:300px minmax(0,1fr)}.toc-rail{display:none}article{max-width:none}}
@media(max-width:820px){
  .shell{grid-template-columns:1fr}
  aside{position:fixed;inset:0 auto 0 0;width:300px;background:var(--surface);box-shadow:var(--shadow);
    padding:2rem 1.5rem;transform:translateX(-100%);transition:transform .25s;z-index:45}
  aside.open{transform:none}
  .menu{display:grid;place-items:center;position:fixed;top:1.1rem;left:1.3rem;z-index:46;width:38px;height:38px;
    border-radius:9px;border:1px solid var(--border);background:var(--surface);color:var(--text);cursor:pointer;box-shadow:var(--shadow)}
  main{padding-top:4rem}
}
@media print{
  #progress,#theme,.menu,aside,.toc-rail,.anchor,.zoom-controls,.copy-btn,.toggle-btn,.img-fs-btn,#fs-overlay{display:none!important}
  .shell{display:block}
  body{font-size:11pt;color:#000;background:#fff}
  a{color:#000;text-decoration:underline}
  h1,h2,h3{break-after:avoid}
  pre,.code-block,.preview-block{break-inside:avoid;border:1px solid #ccc;background:#f8f8f8}
  .code-content .line-number{color:#999}
  .source-view{display:none!important}
}
</style>
</head>
<body>
<div id="progress"></div>
<button id="theme" aria-label="Toggle theme">◐</button>
${multiPage ? `<button class="menu" aria-label="Toggle navigation">☰</button>` : ''}
<div class="shell">
  ${multiPage ? `<aside id="sidebar">
    <div class="brand">${esc(siteTitle)}</div>
    <div class="tree-label">Pages</div>
    <div id="tree">${renderTree(tree)}</div>
  </aside>` : ''}
  <main><article id="page"></article></main>
  <div class="toc-rail"><div class="toc-label">On this page</div><ul id="toc"></ul></div>
</div>
<div id="fs-overlay"><button id="fs-close" aria-label="Close">✕</button><div id="fs-content"></div></div>
<script type="application/json" id="site">${data}</script>
${mermaidTag}
<script>
(function(){
  var SITE=JSON.parse(document.getElementById('site').textContent);
  var root=document.documentElement,article=document.getElementById('page');
  var tocEl=document.getElementById('toc'),sidebar=document.getElementById('sidebar'),bar=document.getElementById('progress');
  var esc=function(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');};
  var observer=null,current=null,panState=null;
  var stored=localStorage.getItem('theme');
  if(stored)root.dataset.theme=stored;
  document.getElementById('theme').onclick=function(){
    var next=root.dataset.theme==='dark'?'light':'dark';
    root.dataset.theme=next;localStorage.setItem('theme',next);
    renderDiagrams();
  };
  function renderDiagrams(){
    if(!window.mermaid)return;
    var nodes=article.querySelectorAll('pre.mermaid');
    if(!nodes.length)return;
    nodes.forEach(function(el){
      if(!el.dataset.src)el.dataset.src=el.textContent;
      el.innerHTML=el.dataset.src;el.removeAttribute('data-processed');
    });
    window.mermaid.initialize({startOnLoad:false,theme:root.dataset.theme==='dark'?'dark':'default',
      flowchart:{useMaxWidth:true,htmlLabels:true},sequence:{useMaxWidth:true},gantt:{useMaxWidth:true}});
    window.mermaid.run({nodes:nodes});
  }
  var menuBtn=document.querySelector('.menu');
  if(menuBtn)menuBtn.onclick=function(){sidebar.classList.toggle('open');};
  var CHECK_SVG='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var fsOverlay=document.getElementById('fs-overlay'),fsContent=document.getElementById('fs-content');
  function openFs(node){var cl=node.cloneNode(true);cl.style.transform='';fsContent.innerHTML='';fsContent.appendChild(cl);fsOverlay.classList.add('open');document.body.style.overflow='hidden';}
  function closeFs(){fsOverlay.classList.remove('open');document.body.style.overflow='';fsContent.innerHTML='';}
  document.addEventListener('click',function(e){
    var codeCopy=e.target.closest('.code-block .copy-btn');
    if(codeCopy){
      var cells=[...codeCopy.closest('.code-block').querySelectorAll('.code-line')];
      var lines=cells.map(function(td){return td.innerText;}).join('\\n');
      navigator.clipboard.writeText(lines).then(function(){
        var orig=codeCopy.innerHTML;codeCopy.innerHTML=CHECK_SVG;
        setTimeout(function(){codeCopy.innerHTML=orig;},1500);
      });
      return;
    }
    var fsBtn=e.target.closest('.fs-btn');
    if(fsBtn){
      var inner=fsBtn.closest('.render-view').querySelector('.diagram-inner');
      var target=inner.querySelector('svg')||inner.querySelector('img')||inner;
      openFs(target);
      return;
    }
    var zBtn=e.target.closest('.zoom-btn');
    if(zBtn){
      var inner=zBtn.closest('.render-view').querySelector('.diagram-inner');
      var dz=parseFloat(zBtn.dataset.dz);
      var curZ=parseFloat(inner.dataset.zoom||'1');
      var z=dz===0?1:Math.min(4,Math.max(0.25,curZ+dz));
      inner.dataset.zoom=String(z);
      if(z===1){inner.dataset.tx='0';inner.dataset.ty='0';inner.style.transform='';}
      else{var tx=parseFloat(inner.dataset.tx||'0');var ty=parseFloat(inner.dataset.ty||'0');inner.style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';}
      return;
    }
    var toggle=e.target.closest('.toggle-btn');
    if(toggle){
      var block=toggle.closest('.preview-block');
      var rv=block.querySelector('.render-view'),sv=block.querySelector('.source-view');
      var showingSrc=!sv.classList.contains('hidden');
      rv.classList.toggle('hidden',!showingSrc);sv.classList.toggle('hidden',showingSrc);
      block.classList.toggle('showing-source',!showingSrc);
      return;
    }
    var previewCopy=e.target.closest('.preview-block .copy-btn');
    if(previewCopy){
      var src=previewCopy.closest('.preview-block').querySelector('.source-code').textContent;
      navigator.clipboard.writeText(src).then(function(){
        var orig=previewCopy.innerHTML;previewCopy.innerHTML=CHECK_SVG;
        setTimeout(function(){previewCopy.innerHTML=orig;},1500);
      });
      return;
    }
    var imgFsBtn=e.target.closest('.img-fs-btn');
    if(imgFsBtn){var img=imgFsBtn.previousElementSibling;if(img&&img.tagName==='IMG')openFs(img);return;}
    if(e.target===fsOverlay||e.target.id==='fs-close'){closeFs();}
  });
  document.addEventListener('mousedown',function(e){
    var rv=e.target.closest('.render-view');
    if(!rv||rv.classList.contains('data-view')||e.target.closest('.zoom-controls'))return;
    e.preventDefault();
    var inner=rv.querySelector('.diagram-inner');
    panState={inner:inner,x:e.clientX,y:e.clientY,
      tx:parseFloat(inner.dataset.tx||'0'),ty:parseFloat(inner.dataset.ty||'0')};
    rv.style.cursor='grabbing';
  });
  document.addEventListener('mousemove',function(e){
    if(!panState)return;
    var tx=panState.tx+(e.clientX-panState.x);
    var ty=panState.ty+(e.clientY-panState.y);
    panState.inner.dataset.tx=String(tx);
    panState.inner.dataset.ty=String(ty);
    var z=parseFloat(panState.inner.dataset.zoom||'1');
    panState.inner.style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';
  });
  document.addEventListener('mouseup',function(){
    if(!panState)return;
    panState.inner.closest('.render-view').style.cursor='';
    panState=null;
  });
  document.addEventListener('wheel',function(e){
    if(!e.ctrlKey&&!e.metaKey)return;
    var rv=e.target.closest('.render-view');
    if(!rv||rv.classList.contains('data-view'))return;
    e.preventDefault();
    var inner=rv.querySelector('.diagram-inner');
    var dz=e.deltaY<0?0.1:-0.1;
    var curZ=parseFloat(inner.dataset.zoom||'1');
    var z=Math.min(4,Math.max(0.25,curZ+dz));
    inner.dataset.zoom=String(z);
    if(z===1){inner.dataset.tx='0';inner.dataset.ty='0';inner.style.transform='';}
    else{var tx=parseFloat(inner.dataset.tx||'0');var ty=parseFloat(inner.dataset.ty||'0');inner.style.transform='translate('+tx+'px,'+ty+'px) scale('+z+')';}
  },{passive:false});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')closeFs();});
  function safeDecode(s){try{return decodeURIComponent(s);}catch{return s;}}
  function parseHash(){
    var h=location.hash.slice(2);
    if(!h)return [SITE.indexKey,null];
    var i=h.lastIndexOf('~');
    return i<0?[safeDecode(h),null]:[safeDecode(h.slice(0,i)),safeDecode(h.slice(i+1))];
  }
  function renderToc(toc,key){
    tocEl.innerHTML=toc.map(function(h){
      return '<li class="lvl-'+h.depth+'"><a href="#/'+key+'~'+h.id+'">'+esc(h.text)+'</a></li>';
    }).join('');
  }
  function markTree(key){
    document.querySelectorAll('#tree a[data-key]').forEach(function(a){
      a.classList.toggle('active',a.dataset.key===key);
    });
  }
  function renderPrevNext(key){
    var ord=SITE.order;
    if(!ord||ord.length<=1)return '';
    var idx=ord.indexOf(key);
    var prev=idx>0?ord[idx-1]:null;
    var next=idx>=0&&idx<ord.length-1?ord[idx+1]:null;
    if(!prev&&!next)return '';
    return '<nav class="page-nav">'
      +(prev?'<a class="page-nav-prev" href="#/'+prev+'">'+esc(SITE.pages[prev].title)+'</a>':'<span></span>')
      +(next?'<a class="page-nav-next" href="#/'+next+'">'+esc(SITE.pages[next].title)+'</a>':'<span></span>')
      +'</nav>';
  }
  function enhance(){
    if(observer)observer.disconnect();
    var links=new Map();
    tocEl.querySelectorAll('a').forEach(function(a){links.set(a.getAttribute('href').split('~').pop(),a);});
    observer=new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(!e.isIntersecting)return;
        links.forEach(function(a){a.classList.remove('active');});
        var a=links.get(e.target.id);if(a)a.classList.add('active');
      });
    },{rootMargin:'0px 0px -75% 0px'});
    article.querySelectorAll('h1[id],h2[id],h3[id]').forEach(function(h){observer.observe(h);});
    renderDiagrams();
  }
  function navigate(){
    var p=parseHash();
    var key=SITE.pages[p[0]]?p[0]:SITE.indexKey,hid=p[1];
    if(key!==current){
      current=key;
      var page=SITE.pages[key];
      article.innerHTML=page.body+renderPrevNext(key);
      renderToc(page.toc,key);
      markTree(key);
      document.title=page.title;
      enhance();
    }
    if(sidebar)sidebar.classList.remove('open');
    requestAnimationFrame(function(){
      if(hid){var el=document.getElementById(hid);if(el){el.scrollIntoView();return;}}
      window.scrollTo(0,0);
    });
  }
  addEventListener('hashchange',navigate);navigate();
  var prog=function(){
    var h=document.documentElement,max=h.scrollHeight-h.clientHeight;
    bar.style.width=(max>0?(h.scrollTop/max)*100:0)+'%';
  };
  addEventListener('scroll',prog,{passive:true});prog();
})();
</script>
</body>
</html>`;
};
