const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readFileSync}=require('node:fs');
const vm=require('node:vm');
const source=readFileSync('index.html','utf8');
const between=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
function setup(){
  const inventory=[{id:'bean-a',name:'Guji',notes:'Blueberry, jasmine\nSweet finish'},{id:'bean-b',name:'Brazil',notes:'Cocoa, hazelnut'}];
  let logs=[];
  const elements=new Map();
  const $=id=>{
    if(!elements.has(id))elements.set(id,{value:'',style:{},textContent:'',innerHTML:'',options:[],classList:{toggle(){}},addEventListener(type,fn){this[type]=fn;}});
    return elements.get(id);
  };
  $('beanInfo').value='Guji';$('wIn').value='150';
  const context=vm.createContext({$,loadInventory:()=>inventory,loadLogs:()=>JSON.parse(JSON.stringify(logs)),
    saveLogs:a=>{logs=JSON.parse(JSON.stringify(a));return true;},
    invUse:{itemId:'bean-a'},chargeMs:1000,connectMs:1000,batchCode:'ABC',newBatchCode:()=> 'DEF',
    sessionId:'session-a',sessionClosed:false,chartRoastId:null,roastStats:()=>null,
    samples:[{t:30,bt:130,et:170,heat:60,fan:50,sv:140}],events:{charge:0,drop:null},
    refreshRoastSelect(){},log(){},escapeHtml:s=>s});
  vm.runInContext(between('function buildRoastRec(name){','// ---------- Roast notes + star ----------'),context);
  vm.runInContext(between('let curRoastId=null,curStar=false',"$('btnStar').addEventListener"),context);
  vm.runInContext(between('function autoSaveRoast(){','function syncAutoSaved(){'),context);
  return {context,$,inventory,logs:()=>logs,run:s=>vm.runInContext(s,context)};
}
test('Charge prefills selected bean notes, including multiline tasting text',()=>{
  const s=setup();s.run('startNotesForLiveRoast()');
  assert.equal(s.$('roastNotes').value,'Bean notes — Guji\nBlueberry, jasmine\nSweet finish');
  assert.equal(s.$('roastSelect').value,'');
});
test('Drop auto-save stores a snapshot independent of later inventory edits',()=>{
  const s=setup();s.run('startNotesForLiveRoast()');
  s.inventory[0].notes='Changed after Charge';s.run('autoSaveRoast()');
  assert.equal(s.logs()[0].notes,'Bean notes — Guji\nBlueberry, jasmine\nSweet finish');
  s.run('setCurRoast(loadLogs()[0])');
  assert.equal(s.$('roastNotes').value,s.logs()[0].notes);
});
test('own tasting edits survive auto-save and later save refreshes',()=>{
  const s=setup();s.run('startNotesForLiveRoast()');
  s.$('roastNotes').value+='\nCup: more chocolate after resting.';s.$('roastNotes').input();
  s.run('autoSaveRoast()');
  assert.match(s.logs()[0].notes,/Cup: more chocolate after resting\./);
  s.$('roastNotes').value='My revised tasting notes';s.$('roastNotes').input();
  s.run('autoSaveRoast()');assert.equal(s.logs()[0].notes,'My revised tasting notes');
});
test('a new batch uses its own bean and never overwrites the previous roast',()=>{
  const s=setup();s.run('startNotesForLiveRoast();autoSaveRoast()');
  const previous=s.logs()[0].notes;
  s.context.invUse.itemId='bean-b';s.context.sessionId='session-b';
  s.run('startNotesForLiveRoast()');
  assert.equal(s.$('roastNotes').value,'Bean notes — Brazil\nCocoa, hazelnut');
  assert.equal(s.logs()[0].notes,previous);
});
test('untracked, missing and empty-note beans start with blank notes',()=>{
  const s=setup();s.inventory.push({id:'empty',name:'Empty',notes:'  '});
  for(const id of ['', 'deleted', 'empty']){
    s.context.invUse.itemId=id;s.run('startNotesForLiveRoast()');
    assert.equal(s.$('roastNotes').value,'');
    assert.equal(s.run("buildRoastRec('Manual save').notes"),'');
  }
});
