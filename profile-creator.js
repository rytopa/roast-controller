// Pure calculations shared by the preview and the live open-loop controller.
(function(root){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  function validate(c){
    if(!c||Object.values(c).some(x=>!Number.isFinite(x)))return 'Fill in every creator setting with a number.';
    if(c.heat0<1||c.heat1>100||c.heat0>c.heat1)return 'Heater start must be 1–100% and no higher than its maximum.';
    if(c.bt0<0||c.bt1>230||c.bt1<=c.bt0)return 'Heater end BT must be above start BT (up to 230°C).';
    if(c.fan0<10||c.fan0>100||c.fanMin<10||c.fanMin>c.fan0)return 'Fan floor must be 10% or more and no higher than starting fan.';
    if(c.fanBt<0||c.fanBt>230||c.fanStep<=0||c.fanStep>20)return 'Fan reduction must start at 0–230°C and be greater than 0%, up to 20% per interval.';
    if(c.fanInterval!=null&&(!Number.isFinite(c.fanInterval)||c.fanInterval<1||c.fanInterval>50))return 'Fan temperature interval must be between 1°C and 50°C.';
    if(c.maxTime<60||c.maxTime>3600)return 'Maximum time must be between 1:00 and 60:00.';
    return null;
  }
  function at(c,bt){
    return {
      heat:Math.round(c.heat0+(c.heat1-c.heat0)*clamp((bt-c.bt0)/(c.bt1-c.bt0),0,1)),
      fan:Math.round(clamp(c.fan0-Math.max(0,bt-c.fanBt)*c.fanStep/(c.fanInterval??5),c.fanMin,c.fan0))
    };
  }
  root.RoastCreator={validate,at};
})(typeof module==='object'&&module.exports?module.exports:window);
