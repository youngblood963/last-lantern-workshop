/* DEVTEST Relay Road patch, staged for current playthrough. */
(()=>{'use strict';if(!location.pathname.includes('/route127/devtest/'))return;
const relayRoadParts={yard:{edge:'house--solace-upper-junction',name:'ANTENNA SERVO'},branch:{edge:'motel-interior-junction--solace',name:'SHIELDED FEED COUPLER'},east:{edge:'works-junction--factory',name:'SIGNAL-CONDITIONING MODULE'}};
globalThis.DevtestRelayRoadParts=relayRoadParts;
})();
