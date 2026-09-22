/* Read-only comparison of completed roast records. No device commands or storage writes. */
(function(root){
  'use strict';
  const finite=v=>typeof v==='number'&&Number.isFinite(v);
  const value=v=>finite(v)?v:null;
  function completed(rec){const end=rec?.events?.drop??rec?.stats?.total;return finite(end)&&end>0;}
  function normalize(rec){
    if(!completed(rec)||!Array.isArray(rec.samples))throw new Error('Choose completed roasts with recorded samples.');
    const end=finite(rec.events?.drop)?rec.events.drop:rec.stats.total;
    const valid=rec.samples.filter(p=>p&&finite(p.t)).sort((a,b)=>a.t-b.t);
    const inferred=!finite(rec.chargeT);
    // Match the existing saved-roast overlay convention for legacy records.
    const base=inferred?(finite(rec.events?.drop)&&valid.length?Math.max(0,valid.at(-1).t-rec.events.drop):0):rec.chargeT;
    const byTime=new Map();
    valid.forEach(p=>{const t=p.t-base;if(t>=0&&t<=end)byTime.set(t,{t,bt:value(p.bt),et:value(p.et),heat:value(p.heat),fan:value(p.fan)});});
    const points=[...byTime.values()];
    if(points.length<2)throw new Error('A selected roast has fewer than two samples between Charge and Drop.');
    return {...rec,points,end,inferred};
  }
  function sample(roast,t){
    const pts=roast.points;
    if(t<pts[0].t||t>pts.at(-1).t)return null;
    let lo=0,hi=pts.length-1;
    while(lo<hi){const mid=Math.floor((lo+hi)/2);if(pts[mid].t<t)lo=mid+1;else hi=mid;}
    if(pts[lo].t===t)return pts[lo];
    const a=pts[lo-1],b=pts[lo];
    if(b.t-a.t>30)return null; // Missing telemetry is a gap, not an invented curve.
    const f=(t-a.t)/(b.t-a.t),result={t};
    for(const k of ['bt','et','heat','fan'])result[k]=a[k]===null||b[k]===null?null:a[k]+(b[k]-a[k])*f;
    return result;
  }
  function average(roast,key){
    let total=0,seconds=0;
    for(let i=1;i<roast.points.length;i++){
      const a=roast.points[i-1],b=roast.points[i],dt=b.t-a.t;
      if(dt<=30&&a[key]!==null){total+=a[key]*dt;seconds+=dt;}
    }
    return seconds?total/seconds:null;
  }
  function summary(roast){
    const st=roast.stats||{},ev=roast.events||{},end=roast.end;
    const event=(a,b)=>{const t=finite(a)?a:b;return finite(t)&&t>=0&&t<=end?t:null;};
    const dry=event(ev.dry,st.de),fc=event(ev.fc,st.fc);
    const last=roast.points.at(-1),dropBt=finite(st.dropBt)?st.dropBt:(end-last.t<=10?last.bt:null);
    return {end,dropBt,dry,fc,maillard:dry!==null&&fc!==null&&fc>=dry?fc-dry:null,
      development:fc===null?null:end-fc,developmentPct:fc===null?null:(end-fc)/end*100,
      weightIn:finite(roast.weightIn)&&roast.weightIn>0?roast.weightIn:null,
      weightOut:finite(roast.weightOut)&&roast.weightOut>0?roast.weightOut:null,
      weightLoss:finite(roast.weightIn)&&finite(roast.weightOut)&&roast.weightIn>0&&roast.weightOut>0&&roast.weightOut<=roast.weightIn?(1-roast.weightOut/roast.weightIn)*100:null,
      avgHeat:finite(st.avgHeat)?st.avgHeat:average(roast,'heat'),avgFan:finite(st.avgFan)?st.avgFan:average(roast,'fan')};
  }
  const api={completed,normalize,sample,summary};
  if(typeof module==='object'&&module.exports){module.exports=api;return;}
  root.RoastComparison=api;
  if(typeof document==='undefined')return;

  const $=id=>document.getElementById(id);
  let roasts=[],pair=null;
  const clock=s=>{s=Math.round(s);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0');};
  const numeric=(v,unit='')=>v===null?'—':v.toFixed(1)+(unit?' '+unit:'');
  const time=v=>v===null?'—':clock(v);
  const delta=(a,b,format)=>a===null||b===null?'—':(b>a?'+':b<a?'−':'')+format(Math.abs(b-a));
  function cell(row,text,tag='td'){const el=document.createElement(tag);el.textContent=text;row.append(el);return el;}
  function row(body,values){const tr=document.createElement('tr');values.forEach((v,i)=>{const c=cell(tr,v,i?'td':'th');if(!i)c.scope='row';});body.append(tr);}
  function fillSelect(select,previous,fallback){
    select.replaceChildren(new Option('Choose a saved roast',''));
    roasts.forEach(p=>select.add(new Option(roastName(p),p.id)));
    select.value=roasts.some(p=>p.id===previous)?previous:(fallback||'');
  }
  function refresh(){
    roasts=loadLogs().filter(completed).reverse();
    const a=$('compareA').value,b=$('compareB').value;
    fillSelect($('compareA'),a,roasts[0]?.id);
    fillSelect($('compareB'),b,roasts.find(p=>p.id!==$('compareA').value)?.id);
    render();
  }
  function render(){
    pair=null;$('compareResults').hidden=true;
    const a=roasts.find(p=>p.id===$('compareA').value),b=roasts.find(p=>p.id===$('compareB').value);
    if(!a||!b){$('compareStatus').textContent='Complete and save at least two roasts in Roast history, then choose one for A and one for B.';return;}
    if(a.id===b.id){$('compareStatus').textContent='Choose two different roasts to compare.';return;}
    try{pair=[normalize(a),normalize(b)];}catch(error){$('compareStatus').textContent=error.message;return;}
    $('compareStatus').textContent='Recorded roasts aligned at Charge. Comparing does not load a roast into the live chart.';
    $('compareResults').hidden=false;
    $('comparePhaseHint').textContent='Timing comes from saved DE / FC / Drop events. Missing events stay blank. Telemetry gaps over 30 seconds are not interpolated.'+(pair.some(p=>p.inferred)?' A legacy record has no saved Charge offset; alignment uses the same inferred offset as background overlays.':'');
    $('compareNameA').textContent='A · '+roastName(a);$('compareNameB').textContent='B · '+roastName(b);
    $('compareNotesA').textContent=a.notes||'No tasting notes saved.';$('compareNotesB').textContent=b.notes||'No tasting notes saved.';
    $('compareBeanA').textContent=a.bean||'Bean not recorded';$('compareBeanB').textContent=b.bean||'Bean not recorded';
    const [sa,sb]=pair.map(summary);
    const tbody=$('compareSummary');tbody.replaceChildren();
    for(const [label,key,format] of [
      ['Roast duration','end',clock],['Drop bean temperature','dropBt',v=>numeric(v,'°C')],
      ['Dry end','dry',time],['First crack','fc',time],['Maillard time','maillard',time],['Development time','development',time],
      ['Development ratio','developmentPct',v=>numeric(v,'%')],['Green weight','weightIn',v=>numeric(v,'g')],
      ['Roasted weight','weightOut',v=>numeric(v,'g')],['Weight loss','weightLoss',v=>numeric(v,'%')],
      ['Average heater','avgHeat',v=>numeric(v,'%')],['Average fan','avgFan',v=>numeric(v,'%')]
    ])row(tbody,[label,sa[key]===null?'—':format(sa[key]),sb[key]===null?'—':format(sb[key]),delta(sa[key],sb[key],['developmentPct','weightLoss','avgHeat','avgFan'].includes(key)?v=>numeric(v,'pp'):format)]);
    const end=Math.max(sa.end,sb.end);$('compareTime').max=String(end);$('compareTime').value=String(Math.min(+$('compareTime').value,end));
    draw();inspect();
    const values=$('compareValues');values.replaceChildren();
    const step=Math.max(60,Math.ceil(end/120/60)*60),times=new Set(pair.flatMap(p=>[p.points[0].t,p.points.at(-1).t]));
    for(let t=0;t<=end;t+=step)times.add(t);
    $('compareTableHint').textContent='Recorded BT and output values every '+clock(step)+', plus first and last samples. A dash means missing telemetry or outside that roast’s recording.';
    [...times].sort((x,y)=>x-y).forEach(t=>{
      const [va,vb]=pair.map(p=>sample(p,t));
      row(values,[clock(t),numeric(va?.bt??null),numeric(vb?.bt??null),delta(va?.bt??null,vb?.bt??null,v=>numeric(v)),numeric(va?.heat??null),numeric(vb?.heat??null),numeric(va?.fan??null),numeric(vb?.fan??null)]);
    });
  }
  function roastName(r){
    const d=new Date(r.date),date=Number.isNaN(d.getTime())?'':d.toLocaleDateString();
    return [r.code?'#'+r.code:'',r.name||'Unnamed roast',date].filter(Boolean).join(' · ');
  }
  const signals={bt:['Bean temperature','°C'],et:['Exhaust temperature','°C'],heat:['Heater output','%'],fan:['Fan output','%']};
  function inspect(){
    if(!pair)return;
    const t=+$('compareTime').value,[a,b]=pair.map(p=>sample(p,t));
    $('compareAt').textContent=clock(t);
    $('compareTime').setAttribute('aria-valuetext',clock(t));
    const key=$('compareSignal').value,unit=signals[key][1];
    $('compareReading').textContent='A: '+numeric(a?.[key]??null,unit)+' · B: '+numeric(b?.[key]??null,unit)+' · Difference (B − A): '+delta(a?.[key]??null,b?.[key]??null,v=>numeric(v,unit));
    const line=$('compareCursor');if(line){const x=44+t/(+$('compareChart').dataset.end)*(+$('compareChart').dataset.plotWidth);line.setAttribute('x1',x);line.setAttribute('x2',x);}
  }
  function svgEl(tag,attrs={},text){const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;return n;}
  function draw(){
    const svg=$('compareChart');svg.replaceChildren();
    svg.append(svgEl('title',{},'Recorded roast comparison: A is solid, B is dashed. Use the time slider to inspect values.'));
    const end=Math.max(60,Math.ceil(Math.max(...pair.map(p=>p.end))/60)*60);
    const key=$('compareSignal').value,unit=signals[key][1];
    const ymax=unit==='%'?100:Math.max(50,Math.ceil(pair.reduce((max,p)=>p.points.reduce((m,q)=>Math.max(m,q[key]??0),max),0)/25)*25);
    const width=Math.max(320,svg.clientWidth),right=width-24,plotWidth=right-44;
    svg.setAttribute('viewBox','0 0 '+width+' 330');svg.dataset.plotWidth=plotWidth;
    const X=t=>44+t/end*plotWidth,Y=v=>270-v/ymax*240;svg.dataset.end=end;
    for(let i=0;i<=5;i++){
      const temp=i*ymax/5,y=Y(temp),t=i*end/5,x=X(t);
      svg.append(svgEl('line',{x1:44,y1:y,x2:right,y2:y,class:'comparison-grid'}));
      svg.append(svgEl('text',{x:36,y:y+4,'text-anchor':'end'},String(Math.round(temp))));
      svg.append(svgEl('text',{x,y:294,'text-anchor':'middle'},clock(t)));
    }
    svg.append(svgEl('text',{x:44,y:18},signals[key][0]+' '+unit),svgEl('text',{x:right,y:320,'text-anchor':'end'},'Time since Charge (m:ss)'));
    pair.forEach((p,i)=>{
      let path='',previous=null;
      for(const q of p.points){
        if(q[key]===null){previous=null;continue;}
        path+=(previous&&q.t-previous.t<=30?'L':'M')+X(q.t)+','+Y(q[key])+' ';
        previous=q;
      }
      svg.append(svgEl('path',{d:path,fill:'none',class:i?'comparison-b':'comparison-a','stroke-width':2.5,'stroke-dasharray':i?'9 5':'none','vector-effect':'non-scaling-stroke'}));
    });
    svg.append(svgEl('line',{id:'compareCursor',x1:44,x2:44,y1:30,y2:270,class:'comparison-cursor'}));
  }
  $('compareA').addEventListener('change',render);$('compareB').addEventListener('change',render);
  $('compareSwap').addEventListener('click',()=>{const a=$('compareA').value;$('compareA').value=$('compareB').value;$('compareB').value=a;render();});
  $('compareTime').addEventListener('input',inspect);
  $('compareSignal').addEventListener('change',()=>{if(pair){draw();inspect();}});
  let chartWidth=0;
  new ResizeObserver(entries=>{const width=entries[0].contentRect.width;if(pair&&width>0&&width!==chartWidth){chartWidth=width;draw();inspect();}}).observe($('compareChart'));
  let refreshTimer;
  document.addEventListener('roasts-updated',()=>{clearTimeout(refreshTimer);refreshTimer=setTimeout(refresh,100);});
  window.addEventListener('storage',event=>{if(event.key==='rc_logs_v1'||event.key===null)refresh();});
  refresh();
})(typeof globalThis!=='undefined'?globalThis:this);
