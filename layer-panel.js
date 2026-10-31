/* Semantic layer groups; move existing controls to retain their handlers and state. */
(()=>{
 const byId=id=>document.getElementById(id);
 const oldMain=byId('tg').closest('section'),oldInfra=byId('tg2').closest('section');
 const sourceHelp=document.createElement('details');sourceHelp.className='layer-help';sourceHelp.id='layer-help';sourceHelp.innerHTML='<summary>О данных и ограничениях</summary><div class="help-body"></div>';
 const helpBody=sourceHelp.querySelector('.help-body');
 for(const p of [...oldInfra.querySelectorAll('p'),...zoneSection.querySelectorAll('p:not(#zone-status)')])helpBody.append(p);
 const note=document.createElement('p');note.className='dlh';note.textContent='ЗОУИТ и территориальные зоны сохранены как изображения с географической привязкой. Образцы в легенде показывают основные цвета исходной карты; расшифровка отдельных категорий сервисом WMS не предоставлена. Цвет в местах наложения зон может отличаться. Для проверки конкретного ограничения используйте НСПД.';helpBody.append(note);
 const groups=[
  ['Проект и история территории',['t-pp','t-ret','t-retro'],['swc']],
  ['Границы и кадастр',['t-rn','ov-kv','ov-egrn'],[]],
  ['Градостроительное зонирование',['t-gp','zone-zones_5'],['gpop']],
  ['Ограничения использования · ЗОУИТ',['zone-zones_0','zone-zones_1','zone-zones_2','zone-zones_3','zone-zones_4','t-szz'],[]],
  ['Транспорт',['ov-stops','ov-routes'],[]],
  ['Инженерные сети',['ov-power','ov-pipes'],[]],
  ['Природа и рельеф',['ov-oopt','ov-hydro','t-ct'],[]]
 ];
 for(const [title,ids,extra]of groups){const section=document.createElement('section');section.className='layer-group';const heading=document.createElement('h2');heading.textContent=title;const controls=document.createElement('div');controls.className='toggles';section.append(heading,controls);for(const id of ids)controls.append(byId(id));for(const id of extra)section.append(byId(id));oldMain.before(section);}
 const settings=document.createElement('section');settings.className='layer-settings';settings.append(zoneSection.querySelector('label'),zoneStatus,sourceHelp);oldMain.before(settings);
 oldMain.remove();oldInfra.remove();zoneSection.remove();
 const sz=byId('t-szz');sz.textContent='Расчётные СЗЗ · 500 м';
 const extraHelp=document.createElement('p');extraHelp.className='dlh';extraHelp.textContent='СЗЗ 500 м — расчётные буферы вокруг объектов исследования, а не утверждённые границы ЗОУИТ.';helpBody.append(extraHelp);
 new MutationObserver(()=>{if(/не загруз|ошиб/i.test(kvNotice.textContent))sourceHelp.open=true}).observe(kvNotice,{childList:true,characterData:true,subtree:true});
 const style=document.createElement('style');style.textContent='.layer-help{margin-top:12px;font-size:11.5px;color:var(--muted)}.layer-help summary{cursor:pointer;color:var(--ink);padding:5px 0}.help-body{padding:2px 0 6px}.zone-symbols{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.zone-symbol{display:inline-block;width:23px;height:15px;flex:none;border:2px solid var(--symbol);background:var(--wash);border-radius:2px}.zone-legend-label{font-size:10.5px;color:var(--muted)}.layer-settings label{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.layer-settings input{max-width:130px}';document.head.append(style);
 const palettes=[['#0fb2ff'],['#003ce1','#00ae25'],['#86b2e8','#c9a88a'],['#cb2c2c','#1e3cd0','#d3b91e'],['#0052cf','#d30000'],['#2337e6','#f0eba5','#5a370f','#41d737','#e62332','#571f8a','#db0fd6','#4b73aa']];
 Object.entries(ZONES).forEach(([k,v],i)=>{v.palette=palettes[i];v.key=k});
 window.zoneLegend=v=>'<div class="zone-symbols" role="img" aria-label="Основные цвета границ и заливки слоя '+v.name+'">'+v.palette.map(c=>'<i class="zone-symbol" style="--symbol:'+c+';--wash:'+c+'33"></i>').join('')+'</div><div class="zone-legend-label">Границы и заливка зон · основные цвета слоя</div>';
 legend();
})();
