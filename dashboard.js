/* Progressive presentation enhancements; do not send hardware commands here. */
(() => {
  const byId = id => document.getElementById(id);
  // Route the always-visible stop through the existing emergency/drop path.
  byId('quickStop').addEventListener('click', () => byId('crStop').click());

  const names = {
    crHeatM:'Decrease heater by 1 percent', crHeatP:'Increase heater by 1 percent',
    crFanM:'Decrease fan by 1 percent', crFanP:'Increase fan by 1 percent',
    crHeatM5:'Decrease heater by 5 percent', crHeatP5:'Increase heater by 5 percent',
    crFanM5:'Decrease fan by 5 percent', crFanP5:'Increase fan by 5 percent',
    crHeatOff:'Turn heater off (manual control)', crFanOff:'Turn fan off',
    profSelect:'Saved profiles', profName:'Profile name', profNotes:'Profile notes',
    roastSelect:'Saved roasts', roastNotes:'Roast notes', customSvc:'Custom Bluetooth service UUID',
    manHeat:'Opening heater percent', manFan:'Opening fan percent',
    bbpCool:'Cool to temperature in Celsius', bbpCharge:'Charge temperature in Celsius', bbpFan:'Charge fan percent',
    rorWin:'Rate of rise window in seconds', rorSmooth:'Rate of rise smoothing', predMode:'Dry end and first crack prediction',
    syncUrl:'Cloud sync Worker URL', syncCode:'Private cloud sync code',
    phDE:'Dry end temperature in Celsius', phFC:'First crack temperature in Celsius'
  };
  Object.entries(names).forEach(([id, name]) => byId(id)?.setAttribute('aria-label', name));

  // Native anchor navigation keeps every chart mounted and preserves active roast state.
  const links = [...document.querySelectorAll('.workspace-nav a')];
  function updateNavigation() {
    const hash = location.hash || '#workspace';
    links.forEach(link => {
      if (link.getAttribute('href') === hash) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  }
  window.addEventListener('hashchange', updateNavigation);
  updateNavigation();
})();
