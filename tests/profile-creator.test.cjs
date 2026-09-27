const test=require('node:test');
const assert=require('node:assert/strict');
const {RoastCreator}=require('../profile-creator.js');

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
  assert.match(RoastCreator.validate({...config,maxTime:NaN}),/number/);
});
