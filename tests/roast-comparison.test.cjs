const {test}=require('node:test');
const assert=require('node:assert/strict');
const {completed,normalize,sample,summary}=require('../roast-comparison.js');
const roast=(extra={})=>({id:'a',name:'Guji',chargeT:100,events:{dry:10,fc:20,drop:30},weightIn:150,weightOut:126,
  samples:[{t:90,bt:200},{t:100,bt:100,et:150,heat:60,fan:50},{t:110,bt:140,et:170,heat:50,fan:40},
    {t:120,bt:180,et:190,heat:40,fan:30},{t:130,bt:205,et:210,heat:0,fan:100},{t:140,bt:220}],...extra});
test('only completed records qualify; active saves and invalid durations do not',()=>{
  assert.equal(completed(roast()),true);assert.equal(completed({stats:{total:30}}),true);
  for(const r of [null,{}, {events:{drop:null}},{events:{drop:0}},{events:{drop:-1}},{events:{drop:Infinity}}])assert.equal(completed(r),false);
});
test('aligns at Charge, excludes preheat/cooling and never mutates source',()=>{
  const input=roast(),before=JSON.stringify(input),r=normalize(input);
  assert.deepEqual(r.points.map(p=>p.t),[0,10,20,30]);assert.equal(r.end,30);
  assert.equal(JSON.stringify(input),before);assert.equal(r.inferred,false);
});
test('legacy offset follows existing background overlay convention',()=>{
  const r=normalize(roast({chargeT:null,samples:roast().samples.slice(0,-1)}));
  assert.equal(r.points[0].t,0);assert.equal(r.points.at(-1).t,30);assert.equal(r.inferred,true);
});
test('interpolates actual data without extending shorter roasts',()=>{
  const r=normalize(roast());assert.equal(sample(r,5).bt,120);assert.equal(sample(r,5).heat,55);
  assert.equal(sample(r,0).bt,100);assert.equal(sample(r,30).bt,205);
  assert.equal(sample(r,-1),null);assert.equal(sample(r,31),null);
});
test('missing channels and long telemetry gaps stay missing',()=>{
  const r=normalize(roast({chargeT:0,events:{drop:100},samples:[{t:0,bt:100,fan:40},{t:10,bt:null,fan:50},{t:100,bt:200,fan:60}]}));
  assert.equal(sample(r,5).bt,null);assert.equal(sample(r,5).fan,45);assert.equal(sample(r,50),null);
  assert.equal(sample(r,0).et,null);
});
test('summary uses saved event times and calculates phases and weight loss',()=>{
  const s=summary(normalize(roast()));
  assert.equal(s.dry,10);assert.equal(s.fc,20);assert.equal(s.maillard,10);assert.equal(s.development,10);
  assert.ok(Math.abs(s.developmentPct-100/3)<1e-8);assert.ok(Math.abs(s.weightLoss-16)<1e-8);
  assert.equal(s.dropBt,205);assert.equal(s.avgHeat,50);assert.equal(s.avgFan,40);
});
test('missing events stay blank, and stats-based legacy timings are supported',()=>{
  const base=roast({events:{drop:30}});
  assert.equal(summary(normalize(base)).fc,null);assert.equal(summary(normalize(base)).development,null);
  const s=summary(normalize({...base,stats:{de:11,fc:22,dropBt:206,avgHeat:45}}));
  assert.equal(s.dry,11);assert.equal(s.fc,22);assert.equal(s.development,8);assert.equal(s.avgHeat,45);assert.equal(s.dropBt,206);
});
test('invalid weight loss and reversed phases are not presented as measurements',()=>{
  const s=summary(normalize(roast({weightOut:160,events:{dry:20,fc:10,drop:30}})));
  assert.equal(s.weightLoss,null);assert.equal(s.maillard,null);
});
test('duplicate timestamps use latest sample and bad/single-sample records fail cleanly',()=>{
  const r=normalize(roast({samples:[{t:100,bt:100},{t:100,bt:110},{t:130,bt:205},null,{t:NaN}]}));
  assert.equal(r.points.length,2);assert.equal(sample(r,0).bt,110);
  assert.throws(()=>normalize(roast({samples:[{t:100,bt:100}]})),/fewer than two/);
});
