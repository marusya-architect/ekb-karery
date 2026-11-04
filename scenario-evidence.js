/* Evidence from the EKB project registry. Engineering and legal approvals require documents. */
const pilotQuarries=[1,37];
function scenarioEvidence(o){
 const p=o.p;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const traits=[p.pos&&('положение — '+p.pos),p.ландшафт&&('ландшафт — '+p.ландшафт)].filter(Boolean);
 const stops=(p.stops||[]).map(([level,text])=>({level,text}));
 const check=(title,pattern,needed)=>{
  const item=stops.find(s=>pattern.test(s.text));
  const status=item?.level==='red'?'Выявлено ограничение в проектной оценке':'Нет документального подтверждения';
  return '<li><b>'+title+'</b><br>'+status+'. '+esc(needed)+(item?'<br><small>По реестру проекта, октябрь 2026 г. '+esc(item.text)+'</small>':'')+'</li>';
 };
 const checks=check('Устойчивость откосов и грунтов',/устойчив|откос/i,'Нужны результаты инженерных изысканий.')+
 check('Состояние почвы и воды',/загряз|обследован/i,'Нужны результаты обследования и проб.')+
 check('Безопасный доступ и обслуживание',/подъезд|проезд|доступ/i,'Нужны сведения о пригодности въезда и возможности обслуживания.')+
 check('Правовое основание использования',/правов|добыча|эксплуатац/i,'Проверить документы на участок и применимые регламенты.');
 let h='<div class="sec"><b>Основание сценария</b>'+esc(traits.join('. '))+'. '+(p.exact?'Точное совпадение':'Ближайшее сочетание признаков')+' по строке '+esc(p.row)+' типологической матрицы.</div>'+
 '<details class="sec"><summary>Что требуется подтвердить</summary><ul>'+checks+'</ul>'+
 (p.fz?'<p>Функциональная зона генплана: '+esc(p.fz)+' · '+esc(p.fzn)+'</p>':'')+
 '<button type="button" class="chip" data-evidence-plan>Показать функциональные зоны генплана</button></details>';
 if(pilotQuarries.includes(p._id))h+='<div class="sec"><b>Связанные территории</b>Старая Линза и Новая Линза входят в пилотную площадку «Шабровские карьеры».<small>Источник: материалы проектного предложения по Екатеринбургу, октябрь 2026 г.</small><button type="button" class="chip" data-show-pilot>Показать вместе</button></div>';
 return h;
}
let pilotSelection;
document.addEventListener('click',event=>{
 if(event.target.closest('[data-evidence-plan]')){const button=document.getElementById('t-gp');if(button.getAttribute('aria-pressed')!=='true')button.click();}
 if(!event.target.closest('[data-show-pilot]'))return;
 if(pilotSelection)map.removeLayer(pilotSelection);
 const members=pilotQuarries.map(id=>byId[id]);
 pilotSelection=L.geoJSON(members.map(o=>o.f),{interactive:false,style:{color:'#ffd632',weight:4,fillOpacity:.13}}).addTo(map);
 map.closePopup();map.fitBounds(pilotSelection.getBounds(),{padding:[40,40],maxZoom:15});map.once('popupopen',()=>{if(pilotSelection)map.removeLayer(pilotSelection)});
});
