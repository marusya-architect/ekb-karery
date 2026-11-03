/* Spatial analysis of unchanged source objects. Distances are straight-line, in UTM 41N. */
(()=>{
 let data=null,error=false;const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const num=(n,d=1)=>Number(n).toLocaleString('ru-RU',{maximumFractionDigits:d});
 const names={roads:'Автодорога / проезд',housing:'Жилой дом',stops:'Остановка',water:'Водоём / водоток',tourism:'Туристический объект',leisure:'Объект досуга',sport:'Спортивный объект'};
 const distance=m=>m===0?'менее 1 м':m<1000?num(m,0)+' м':num(m/1000,2)+' км';
 const measure=r=>num(r.areaHa,3)+' га · '+num(r.percent,2)+' %';
 function body(id){if(!data)return '<b>Территория и окружение</b><p>'+(error?'Расчёты не загрузились. Обновите страницу.':'Загрузка расчётов…')+'</p>';const r=data.objects[id];if(!r)return '<p>Нет расчётов для объекта.</p>';
 let h='<b>Территория и окружение</b><p class="analysis-method">'+(r.polygon?'По существующему контуру · площадь '+num(r.areaHa,3)+' га':'Точечный объект · площадь пересечений не рассчитывается')+'</p>';
 if(r.zoneError)h+='<p>'+esc(r.zoneError)+'</p>';
 const zones=r.zones||[],zouit=zones.filter(z=>z.layer!=='zones_5'),tz=zones.filter(z=>z.layer==='zones_5'),incomplete=Object.keys(r.zoneStatus||{}).length!==6||Object.values(r.zoneStatus||{}).some(s=>s.status!=='ok'||s.limit);
 h+='<div class="analysis-brief"><b>Краткий вывод</b>';
 if(r.polygon&&r.zouitUnion)h+='<p>'+(zouit.length?'Выявленные ЗОУИТ пересекают '+measure(r.zouitUnion)+' территории. Площадь посчитана без повторного учёта наложений.':'Пересечений с полученными границами ЗОУИТ не найдено.')+'</p>';
 else h+='<p>В точке объекта найдено записей ЗОУИТ: '+zouit.length+'.</p>';
 h+='<p>'+(tz.length?'Территориальные зоны: '+[...new Set(tz.map(z=>z.name||z.type||z.number))].map(esc).join('; ')+'.':'В полученных границах территориальная зона не определена.')+'</p>';
 if(r.near.roads&&r.near.housing)h+='<p>До ближайшей дороги: '+distance(r.near.roads.metres)+'; до отмеченного жилого дома: '+distance(r.near.housing.metres)+'.</p>';
 h+='<small>По сохранённым данным. '+(incomplete?'Часть ответов НСПД недоступна или достигла лимита. ':'')+'Отсутствие пересечения не подтверждает отсутствие всех ограничений.</small></div>';
 h+='<details class="area-details"><summary>Пересечения с зонами · '+zones.length+'</summary>';
 for(const [k,n]of zoneDefinitions){const rows=zones.filter(z=>z.layer===k);h+='<h4>'+esc(n)+'</h4>';if(!rows.length)h+='<p>В полученных границах пересечений не найдено.</p>';else{if(r.zoneGroups[k])h+='<p><b>Вместе: '+measure(r.zoneGroups[k])+'</b></p>';h+='<ul>'+rows.map(z=>'<li><strong>'+esc(z.number||'Без номера')+'</strong><br>'+esc(z.name||z.type)+(z.type&&z.type!==z.name?'<br><small>'+esc(z.type)+'</small>':'')+(r.polygon?'<br><b>'+measure(z)+'</b>':'')+(z.repaired?'<small>Геометрия зоны исправлена для расчёта.</small>':'')+'</li>').join('')+'</ul>';}}
 h+='<small>Доли отдельных зон могут накладываться. Итоги по группам и ЗОУИТ считаются по объединению пересечений.</small></details>';
 h+='<details class="area-details"><summary>Ближайшие объекты и расстояния</summary><p>По прямой '+(r.polygon?'от края территории':'от точки объекта')+'. Не длина маршрута и не подтверждение возможности подъезда.</p><table>';
 for(const [k,n]of Object.entries(names)){const v=r.near[k];h+='<tr><td>'+n+'</td><td>'+(v?'<b>'+distance(v.metres)+'</b>'+(v.name?'<br>'+esc(v.name):'')+(v.address?'<br>'+esc(v.address):''):'Нет расчёта')+'</td></tr>';}
 h+='</table><small>Жильё определено по явно указанному типу здания. Необозначенные дома в расчёт не включены. Данные OpenStreetMap могут быть неполными.</small></details>';
 h+='<details class="area-details"><summary>Методика и источники</summary><p>Расчёт '+esc(data.date)+'. Исходные границы объектов не изменены. Площади и расстояния рассчитаны в метрической системе UTM 41N. НСПД: векторные ответы на запросы по рамке каждого объекта через QGIS; это выборка найденных зон, а не полный реестр. Окружение: '+esc(data.source)+'.</p></details>';return h;
 }
 const old=window.objectAnalysisCard;window.objectAnalysisCard=o=>'<div class="sec area-analysis" data-area-analysis="'+esc(o.p._id)+'">'+body(String(o.p._id))+'</div><details class="point-analysis"><summary>Кадастр и исходные сведения в точке</summary>'+old(o)+'</details>';
 fetch('area-analysis.json?v=1').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(j=>{data=j;refresh()}).catch(()=>{error=true;refresh()});function refresh(){document.querySelectorAll('[data-area-analysis]').forEach(el=>el.innerHTML=body(el.dataset.areaAnalysis));}
 const style=document.createElement('style');style.textContent='.area-analysis p{margin:5px 0}.area-analysis small{display:block}.area-analysis h4{margin:10px 0 4px;font-size:11px}.area-analysis ul{padding-left:16px}.area-analysis li{margin:7px 0;overflow-wrap:anywhere}.analysis-method{color:var(--muted);font-size:11px}.area-details>summary,.point-analysis>summary{cursor:pointer;padding:7px 0;font-weight:600;font-size:11px}.area-analysis table td{vertical-align:top}.point-analysis{border-top:1px solid #ddd;margin-top:8px}';document.head.append(style);
})();

