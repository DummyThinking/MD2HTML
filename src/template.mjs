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
export const renderSite = ({ pages, tree, indexKey, siteTitle, usesMermaid, mermaidLib }) => {
  const data = JSON.stringify({ pages, indexKey }).replace(/</g, '\\u003c');
  const mermaidTag = usesMermaid && mermaidLib
    ? `<script>${mermaidLib.replace(/<\/script/gi, '<\\/script')}</script>`
    : '';
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(siteTitle)}</title>
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
.shell{display:grid;grid-template-columns:300px minmax(0,1fr) 220px;max-width:1320px;margin:0 auto;gap:2.5rem;padding:0 1.5rem}
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
.code-block .copy-btn,.preview-block .copy-btn,.toggle-btn{display:flex;align-items:center;justify-content:center;
  background:transparent;color:var(--muted);border:1px solid var(--border);
  border-radius:6px;padding:4px 5px;cursor:pointer;line-height:0;transition:.15s}
.code-block .copy-btn:hover,.preview-block .copy-btn:hover,.toggle-btn:hover{color:var(--text);border-color:var(--muted)}
.toggle-btn .icon-prev{display:none}
.preview-block.showing-source .toggle-btn .icon-src{display:none}
.preview-block.showing-source .toggle-btn .icon-prev{display:flex}
.actions{display:flex;gap:6px}
.code-content{overflow-x:auto}
.code-content table{display:table;width:max-content;min-width:100%;border-collapse:collapse;margin:0;font-size:inherit}
.code-content td{border:none;vertical-align:top}
.code-content .line-number{width:1%;padding:3px 14px 3px 16px;color:var(--muted);user-select:none;
  border-right:1px solid rgba(128,128,128,.15);text-align:right;white-space:nowrap;
  font-variant-numeric:tabular-nums;line-height:1.55}
.code-content .code-line{padding:3px 18px;white-space:pre;line-height:1.55;
  font-family:"SF Mono",SFMono-Regular,Consolas,Menlo,monospace}
.code-content tr:hover{background:var(--accent-soft)}
.render-view{position:relative;min-height:200px;background:var(--accent-soft);overflow:hidden;cursor:grab}
.zoom-controls{position:absolute;top:8px;right:8px;display:flex;gap:4px;z-index:2}
.zoom-btn{display:flex;align-items:center;justify-content:center;background:var(--surface);
  color:var(--muted);border:1px solid var(--border);border-radius:6px;padding:5px;
  cursor:pointer;line-height:0;transition:.15s;box-shadow:var(--shadow)}
.zoom-btn:hover{color:var(--text);border-color:var(--muted)}
.diagram-canvas{padding:24px}
.diagram-inner{transform-origin:top center;transition:transform .15s}
pre.source-code{border:none;border-radius:0;margin:0}
.source-view.hidden{display:none}
.hidden{display:none}
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
</style>
</head>
<body>
<div id="progress"></div>
<button id="theme" aria-label="Toggle theme">◐</button>
<button class="menu" aria-label="Toggle navigation">☰</button>
<div class="shell">
  <aside id="sidebar">
    <div class="brand">${esc(siteTitle)}</div>
    <div class="tree-label">Pages</div>
    <div id="tree">${renderTree(tree)}</div>
  </aside>
  <main><article id="page"></article></main>
  <div class="toc-rail"><div class="toc-label">On this page</div><ul id="toc"></ul></div>
</div>
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
  document.querySelector('.menu').onclick=function(){sidebar.classList.toggle('open');};
  var CHECK_SVG='<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
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
    }
  });
  document.addEventListener('mousedown',function(e){
    var rv=e.target.closest('.render-view');
    if(!rv||e.target.closest('.zoom-controls'))return;
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
  function parseHash(){
    var h=location.hash.slice(2);
    if(!h)return [SITE.indexKey,null];
    var i=h.lastIndexOf('~');
    return i<0?[decodeURIComponent(h),null]:[decodeURIComponent(h.slice(0,i)),h.slice(i+1)];
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
      article.innerHTML=page.body;
      renderToc(page.toc,key);
      markTree(key);
      document.title=page.title;
      enhance();
    }
    sidebar.classList.remove('open');
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
