// Pure calculations shared by the preview and the live open-loop controller.
(function(root){
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const inRange=(x,a,b)=>Number.isFinite(x)&&x>=a&&x<=b;
  function parseClock(value){
    const s=String(value).trim();
    if(/^\d+(?:\.\d+)?$/.test(s))return Number(s);
    if(!/^\d+:[0-5]\d$/.test(s))return NaN;
    const [m,sec]=s.split(':').map(Number);return m*60+sec;
  }
  function validate(c){
    if(!c)return 'Fill in the creator settings.';
    if(!['bt','time'].includes(c.heatBasis??'bt')||!['bt','time'].includes(c.fanBasis??'bt'))return 'Choose bean temperature or time for each control.';
    if(!['linear','front','back'].includes(c.heatShape??'linear'))return 'Choose a heater curve shape.';
    if(!['smooth','steps'].includes(c.fanMode??'smooth'))return 'Choose smooth or stepped fan changes.';
    if(!inRange(c.heat0,0,100)||!inRange(c.heat1,c.heat0,100))return 'Heater start must be 0–100% and no higher than its maximum.';
    if(!inRange(c.maxTime,60,3600))return 'Maximum time must be a valid m:ss between 1:00 and 60:00.';
    if(c.heatBasis==='time'){
      if(!inRange(c.heatTime0,0,c.maxTime)||!inRange(c.heatTime1,0,c.maxTime)||c.heatTime1<=c.heatTime0)return 'Heater ramp times must increase and finish by the maximum roast time.';
    }else if(!inRange(c.bt0,0,230)||!inRange(c.bt1,0,230)||c.bt1<=c.bt0)return 'Heater end BT must be above start BT (up to 230°C).';
    if(!inRange(c.fan0,10,100)||!inRange(c.fanMin,10,c.fan0))return 'Fan floor must be 10% or more and no higher than starting fan.';
    if(!inRange(c.fanStep,0,20))return 'Fan reduction must be 0–20% per interval.';
    if(c.fanBasis==='time'){
      if(!inRange(c.fanTime0,0,c.maxTime)||!inRange(c.fanTimeInterval,1,600))return 'Fan start time must be within the roast, and the interval must be 1–600 seconds.';
    }else{
      if(!inRange(c.fanBt,0,230))return 'Fan reduction must start at 0–230°C.';
      if(!inRange(c.fanInterval??5,1,50))return 'Fan temperature interval must be between 1°C and 50°C.';
    }
    return null;
  }
  function at(c,bt,elapsed=0,btReady=true){
    const timedHeat=c.heatBasis==='time',timedFan=c.fanBasis==='time';
    const btUsable=btReady&&Number.isFinite(bt);
    let x=timedHeat?clamp((elapsed-c.heatTime0)/(c.heatTime1-c.heatTime0),0,1)
      :btUsable?clamp((bt-c.bt0)/(c.bt1-c.bt0),0,1):0;
    if(c.heatShape==='front')x=x*(2-x);
    else if(c.heatShape==='back')x=x*x;
    let intervals=timedFan?Math.max(0,elapsed-c.fanTime0)/c.fanTimeInterval
      :btUsable?Math.max(0,bt-c.fanBt)/(c.fanInterval??5):0;
    if(c.fanMode==='steps')intervals=Math.floor(intervals);
    return {
      heat:Math.round(c.heat0+(c.heat1-c.heat0)*x),
      fan:Math.round(clamp(c.fan0-intervals*c.fanStep,c.fanMin,c.fan0))
    };
  }
  root.RoastCreator={validate,at,parseClock};
})(typeof module==='object'&&module.exports?module.exports:window);
