/* Semantic layer groups; move existing controls to retain their handlers and state. */
(()=>{
 const byId=id=>document.getElementById(id);
 const oldMain=byId('tg').closest('section'),oldInfra=byId('tg2').closest('section');
 const sourceHelp=document.createElement('details');sourceHelp.className='layer-help';sourceHelp.id='layer-help';sourceHelp.innerHTML='<summary>О данных и ограничениях</summary><div class="help-body"></div>';
 const helpBody=sourceHelp.querySelector('.help-body');
 for(const p of [...oldInfra.querySelectorAll('p'),...zoneSection.querySelectorAll('p:not(#zone-status)')])helpBody.append(p);
 const note=document.createElement('p');note.className='dlh';note.textContent='ЗОУИТ и территориальные зоны сохранены как изображения с географической привязкой. Образцы в легенде показывают основные цвета исходной карты; расшифровка отдельных категорий сервисом WMS не предоставлена. Цвет в местах наложения зон может отличаться. Для проверки конкретного ограничения используйте НСПД.';helpBody.append(note);
 chip(byId('tg'),'t-go','Граница ГО Екатеринбург',true,on=>{for(const l of [go,goHalo])on?l.addTo(map):map.removeLayer(l);legend()});
 const groups=[
  ['Проект и история территории',['t-pp','t-ret','t-retro'],['swc']],
  ['Границы и кадастр',['t-go','t-rn','ov-kv','ov-egrn'],[]],
  ['Градостроительное зонирование',['t-gp','zone-zones_5'],['gpop']],
  ['Ограничения использования · ЗОУИТ',['zone-zones_0','zone-zones_1','zone-zones_2','zone-zones_3','zone-zones_4','t-szz'],[]],
  ['Транспорт',['ov-stops','ov-routes'],[]],
  ['Инженерные сети',['ov-power','ov-pipes'],[]],
  ['Природа и рельеф',['ov-oopt','ov-hydro','t-ct'],[]]
 ];
 window.layerGroups=groups;
 for(const [title,ids,extra]of groups){const section=document.createElement('section');section.className='layer-group';const heading=document.createElement('h2');heading.textContent=title;const controls=document.createElement('div');controls.className='toggles';section.append(heading,controls);for(const id of ids)controls.append(byId(id));for(const id of extra)section.append(byId(id));oldMain.before(section);}
 const settings=document.createElement('section');settings.className='layer-settings';settings.append(zoneSection.querySelector('label'),zoneStatus,sourceHelp);oldMain.before(settings);
 oldMain.remove();oldInfra.remove();zoneSection.remove();
 const sz=byId('t-szz');sz.textContent='Расчётные СЗЗ · 500 м';
 const extraHelp=document.createElement('p');extraHelp.className='dlh';extraHelp.textContent='СЗЗ 500 м — расчётные буферы вокруг объектов исследования, а не утверждённые границы ЗОУИТ.';helpBody.append(extraHelp);
 new MutationObserver(()=>{if(/не загруз|ошиб/i.test(kvNotice.textContent))sourceHelp.open=true}).observe(kvNotice,{childList:true,characterData:true,subtree:true});
 const style=document.createElement('style');style.textContent='.layer-help{margin-top:12px;font-size:11.5px;color:var(--muted)}.layer-help summary{cursor:pointer;color:var(--ink);padding:5px 0}.help-body{padding:2px 0 6px}.zone-symbols{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.zone-symbol{display:inline-block;width:23px;height:15px;flex:none;border:2px solid var(--symbol);background:var(--wash);border-radius:2px}.zone-legend-label{font-size:10.5px;color:var(--muted)}.layer-settings label{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.layer-settings input{max-width:130px}';document.head.append(style);
 const palettes=[['#0fb2ff'],['#003ce1','#00ae25'],['#86b2e8','#c9a88a'],['#cb2c2c','#1e3cd0','#d3b91e'],['#0052cf','#d30000'],['#2337e6','#f0eba5','#5a370f','#41d737','#e62332','#571f8a','#db0fd6','#4b73aa']];
 Object.entries(ZONES).forEach(([k,v],i)=>{v.palette=palettes[i];v.key=k});
 window.zoneLegend=v=>v.palette.map(c=>'<div class="lg"><i class="zone-symbol" style="--symbol:'+c+';--wash:'+c+'33"></i><span>'+v.name+'</span></div>').join('');

 window.groupedLayerLegend=r=>{
  const line=(c,dashed=false)=>'<i class="ln" style="border-color:'+c+';border-top-width:2px;'+(dashed?'border-top-style:dashed':'')+'"></i>';
  const area=(c)=>'<i class="ar" style="background:'+c+';border:1px solid #666"></i>';
  function content(id){
   const label=byId(id).textContent;
   if(id.startsWith('zone-'))return window.zoneLegend(ZONES[id.slice(5)]);
   if(id==='t-go')return r(line('#d62728',true),label);
   if(id==='t-rn')return r(line('#ef6a74'),label);
   if(id==='ov-kv')return r(line('#d7191c'),label);
   if(id.startsWith('ov-')){const v=OVS[id.slice(3)];return v.lg.map(([t,c,desc])=>r(t==='c'?'<i class="c" style="background:'+c+'"></i>':t==='l'?line(c):area(c),label+(v.lg.length>1?' · '+desc:''))).join('');}
   if(id==='t-ret')return r('<i style="font-style:normal">🕓</i>',label);
   if(id==='t-retro')return r(area('linear-gradient(135deg,#7b8060,#b8a388)'),label);
   if(id==='t-gp')return r(area('linear-gradient(90deg,#f26a50,#c2007b,#8a6364,#1c8f68,#cfd0ff)'),label+' · <a href="'+GPL+'" target="_blank" rel="noopener">все обозначения</a>');
   if(id==='t-ct')return r(line('#8a5a2b'),label+' · основные и утолщённые горизонтали');
   if(id==='t-szz')return r(area('rgba(230,126,34,.4)'),label+' · карьеры и отвалы')+r(area('rgba(158,123,196,.3)'),label+' · свалки и полигоны ТБО');
   if(id==='t-pp')return ['граница_пилотной_площадки','зона_ограничения_доступа_30м','входная_зона','зона_музеефикации','зона_регулируемой_водной_рекреации','рекультивация_отвала','экотропа','смотровые_площадки'].map(k=>r(k==='экотропа'||k==='граница_пилотной_площадки'?line(PPCol(k),k==='граница_пилотной_площадки'):k==='смотровые_площадки'?'<i class="c" style="background:#fff"></i>':area(PPCol(k)),label+' · '+PPN[k].replace(' (буфер 500 м)',''))).join('');
   return '';
  }
  return window.layerGroups.map(([title,ids])=>{const active=ids.filter(id=>byId(id).getAttribute('aria-pressed')==='true');return active.length?'<h4>'+title+'</h4>'+active.map(content).join(''):''}).join('');
 };
 legend();
})();
