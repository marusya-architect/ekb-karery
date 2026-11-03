/* Per-object point queries from the existing QGIS NSPD connection. */
(()=>{
 let data=null,failed=false;
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups=[['Границы и кадастр',[['quarters','Кадастровые кварталы (НСПД)','ov-kv'],['parcels','Земельные участки ЕГРН','ov-egrn']]],['Градостроительное зонирование',[['zones_5','Территориальные зоны','zone-zones_5']]],['Ограничения использования · ЗОУИТ',zoneDefinitions.slice(0,5).map(([k,n])=>[k,n,'zone-'+k])]];
 function brief(record){
  const keys=['zones_0','zones_1','zones_2','zones_3','zones_4'];
  const zones=keys.flatMap(k=>record[k]?.features||[]);const unique=[...new Map(zones.map((f,i)=>[f.number||f.name||String(i),f])).values()];
  const types=[...new Set(unique.map(f=>f.type||f.name).filter(Boolean))];
  const missing=keys.some(k=>record[k]?.status!=='ok');
  const zoning=record.zones_5,parcels=record.parcels;const lines=[];
  if(unique.length)lines.push('ЗОУИТ: '+unique.length+' записей по точке. '+types.join('; ')+'.');
  else lines.push(missing?'ЗОУИТ: проверка неполная — часть сведений недоступна.':'ЗОУИТ: в ответах по точке не найдены. Это не подтверждает отсутствие ограничений на всей площади.');
  if(zoning?.status==='ok'&&zoning.features.length)lines.push('Зонирование: '+[...new Set(zoning.features.map(f=>f.name||f.type||f.number))].join('; ')+'.');
  else lines.push('Зонирование: '+(zoning?.status==='ok'?'по точке не определено в ответе НСПД.':'сведения недоступны.'));
  if(parcels?.status==='ok'&&parcels.features.length){const uses=[...new Set(parcels.features.map(f=>f.use).filter(Boolean))];lines.push('Кадастр: найдено участков по точке — '+parcels.features.length+(uses.length?'. Использование по сведениям ЕГРН: '+uses.join('; '):'')+'.');}
  else lines.push('Кадастр: '+(parcels?.status==='ok'?'участок по точке не найден в ответе НСПД.':'сведения недоступны.'));
  lines.push(unique.length?'Для выбора сценария: сопоставить проект с перечисленными ограничениями и регламентом территориальной зоны. Наличие ЗОУИТ само по себе не означает запрет любого использования.':'Для выбора сценария: проверить границы всего объекта и градостроительный регламент; данных по одной точке недостаточно для вывода о допустимости проекта.');
  return '<div class="analysis-brief"><b>Краткий вывод по новым слоям</b>'+lines.map(t=>'<p>'+esc(t)+'</p>').join('')+'</div>';
 }
 function body(id){
  if(!data)return '<b>Зоны и кадастр · НСПД</b><p>'+ (failed?'Сведения не загрузились. Обновите страницу для повтора.':'Загрузка сведений…')+'</p>';
  const record=data.objects[id];if(!record)return '<b>Зоны и кадастр · НСПД</b><p>Для этой точки сведения не проверены.</p>';
  let h='<b>Зоны и кадастр · НСПД</b><small>Проверка по точке объекта · '+esc(data.date)+'. Не проверка всей площади.</small>';
  h+=brief(record);
  for(const [title,layers]of groups){const count=layers.reduce((n,[k])=>n+(record[k]?.features?.length||0),0);h+='<details class="analysis-group"><summary>'+title+' · записей: '+count+'</summary>';for(const[k,name,button]of layers){const v=record[k];h+='<div class="analysis-layer"><strong>'+name+'</strong>';
   if(!v||v.status!=='ok')h+='<p class="amb">Не удалось получить сведения.</p>';
   else if(!v.features.length)h+='<p>В ответе сервиса по точке не найдено.</p>';
   else {h+='<ul>';for(const f of v.features){h+='<li><strong>'+esc(f.number||'Без номера')+'</strong>'+(f.name?'<br>'+esc(f.name):'')+(f.type?'<br><small>'+esc(f.type)+'</small>':'');
    if(f.restrictions||f.document||f.address||f.use){h+='<details><summary>Сведения из НСПД</summary>';for(const [label,value]of [['Ограничения',f.restrictions],['Документ',f.document],['Адрес',f.address],['Разрешённое использование',f.use]])if(value)h+='<p><b>'+label+'</b>'+esc(value)+'</p>';h+='</details>';}h+='</li>';}
    h+='</ul>';if(v.limit)h+='<small>Ответ достиг предела выдачи; сведения могут быть неполными.</small>';
   }
   if(k!=='parcels')h+='<button type="button" class="chip" data-analysis-layer="'+button+'">Показать слой</button>';
   h+='</div>';
  }h+='</details>';}
  return h+'<details><summary>Как получены сведения</summary><p>Сохранённые ответы НСПД через QGIS в точке маркера. Отсутствие записи в ответе не подтверждает отсутствие зоны на всей территории объекта. Данные не изменяют автоматически сценарий и стоп-факторы.</p></details>';
 }
 window.objectAnalysisCard=o=>'<div class="sec object-analysis" data-object-analysis="'+esc(o.p._id)+'">'+body(String(o.p._id))+'</div>';
 function refresh(){document.querySelectorAll('[data-object-analysis]').forEach(el=>el.innerHTML=body(el.dataset.objectAnalysis));}
 fetch('object-analysis.json?v=3').then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(j=>{data=j;refresh()}).catch(()=>{failed=true;refresh()});
 document.addEventListener('click',e=>{const b=e.target.closest('[data-analysis-layer]');if(!b)return;const control=document.getElementById(b.dataset.analysisLayer);if(control&&control.getAttribute('aria-pressed')!=='true')control.click();b.textContent='Слой включён';});
 const css=document.createElement('style');css.textContent='.analysis-brief{background:#f0f5ef;border-left:3px solid #66835e;padding:8px;margin:8px 0;font-size:11px}.object-analysis .analysis-group>summary{font-weight:600;color:var(--ink);padding:8px 0}.object-analysis h4{font-size:11px;text-transform:uppercase;color:var(--muted);margin:12px 0 5px}.object-analysis small{display:block}.object-analysis .analysis-layer{margin:7px 0;padding:5px 0;border-bottom:1px solid #ddd}.object-analysis p{margin:4px 0}.object-analysis ul{padding-left:16px}.object-analysis li{margin:6px 0;overflow-wrap:anywhere}.object-analysis summary{cursor:pointer;font-size:11px;color:var(--muted)}.object-analysis details p{white-space:pre-line}.object-analysis .chip{font-size:10px;padding:3px 7px}';document.head.append(css);
})();
