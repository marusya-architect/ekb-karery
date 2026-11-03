/* Keep a visible explanation if an online basemap cannot load. */
(()=>{
 const status=document.createElement('p');status.className='dlh';status.id='basemap-status';status.setAttribute('role','status');document.getElementById('bm').after(status);
 const failed={sat:false,osm:false};
 function update(){status.hidden=!failed[bmCur];status.textContent=bmCur==='sat'?'Подробный космоснимок не загрузился полностью. На пропусках показан сохранённый снимок меньшей детализации.':'Часть карты OSM не загрузилась. Проверьте соединение или выберите векторную условную карту.';}
 for(const [key,layer]of [['sat',satelliteTiles],['osm',osmBase]]){layer.on('loading',()=>{failed[key]=false;update()});layer.on('tileerror',()=>{failed[key]=true;update()});}
 document.getElementById('bm').addEventListener('click',update);update();
 const help=document.createElement('p');help.className='dlh';help.textContent='Три подложки: подробный космоснимок Esri, сохранённая векторная условная карта из QGIS и карта OpenStreetMap. Esri и OSM подгружаются через интернет при перемещении и приближении. Дата съёмки и детализация Esri зависят от участка; при недоступности сервиса остаётся сохранённый обзорный снимок.';document.querySelector('#layer-help .help-body').append(help);
})();
