/* The group assessment uses every member, including members hidden by object filters. */
(()=>{
 const colors=['#ac3374','#14699f','#df7026','#358245','#7261a4','#138587','#9b7130','#b54742','#426aae','#817325','#8d4889','#287e67','#a35e24','#504fa1'];
 const layer=L.featureGroup(),records=quarryGroups.map((group,index)=>({
  ...group,index,color:colors[index],members:groupMembers(group),
  name:byId[group.quarry].p.имя==='карьер без названия'?'Карьер OSM '+group.osm:byId[group.quarry].p.имя
 }));
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const title=r=>'Г'+String(r.index+1).padStart(2,'0');
 const scenarioName=code=>SC.find(s=>s[0]===code)?.[1]||code;
 const positionLevels=[[5],[5,4],[5,4,3],[3],[2],[2],[1],[1]];
 function fitsRow(o,row,index){
  return positionLevels[index].includes(o.p.mP)&&['mIG','mT','mL','mI'].every((field,i)=>row[i+1].split('/').map(Number).includes(o.p[field]));
 }
 function assess(r){
  const codes=new Set(r.members.map(o=>scKey(o.p)));
  const blocked=r.members.filter(o=>o.p.stops.some(([level])=>level==='red'));
  const candidates=r.members.filter(o=>!blocked.includes(o));
  const common=MX.flatMap((row,i)=>r.members.every(o=>fitsRow(o,row,i))?[i+1]:[]);
  const conflict=codes.has('Г+')&&['А+','Б+','В+'].some(c=>codes.has(c));
  const conservation=codes.has('Д−')&&codes.size>1;
  let strategy;
  if(codes.size===1)strategy='Общий профиль: '+scenarioName([...codes][0]);
  else if(conflict)strategy='Поэтапная рекультивация с разделением производственных и общественных участков';
  else if(conservation)strategy='Зонирование с выделением участков консервации';
  else if([...codes].every(c=>['Б+','В+'].includes(c)))strategy='Общественно-рекреационный комплекс с разными функциями участков';
  else strategy='Поучастковая рекультивация с разными целевыми функциями';
  let compatibility='Матрица участников указывает один профиль. Проверить условия освоения отдельно на каждом участке.';
  if(conflict)compatibility='Производственная деятельность и жильё, отдых или приём посетителей требуют проверки взаимного влияния. Уточнить санитарные разрывы, маршруты посетителей и грузового транспорта, очередность прекращения добычи. Совместное использование пока не обосновано.';
  else if(conservation)compatibility='Участок консервации требует самостоятельного режима доступа и защиты от воздействия соседних работ.';
  else if(codes.size>1)compatibility='Функции можно рассматривать по участкам. Для общего проекта проверить доступ, безопасность и режимы зон в местах их сопряжения.';
  const scope=!candidates.length?'Освоение всей группы сейчас не обосновано: у каждого участника есть стоп-фактор.'
   :blocked.length?'Можно прорабатывать часть группы: без красного стоп-фактора '+candidates.map(o=>'№ '+o.n).join(', ')+'. Для остальных сначала устранить или уточнить ограничения.'
   :codes.size===1?'Единый сценарий можно прорабатывать для всей группы при подтверждении условий каждого участка.':'Всю группу можно рассматривать как многофункциональный проект при раздельной проверке участков.';
  const internalBuffers=[];
  const memberIds=new Set(r.members.map(o=>o.p._id));
  for(const o of r.members){
   for(const source of o.p.szz?.inQ||[]){
    if(source!==o.p._id&&memberIds.has(source))internalBuffers.push('Участок № '+o.n+' попадает в расчётную 500-метровую зону участника № '+byId[source].n+'.');
   }
  }
  if(internalBuffers.length)compatibility+=' В группе есть пересечения с расчётными СЗЗ. Уточнить их границы до размещения новых функций.';
  return {common,strategy,compatibility,scope,internalBuffers};
 }
 let current=records[0],zones,zoneRequest,zoneFailed=false;
 const panel=document.createElement('section');panel.className='group-card';panel.hidden=true;panel.setAttribute('aria-label','Карточка связанной территории');
 map.getContainer().append(panel);L.DomEvent.disableClickPropagation(panel);L.DomEvent.disableScrollPropagation(panel);
 function zoneInfo(r){
  if(!zones)return zoneFailed?'Сведения о пересечениях не загрузились.':'Загружаются сведения о пересечениях…';
  return r.members.map(o=>{
   const z=zones.objects[o.p._id];if(!z)return '№ '+o.n+' — нет расчёта.';
   const items=(z.zones||[]).filter(f=>f.layer!=='zones_5');
   const incomplete=z.zoneError||Object.keys(z.zoneStatus||{}).length!==6||Object.values(z.zoneStatus||{}).some(s=>s.status!=='ok'||s.limit);
   return '<p>№ '+o.n+' — '+(items.length?items.length+' записей ЗОУИТ'+(z.zouitUnion?' · '+z.zouitUnion.percent+'% площади':' по точке'):'в полученной выборке пересечений ЗОУИТ не найдено')+(incomplete?' · проверка неполная':'')+'.</p>';
  }).join('');
 }
 function verdicts(r){
  const groups=new Map();
  for(const o of r.members)for(const [level,text]of o.p.stops){const key=level+' '+text;if(!groups.has(key))groups.set(key,{level,text,objects:[]});groups.get(key).objects.push(o.n);}
  return [...groups.values()].sort((a,b)=>Number(b.level==='red')-Number(a.level==='red')).map(x=>'<li><b>'+(x.level==='red'?'Стоп-фактор':'Требует проверки')+' · № '+x.objects.join(', ')+'</b><br>'+esc(x.text)+'</li>').join('')||'<li>В реестре проекта стоп-факторы не указаны.</li>';
 }
 function renderCard(){
  const r=current,a=assess(r);
  panel.innerHTML='<header><b>Связанные территории</b><button type="button" data-close aria-label="Закрыть карточку">×</button></header><label>Группа <select>'+records.map(v=>'<option value="'+v.index+'" '+(v===r?'selected':'')+'>'+title(v)+' · '+esc(v.name)+'</option>').join('')+'</select></label>'+
   '<div class="group-summary" style="border-color:'+r.color+'"><b>'+esc(a.strategy)+'</b><p>'+esc(a.scope)+'</p><p>'+esc(a.compatibility)+'</p></div>'+
   '<button type="button" class="chip" data-zoom>Приблизить группу</button> <button type="button" class="chip" data-all>Все 14 групп</button>'+
   '<details><summary>Матрица и участники · '+r.members.length+'</summary><p>Единая точная строка по всем пяти критериям: '+(a.common.length?a.common.join(', '):'нет')+'. Групповая стратегия — проектное предложение по сочетанию функций и ограничений участников.</p>'+
   r.members.map(o=>'<p><b>№ '+o.n+' · '+esc(o.p.имя)+'</b><br>'+esc(scKey(o.p))+' · строка '+o.p.row+' ('+(o.p.exact?'точная':'ближайшая')+'). П / ИГ / Т / Л / И: '+[o.p.mP,o.p.mIG,o.p.mT,o.p.mL,o.p.mI].join(' / ')+'.<br>Сейчас: '+esc(o.p.now)+'</p>').join('')+'</details>'+
   '<details><summary>Стоп-факторы и ограничения</summary><ul>'+verdicts(r)+'</ul><b>Влияние участников друг на друга</b><p>'+esc(a.internalBuffers.join(' ')||'В реестре нет записей о попадании одного участника в расчётную СЗЗ другого.')+'</p><b>Пересечения с ЗОУИТ по участникам</b><div data-zones>'+zoneInfo(r)+'</div></details>'+
   '<small>Основание группы: «относится_к» — '+esc(r.reference)+', контур OSM '+r.osm+(r.quarry===37?'. Старая Линза включена по пилотному проекту':'')+'. Расчёт предварительный, по полному составу группы. Для проектного решения нужны обследования, правовые основания и проверка генплана.</small>';
 }
 function select(r){current=r;panel.hidden=false;renderCard();panel.scrollTop=0;}
 panel.addEventListener('click',e=>{
  if(e.target.closest('[data-close]'))panel.hidden=true;
  if(e.target.closest('[data-zoom]'))map.fitBounds(current.shapes.getBounds(),{padding:[35,35],maxZoom:15});
  if(e.target.closest('[data-all]'))map.fitBounds(layer.getBounds(),{padding:[24,24]});
 });
 panel.addEventListener('change',e=>{if(e.target.tagName==='SELECT')select(records[Number(e.target.value)])});
 map.createPane('groupShapes').style.zIndex=455;
 for(const r of records){
  const anchor=byId[r.quarry].p.pt,shapes=L.featureGroup().addTo(layer);r.shapes=shapes;
  for(const o of r.members){
   if(o.p._id!==r.quarry)L.polyline([anchor,o.p.pt],{pane:'groupShapes',color:r.color,weight:2,dashArray:'4 5',interactive:false}).addTo(shapes);
   L.geoJSON(o.f,{pane:'groupShapes',style:{color:r.color,weight:4,fillColor:r.color,fillOpacity:.38},pointToLayer:(f,ll)=>L.circleMarker(ll,{pane:'groupShapes',radius:8,color:r.color})}).on('click',()=>select(r)).addTo(shapes);
  }
  L.marker(anchor,{title:title(r)+' · '+r.name,zIndexOffset:1100,icon:L.divIcon({className:'group-badge',html:'<span style="background:'+r.color+'">'+title(r)+'</span>',iconSize:[34,23],iconAnchor:[17,23]})}).on('click',()=>select(r)).addTo(shapes);
 }
 const entry=window.layerGroups.find(g=>g[1].includes('t-pp'));
 const host=document.getElementById('t-pp').parentElement;
 entry[1].push('t-linked');
 chip(host,'t-linked','Связанные территории',false,on=>{
  if(on){
   layer.addTo(map);select(current);
   if(!location.hash.startsWith('#map='))map.fitBounds(layer.getBounds(),{padding:[24,24]});
   if(!zoneRequest)zoneRequest=fetch('area-analysis.json?v=1').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(j=>{zones=j}).catch(()=>{zoneFailed=true;zoneRequest=null}).finally(()=>{const el=panel.querySelector('[data-zones]');if(el)el.innerHTML=zoneInfo(current)});
  }else{map.removeLayer(layer);panel.hidden=true}legend();
 });
})();
