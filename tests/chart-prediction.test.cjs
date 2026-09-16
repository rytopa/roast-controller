const {test} = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const vm = require('node:vm');
const source = readFileSync(process.env.ROAST_SOURCE || 'index.html', 'utf8');
// Exercise the actual renderer's domain/marker code without a DOM or Bluetooth device.
const chart = source.slice(source.indexOf('function drawChart(){'));
const domain = chart.slice(chart.indexOf('  const yMax=260;'), chart.indexOf('  const X=t=>'));
function range(overrides = {}) {
  const context = {
    samples:[{t:240}], chargeMs:1000, connectMs:1000, events:{drop:null},
    chartFrozen:false, profile:null, manMode:false, bg:null, pred:null,
    getPoints:()=>[{t:0,sv:150},{t:600,sv:205}], soakClockAfter:()=>false,
    ...overrides
  };
  return vm.runInNewContext(domain + '\ntMax;', context);
}
test('fluctuating FC/DE estimates and missing predictions do not zoom the chart', () => {
  for (const pred of [null,{fc:{at:720}},{fc:{at:1800}},{fc:{at:410}},
    {de:{at:1200}},{de:{at:330}},null]) {
    assert.equal(range({pred}),600);
  }
});
test('manual roast range ignores far-future predictions too', () => {
  assert.equal(range({manMode:true,pred:{fc:{at:1800}}}),360);
  assert.equal(range({manMode:true,pred:null}),360);
});
test('actual roast growth extends in two-minute steps, not on every sample', () => {
  assert.equal(range({samples:[{t:529}]}),600);
  assert.equal(range({samples:[{t:531}]}),720);
  assert.equal(range({samples:[{t:600}]}),720);
  assert.equal(range({samples:[{t:649}]}),720);
  assert.equal(range({samples:[{t:651}]}),840);
});
test('finished roast still fits its recorded duration without live rounding', () => {
  assert.equal(range({chartFrozen:true,samples:[{t:617}],events:{drop:617}}),647);
});
test('profile and background roast duration remain in view', () => {
  assert.equal(range({profile:{startT:20,points:[{t:0},{t:760}]}}),840);
  assert.equal(range({bg:{base:0,samples:[{t:870}]}}),960);
});
test('pre-charge preview is not rounded', () => {
  assert.equal(range({chargeMs:null,getPoints:()=>[{t:0},{t:650}]}),650);
});
const markerStart = chart.indexOf("    for(const[k,T,col,name] of [['de'");
const markerEnd = chart.indexOf("    ctx.lineWidth=1;ctx.font='10px system-ui';}", markerStart);
function markers(pred) {
  const calls=[];
  const ctx = {beginPath(){},fill(){},stroke(){},
    arc:(...args)=>calls.push(['arc',...args]),
    moveTo:(...args)=>calls.push(['moveTo',...args]),
    lineTo:(...args)=>calls.push(['lineTo',...args]),
    measureText:text=>({width:text.length*6}),
    fillText:(...args)=>calls.push(['text',...args])};
  vm.runInNewContext(chart.slice(markerStart,markerEnd), {
    Pp:pred, base:30, tMax:600, X:t=>34+t, Y:t=>260-t,
    deT:160,fcT:200,P:{ev:{dry:'gold',fc:'red'},badgeBg:'black'},
    ctx,W:700,pR:30,fmt:s=>Math.floor(s/60)+':'+String(s%60).padStart(2,'0')
  });
  return calls;
}
test('off-screen prediction retains full ETA and an edge arrow, not a false event dot', () => {
  const calls=markers({fc:{at:900}});
  assert.equal(calls.filter(c=>c[0]==='arc').length,0);
  assert.ok(calls.some(c=>c[0]==='lineTo'&&c[1]===634));
  assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='FC ~15:00 →'));
});
test('in-range DE/FC markers keep their actual time positions', () => {
  const calls=markers({de:{at:300},fc:{at:500}});
  assert.deepEqual(calls.filter(c=>c[0]==='arc').map(c=>c[1]),[364,564]);
  assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='DE ~5:00'));
  assert.ok(calls.some(c=>c[0]==='text'&&c[1]==='FC ~8:20'));
});
