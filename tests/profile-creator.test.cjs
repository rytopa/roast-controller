const test=require('node:test');
const assert=require('node:assert/strict');
const {RoastCreator}=require('../profile-creator.js');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const tickSource=html.slice(html.indexOf('function ppTick(){'),html.indexOf('// ---------- Between-batch protocol ----------'));

const config={heat0:60,heat1:80,bt0:40,bt1:160,fan0:60,fanBt:150,fanStep:1,fanMin:48,maxTime:540};

test('power ramps continuously with measured BT and respects its cap',()=>{
  assert.equal(RoastCreator.validate(config),null);
  assert.equal(RoastCreator.at(config,40).heat,60);
  assert.equal(RoastCreator.at(config,100).heat,70);
  assert.equal(RoastCreator.at(config,160).heat,80);
  assert.equal(RoastCreator.at(config,210).heat,80);
});

test('fan tapers by one percentage point per 5°C, with a safe floor',()=>{
  assert.equal(RoastCreator.at(config,150).fan,60);
  assert.equal(RoastCreator.at(config,155).fan,59);
  assert.equal(RoastCreator.at(config,175).fan,55);
  assert.equal(RoastCreator.at(config,250).fan,48);
});

test('invalid ranges cannot be armed',()=>{
  assert.match(RoastCreator.validate({...config,bt1:40}),/above start/);
  assert.match(RoastCreator.validate({...config,fanMin:5}),/Fan floor/);
  assert.match(RoastCreator.validate({...config,maxTime:NaN}),/valid m:ss/);
});

test('time-based heater advances while BT-based fan waits for the turning point',()=>{
  const c={...config,heatBasis:'time',heatTime0:10,heatTime1:110};
  assert.equal(RoastCreator.validate(c),null);
  assert.deepEqual(RoastCreator.at(c,190,60,false),{heat:70,fan:60});
  assert.equal(RoastCreator.at(c,190,120,false).heat,80);
});

test('heater curve shapes keep endpoints and change the middle of the ramp',()=>{
  assert.equal(RoastCreator.at({...config,heatShape:'front'},100).heat,75);
  assert.equal(RoastCreator.at({...config,heatShape:'back'},100).heat,65);
  for(const heatShape of ['linear','front','back']){
    assert.equal(RoastCreator.at({...config,heatShape},40).heat,60);
    assert.equal(RoastCreator.at({...config,heatShape},200).heat,80);
  }
});

test('stepped fan waits for full temperature and time intervals',()=>{
  const c={...config,fanMode:'steps',fanInterval:3};
  assert.equal(RoastCreator.at(c,152.99).fan,60);
  assert.equal(RoastCreator.at(c,153).fan,59);
  const timed={...c,fanBasis:'time',fanTime0:60,fanTimeInterval:10};
  assert.equal(RoastCreator.validate(timed),null);
  assert.equal(RoastCreator.at(timed,40,69.99,false).fan,60);
  assert.equal(RoastCreator.at(timed,40,70,false).fan,59);
  assert.equal(RoastCreator.at({...timed,fanMode:'smooth'},40,68,false).fan,59);
});

test('zero reduction holds fan; malformed clocks and reversed ramps are rejected',()=>{
  assert.equal(RoastCreator.validate({...config,fanStep:0}),null);
  assert.equal(RoastCreator.at({...config,fanStep:0},230).fan,60);
  assert.equal(RoastCreator.parseClock('3:20'),200);
  assert.equal(RoastCreator.parseClock('90'),90);
  assert.ok(Number.isNaN(RoastCreator.parseClock('1:75')));
  assert.ok(Number.isNaN(RoastCreator.parseClock('')));
  assert.match(RoastCreator.validate({...config,heatBasis:'time',heatTime0:100,heatTime1:90}),/times must increase/);
});

test('fan interval can be changed to 3°C and rejects zero',()=>{
  const c={...config,fanInterval:3};
  assert.equal(RoastCreator.validate(c),null);
  assert.equal(RoastCreator.at(c,150).fan,60);
  assert.equal(RoastCreator.at(c,153).fan,59);
  assert.equal(RoastCreator.at(c,156).fan,58);
  assert.equal(RoastCreator.at(c,186).fan,48);
  assert.match(RoastCreator.validate({...c,fanInterval:0}),/interval/);
});

function controller(recipe){
  const sent=[],fields={ppEndBt:{value:'210'},ppStatus:{}};
  const ctx={RoastCreator,pprof:{creator:recipe,steps:[{t:0,heat:55,fan:60},{t:120,heat:0}],startT:0,lastOut:60,lastFan:60,soakPct:null,btMin:null,btArmed:false},
    linkLost:false,fanOverride:false,samples:[{t:60,bt:190,et:200}],nowT:()=>60,$:id=>fields[id],send:s=>sent.push(s),fireAlarm:()=>{},log:()=>{},fmt:String,
    finishPProf:()=>{sent.push('FINISH');ctx.pprof=null;}};
  vm.createContext(ctx);vm.runInContext(tickSource,ctx);return{ctx,sent};
}

test('live controller uses independent time rules and still stops at drop BT',()=>{
  const {ctx,sent}=controller({...config,heatBasis:'time',heatTime0:0,heatTime1:120,fanBasis:'time',fanTime0:30,fanTimeInterval:10,fanMode:'steps'});
  ctx.ppTick();assert.deepEqual(sent,['OT1,70','IO3,57']);
  ctx.samples[0].bt=211;ctx.ppTick();assert.equal(sent.at(-1),'FINISH');
});

test('live controller cuts stale telemetry and preserves the fixed schedule mode',()=>{
  const timed=controller({...config,heatBasis:'time',heatTime0:0,heatTime1:120});
  timed.ctx.samples[0].t=40;timed.ctx.ppTick();assert.deepEqual(timed.sent,['OT1,0']);
  const fixed=controller(null);fixed.ctx.ppTick();assert.deepEqual(fixed.sent,['OT1,55']);
});
