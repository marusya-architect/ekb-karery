/* Live analysis of the territories enabled by the sidebar filters. */
(()=>{
 const root=L.DomUtil.create('div','ekb-analytics');root.id='ekb-analytics';root.setAttribute('role','region');root.setAttribute('aria-label','Аналитика включённых территорий');
 root.innerHTML='<div class="an-header"><b>Аналитика территорий</b><span class="an-total" aria-live="polite"></span><button type="button" id="an-toggle" aria-expanded="false" aria-controls="an-body" aria-label="Развернуть аналитику">▴</button></div><div id="an-body" hidden><nav class="an-switch" aria-label="Вид анализа"><button type="button" id="an-prev" aria-label="Предыдущий вид анализа">‹</button><span id="an-page">1/2</span><button type="button" id="an-next" aria-label="Следующий вид анализа">›</button></nav><div class="an-content"><div class="an-toolbar"><b id="an-view-name"></b><label>Мера <select id="an-metric"><option value="count">Количество, шт.</option><option value="ha">Площадь, га</option></select></label></div><div class="charts"><div class="chart-q"><h3>Сроки освоения</h3><div class="plot"></div></div><div class="chart-sc"><h3>Сценарии матрицы</h3><div class="plot"></div></div><div class="chart-mix"><h3>Срок × сценарий</h3><div class="plot"></div></div></div><details class="scenario-key"><summary>Расшифровка и расчёт</summary><p>А+ — жильё; Б+ — общественные функции, туризм и спорт; В+ — рекреация; Г+ — промышленность; Д+ — иная градостроительная рекультивация; Д− — биологическая рекультивация / консервация.</p><p>Рассчитываются территории, включённые фильтрами слева, по всей карте. Перемещение карты и включение фоновых слоёв выборку не меняют. Площадь берётся из атрибутов объектов. I: 2026–2030; II: 2031–2037; III: 2038–2045. «Вне очереди» — без привязки к сроку.</p></details><div class="detail" aria-live="polite"></div></div></div>';
 const control=L.control({position:'bottomright'});control.onAdd=()=>root;control.addTo(map);L.DomEvent.disableClickPropagation(root);L.DomEvent.disableScrollPropagation(root);
 const kinds=['карьер','отвал','свалка'],kindNames=['Карьеры','Отвалы','Свалки / ТБО'],kindColors=kinds.map(k=>TYPE_COLORS[k]);
 const qs=['I · 2026–30','II · 2031–37','III · 2038–45','Вне очереди'],qShort=['I','II','III','Вне'],qColors=['#c4381f','#e8873a','#d4ae63','#9b94a1'];
 const scenarios=SC.map(s=>s[0]),scColors=SC.map(s=>s[2]);
 const fmt=x=>x.toLocaleString('ru-RU',{maximumFractionDigits:1}),queue=x=>qi(x.queue),svgNS='http://www.w3.org/2000/svg';
 let metric='count',view=0,expanded=false;
 const value=x=>metric==='ha'?(Number(x.ha)||0):1,sum=a=>a.reduce((v,x)=>v+value(x),0);
 const legend=(names,colors)=>'<div class="an-keylist">'+names.map((n,i)=>'<span class="key"><i class="sw" style="--seg:'+colors[i]+'"></i>'+n+'</span>').join('')+'</div>';
const selectionPane=map.createPane('analysisSelection');
selectionPane.style.zIndex=625;
selectionPane.style.pointerEvents='none';
const highlights=L.layerGroup().addTo(map);
let selectionKey=null;
function clearHighlights(){highlights.clearLayers();selectionKey=null;}
function detail(scene,label,rows){
 const key=JSON.stringify([label,rows.map(row=>row.object.p._id)]);
 const repeated=key===selectionKey;
 clearHighlights();
 const message=scene.querySelector('.detail');
 if(repeated){message.textContent='Выделение снято.';return;}
 if(!rows.length){message.textContent='В этой группе нет включённых территорий.';return;}
 selectionKey=key;
 const options={pane:'analysisSelection',interactive:false,color:'#122c39',weight:5,fill:false};
 for(const {object} of rows){
  if(object.poly){
   L.geoJSON(object.f,{pane:options.pane,interactive:false,style:options}).addTo(highlights);
   L.geoJSON(object.f,{pane:options.pane,interactive:false,style:{...options,color:'#ffe346',weight:3,fill:true,fillColor:'#ffe346',fillOpacity:.28}}).addTo(highlights);
  }
  const point=object.mk.getLatLng();
  L.circleMarker(point,{...options,radius:10}).addTo(highlights);
  L.circleMarker(point,{...options,radius:10,color:'#ffe346',weight:3}).addTo(highlights);
 }
 message.textContent=label+' · выделено территорий: '+rows.length+'. '+kinds.map((k,i)=>kindNames[i]+' '+fmt(sum(rows.filter(x=>x.kind===k)))).join(' · ')+(metric==='ha'?' га':' шт.');
 const reset=document.createElement('button');reset.type='button';reset.className='chip';reset.textContent='Снять выделение';reset.onclick=()=>{clearHighlights();message.textContent='Выделение снято.'};message.append(' ',reset);
}
function bars(el,groups,scene,colorMode='type'){
 el.replaceChildren();const max=Math.max(1,...groups.map(g=>sum(g.rows)));
 for(const g of groups){const row=document.createElement('div');row.className='bar-row';const label=document.createElement('span');label.textContent=g.label;const track=document.createElement('div');track.className='bar-track';const groups2=colorMode==='type'?kinds:scenarios,colors=colorMode==='type'?kindColors:scColors;
 for(let i=0;i<groups2.length;i++){const rows=g.rows.filter(x=>(colorMode==='type'?x.kind:x.scenario)===groups2[i]),n=sum(rows);if(!n)continue;const seg=document.createElement('button');seg.type='button';seg.className='segment';seg.style.width=(100*n/max)+'%';seg.style.setProperty('--seg',colors[i]);const text=g.label+' · '+(colorMode==='type'?kindNames[i]:scenarios[i])+': '+fmt(n)+(metric==='ha'?' га':' шт.');seg.setAttribute('aria-label',text);seg.title=text;seg.onclick=()=>detail(scene,g.label+' · '+(colorMode==='type'?kindNames[i]:scenarios[i]),rows);track.append(seg)}const number=document.createElement('span');number.className='number';number.textContent=fmt(sum(g.rows));row.append(label,track,number);el.append(row)}
 el.insertAdjacentHTML('beforeend','<div class="axis-caption">'+(metric==='ha'?'Площадь по атрибутам, га':'Количество территорий, шт.')+'</div>'+legend(colorMode==='type'?kindNames:scenarios,colorMode==='type'?kindColors:scColors));
}
function rings(el,groups,colors,scene){
 el.replaceChildren();const total=sum(groups.flatMap(g=>g.rows));if(!total){el.innerHTML='<div class="empty">Нет включённых территорий</div>';return}
 const svg=document.createElementNS(svgNS,'svg');svg.classList.add('donut');svg.setAttribute('viewBox','0 0 220 172');svg.setAttribute('role','img');svg.setAttribute('aria-label','Внешнее кольцо — группы, внутреннее — тип территории. Всего '+fmt(total));
 function arc(a,b,r1,r2,color,rows,label){const p=(r,t)=>[110+r*Math.cos(t),86+r*Math.sin(t)];const [x1,y1]=p(r2,a),[x2,y2]=p(r2,b),[x3,y3]=p(r1,b),[x4,y4]=p(r1,a);const path=document.createElementNS(svgNS,'path');path.setAttribute('d',`M${x1},${y1} A${r2},${r2} 0 ${b-a>Math.PI?1:0} 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${b-a>Math.PI?1:0} 0 ${x4},${y4} Z`);path.setAttribute('fill',color);path.setAttribute('role','button');path.setAttribute('tabindex','0');path.setAttribute('aria-label',label+': '+fmt(sum(rows)));path.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();detail(scene,label,rows)}});const hint=document.createElementNS(svgNS,'title');hint.textContent=label+': '+fmt(sum(rows));path.append(hint);path.onclick=()=>detail(scene,label,rows);svg.append(path)}
 let angle=-Math.PI/2;groups.forEach((g,i)=>{const n=sum(g.rows);if(!n)return;const end=angle+Math.PI*2*n/total;arc(angle,end-.00001,62,79,colors[i],g.rows,g.label);let inner=angle;kinds.forEach((k,j)=>{const rows=g.rows.filter(x=>x.kind===k),v=sum(rows);if(!v)return;const next=inner+Math.PI*2*v/total;arc(inner,next-.00001,46,59,kindColors[j],rows,g.label+' · '+kindNames[j]);inner=next});angle=end});
 const text=document.createElementNS(svgNS,'text');text.setAttribute('x','110');text.setAttribute('y','90');text.setAttribute('text-anchor','middle');text.textContent=fmt(total);svg.append(text);el.append(svg);el.insertAdjacentHTML('beforeend',legend(groups.map(g=>g.label+' · '+fmt(sum(g.rows))),colors)+'<div class="axis-caption">Внутри — тип территории</div>'+legend(kindNames,kindColors));
}
function heat(el,rows,scene){el.innerHTML='<div class="heat"><span></span>'+qShort.map(n=>'<span class="heat-head">'+n+'</span>').join('')+'</div>';const grid=el.firstChild;const max=Math.max(1,...scenarios.flatMap(sc=>qs.map((q,i)=>sum(rows.filter(x=>x.scenario===sc&&queue(x)===i)))));
 for(const sc of scenarios){const label=document.createElement('span');label.textContent=sc;grid.append(label);qs.forEach((q,i)=>{const subset=rows.filter(x=>x.scenario===sc&&queue(x)===i),n=sum(subset),cell=document.createElement('button');cell.type='button';cell.className='cell';cell.textContent=n?fmt(n):'—';cell.style.setProperty('--intensity',(n?12+42*n/max:0)+'%');cell.dataset.tooltip=sc+' · '+q+': '+fmt(n)+(metric==='ha'?' га':' шт.');cell.title=cell.dataset.tooltip;cell.setAttribute('aria-label',cell.dataset.tooltip);cell.onclick=()=>detail(scene,sc+' · '+q,subset);grid.append(cell)})}el.insertAdjacentHTML('beforeend','<div class="axis-caption">Столбцы — очереди; строки — сценарии.<br>В ячейке — '+(metric==='ha'?'площадь, га':'число территорий')+'.</div>');}

 function render(){
  clearHighlights();
  const rows=objs.filter(o=>!o.btn.hidden).map(o=>({object:o,kind:o.kind,queue:o.q,scenario:scKey(o.p),ha:o.p.площадь_расч_га}));
  root.dataset.count=rows.length;root.querySelector('.an-total').textContent=rows.length+' из '+objs.length;
  root.querySelector('#an-view-name').textContent=view?'Кольца и состав':'Столбцы и матрица';root.querySelector('#an-page').textContent=(view+1)+'/2';
  const queueGroups=qs.map((label,i)=>({label,rows:rows.filter(x=>queue(x)===i)})),scGroups=scenarios.map(label=>({label,rows:rows.filter(x=>x.scenario===label)}));
  const a=root.querySelector('.chart-q .plot'),b=root.querySelector('.chart-sc .plot'),c=root.querySelector('.chart-mix .plot');
  if(view){rings(a,queueGroups,qColors,root);rings(b,scGroups,scColors,root);bars(c,queueGroups,root,'scenario')}else{bars(a,queueGroups,root);bars(b,[...scGroups].sort((a,b)=>sum(b.rows)-sum(a.rows)),root);heat(c,rows,root)}
  root.querySelector('.detail').textContent=rows.length?'Нажмите сегмент или ячейку, чтобы выделить территории на карте.':'Нет территорий, соответствующих выбранным фильтрам.';
 }
 function resize(){const size=map.getSize(),legend=document.getElementById('legend');const reserve=size.x>=900&&legend?legend.getBoundingClientRect().width+30:24;const width=Math.max(260,Math.min(820,size.x-reserve));root.style.setProperty('--an-width',width+'px');const attribution=map.attributionControl.getContainer().offsetHeight;root.style.setProperty('--an-body-height',Math.max(110,size.y-attribution-88)+'px');root.classList.toggle('an-narrow',width<650)}
 root.querySelector('#an-toggle').onclick=()=>{expanded=!expanded;root.classList.toggle('an-open',expanded);root.querySelector('#an-body').hidden=!expanded;const b=root.querySelector('#an-toggle');b.textContent=expanded?'▾':'▴';b.setAttribute('aria-expanded',String(expanded));b.setAttribute('aria-label',expanded?'Свернуть аналитику':'Развернуть аналитику');resize()};
 for(const id of ['an-prev','an-next'])root.querySelector('#'+id).onclick=()=>{view=1-view;render()};
 root.querySelector('#an-metric').onchange=e=>{metric=e.target.value;render()};
 window.refreshAnalytics=render;map.on('resize',resize);resize();render();
})();
