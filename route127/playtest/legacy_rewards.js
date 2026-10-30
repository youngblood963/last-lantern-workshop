// WO10: route only approved legacy reward paths through the existing WO7 units.
// No price, XP threshold, combat stat, material, geography or lifecycle changes.
const LegacyEncounterRewards={
 rules:{
 "early:4": {
  "combat": {
   "xp": 1,
   "bolts": 1
  },
  "actions": {
   "CLIMB AROUND": {
    "xp": {
     "5": 0.3
    }
   },
   "TAKE THE DITCH": {
    "xp": {
     "5": 0.3
    }
   },
   "CIRCLE THE HILL": {
    "xp": {
     "5": 0.3
    }
   },
   "INTIMIDATE": {
    "xp": {
     "8": 0.5
    }
   }
  },
  "combatNames": [
   "ROADBLOCK ROBBERS"
  ]
 },
 "early:6": {
  "combat": {
   "xp": 0.8,
   "bolts": 1
  },
  "actions": {
   "WARN HIM OFF": {
    "xp": {
     "8": 0.4
    }
   },
   "SPARE HIM": {
    "xp": {
     "8": 0.4
    }
   }
  },
  "combatNames": [
   "THE STRAY"
  ]
 },
 "early:7": {
  "combat": {
   "xp": 0.8
  },
  "actions": {
   "THREATEN HIM": {
    "xp": {
     "4": 0.3
    }
   }
  },
  "combatNames": [
   "FRIGHTENED CELLAR RESIDENT"
  ]
 },
 "early:13": {
  "combat": {
   "xp": 1,
   "bolts": 1
  },
  "actions": {
   "FIGHT": {
    "xp": {
     "24": 1
    },
    "bolts": {
     "9": 2
    }
   }
  },
  "combatNames": [
   "HIGHWAY ROBBERS"
  ]
 },
 "early:18": {
  "combat": {
   "xp": 0.9,
   "bolts": 1
  },
  "combatNames": [
   "LONE SCAVENGER"
  ]
 },
 "early:19": {
  "combat": {
   "xp": 1.1,
   "bolts": 1,
   "reinforcementXp": 1.4
  },
  "actions": {
   "RUSH HIM": {
    "xp": {
     "23": 1.1
    },
    "bolts": {
     "5": 1
    }
   },
   "INTIMIDATE": {
    "xp": {
     "16": 0.6
    }
   }
  },
  "combatNames": [
   "GANG LOOKOUT"
  ]
 },
 "early:20": {
  "combat": {
   "xp": 1,
   "bolts": 1
  },
  "combatNames": [
   "TERRITORIAL SURVIVOR"
  ]
 },
 "early:21": {
  "combat": {
   "xp": 1.1
  },
  "actions": {
   "INSPECT BOOTH": {
    "xp": {
     "5": 0.3
    }
   }
  },
  "combatNames": [
   "SECURITY DRONE"
  ]
 },
 "early:22": {
  "combat": {
   "xp": 1.2,
   "bolts": 1
  },
  "combatNames": [
   "THE WRECKERS"
  ]
 },
 "early:48": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "SCRAP CLAIMANT"
  ]
 },
 "early:51": {
  "combat": {
   "xp": 0.8
  },
  "actions": {
   "WAIT FOR BATTERY": {
    "xp": {
     "4": 0.4
    }
   }
  },
  "combatNames": [
   "MALFUNCTIONING CLEANER"
  ]
 },
 "early:44": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "THE HIGHWAY HUNTERS"
  ]
 },
 "early:45": {
  "combat": {
   "bolts": 2
  },
  "combatNames": [
   "ARMORED MERCENARY",
   "CONTRACT ENFORCER",
   "ROAD ENFORCER"
  ]
 },
 "east:33": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "ROAD REAPER LEADER",
   "THE ROAD REAPERS"
  ]
 },
 "east:12": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "THE CHAIN GANG"
  ]
 },
 "east:6": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "IRON CHOIR RAIDERS"
  ]
 },
 "east:10": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "THE BONE HUNTERS"
  ]
 },
 "east:34": {
  "combat": {
   "bolts": 3
  },
  "combatNames": [
   "WARDEN 1"
  ]
 },
 "east:22": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "THE SALTMASTER AND OVERSEER"
  ]
 },
 "east:30": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "WALL GUARDS"
  ]
 },
 "east:26": {
  "combat": {
   "bolts": 2
  },
  "combatNames": [
   "THE BONE COLLECTOR"
  ]
 },
 "east:38": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "THE POWDER MONKEY"
  ]
 },
 "east:57": {
  "callback": {
   "xp": 1.2
  },
  "combatNames": [
   "MALFUNCTIONING FORKLIFT"
  ]
 },
 "east:58": {
  "callback": {
   "xp": 1.4,
   "bolts": 2
  },
  "combatNames": [
   "THE LAST PATROL"
  ]
 },
 "east:60": {
  "callback": {
   "xp": 1.2
  },
  "combatNames": [
   "RAMP SECURITY DRONE"
  ]
 },
 "east:61": {
  "callback": {
   "xp": 1.1
  },
  "combatNames": [
   "CULVERT CRAWLER"
  ]
 },
 "east:62": {
  "callback": {
   "xp": 1.2
  },
  "combatNames": [
   "CRAB SWARM"
  ]
 },
 "east:63": {
  "callback": {
   "xp": 1.4,
   "bolts": 2
  },
  "combatNames": [
   "SEAWALL RIFLE SCAVENGER"
  ]
 },
 "east:64": {
  "callback": {
   "xp": 1.3
  },
  "combatNames": [
   "NEST GUARDIAN"
  ]
 },
 "early:2": {
  "actions": {
   "SEARCH DRAWER": {
    "xp": {
     "7": 0.4
    }
   },
   "SMASH VENDING MACHINE": {
    "xp": {
     "8": 0.6
    }
   },
   "PRY VENDING MACHINE": {
    "xp": {
     "6": 0.4
    }
   },
   "CHECK SERVICE BAY": {
    "xp": {
     "8": 0.4
    }
   }
  }
 },
 "early:3": {
  "actions": {
   "SEARCH CABIN": {
    "xp": {
     "8": 0.6
    }
   },
   "FORCE TRUNK": {
    "xp": {
     "10": 0.8
    }
   },
   "CHECK UNDER CAR": {
    "xp": {
     "8": 0.5
    }
   }
  }
 },
 "early:12": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "JANITOR HARLAN"
  ]
 },
 "early:32": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "FREEZER AMBUSH",
   "FRIGHTENED PRISONER"
  ]
 },
 "east:43": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "ORCHARD SCAVENGERS"
  ]
 },
 "east:17": {
  "combat": {
   "bolts": 2
  },
  "combatNames": [
   "THE CURATOR"
  ]
 },
 "east:39": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "SILAS CROWE"
  ]
 },
 "east:35": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "OIL SABOTEUR DEKE"
  ]
 },
 "east:11": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "HUBCAP CHAMPION"
  ]
 },
 "east:65": {
  "callback": {
   "xp": 1.2
  },
  "combatNames": [
   "CANNIBAL BUTCHER"
  ]
 },
 "east:66": {
  "actions": {
   "PRY OPEN THE PANTRY": {
    "xp": {
     "40": 0.8
    }
   }
  }
 },
 "early:1": {
  "actions": {
   "OPEN TOOLBOX": {
    "xp": {
     "7": 0.5
    }
   },
   "STRIP CABLE": {
    "xp": {
     "7": 0.5
    }
   },
   "STEAL GENERATOR PART": {
    "xp": {
     "5": 0.4
    }
   }
  }
 },
 "early:60": {
  "actions": {
   "SALVAGE THE CIRCUIT": {
    "xp": {
     "10": 0.6
    }
   },
   "REMOVE THE CASING": {
    "xp": {
     "6": 0.4
    }
   }
  }
 },
 "early:28": {
  "actions": {
   "INSPECT BEEKEEPER GEAR": {
    "xp": {
     "4": 0.3
    }
   }
  }
 },
 "east:20": {
  "combat": {
   "bolts": 1
  },
  "combatNames": [
   "RIVET AND CREW"
  ]
 },
 "east:69": {
  "actions": {
   "LIFT THE CACHE LID": {
    "xp": {
     "35": 0.8
    }
   },
   "CHECK THE DRAINAGE SLOT": {
    "xp": {
     "35": 0.6
    }
   }
  }
 },
 "east:70": {
  "actions": {
   "STRIP THE BATTERY LEADS": {
    "xp": {
     "30": 1
    }
   },
   "SEARCH THE TOOL TRAY": {
    "xp": {
     "30": 1
    }
   },
   "RECOVER CORVETTE BATTERY": {
    "xp": {
     "30": 1
    }
   }
  }
 },
 "east:71": {
  "actions": {
   "DISARM THE MECHANISM": {
    "xp": {
     "40": 0.9
    }
   }
  }
 },
 "early:8": {
  "actions": {
   "STUDY FRONT": {
    "xp": {
     "3": 0.2
    }
   },
   "STUDY BACK": {
    "xp": {
     "12": 0.8
    }
   }
  }
 },
 "early:9": {
  "actions": {
   "USE BANDAGE": {
    "xp": {
     "22": 1.2
    }
   }
  }
 },
 "early:55": {
  "actions": {
   "READ THE CARVED NAMES": {
    "xp": {
     "5": 0.3
    }
   }
  }
 },
 "early:24": {
  "actions": {
   "READ THE NOTES": {
    "xp": {
     "5": 0.3
    }
   },
   "INSPECT THE BOOTS": {
    "xp": {
     "5": 0.3
    }
   },
   "SEARCH THE ROADSIDE": {
    "xp": {
     "4": 0.3
    }
   }
  }
 },
 "early:31": {
  "actions": {
   "INSPECT MUSIC BOX": {
    "xp": {
     "5": 0.3
    }
   }
  }
 },
 "early:33": {
  "actions": {
   "TELL A ROAD JOKE": {
    "xp": {
     "5": 0.3
    }
   },
   "TELL A FOOD JOKE": {
    "xp": {
     "5": 0.3
    }
   },
   "ASK ABOUT BRIDGE": {
    "xp": {
     "5": 0.3
    }
   }
  }
 },
 "east:73": {
  "actions": {
   "REACH FOR THE SERVICE POUCH": {
    "xp": {
     "40": 0.9
    }
   },
   "CIRCLE UPWIND": {
    "xp": {
     "40": 0.6
    }
   }
  }
 },
 "east:74": {
  "actions": {
   "CLIMB THE PLATFORM": {
    "xp": {
     "35": 0.9
    }
   },
   "PULL DOWN THE LOOSE CLOTH": {
    "xp": {
     "35": 0.5
    }
   }
  }
 },
 "early:39": {
  "combat": {
   "xp": 1.1,
   "bolts": 1
  },
  "combatNames": [
   "ARROW AMBUSH"
  ]
 }
},
 active:null,
 xpAt(level,mult){return WO7.xp.call({level:()=>level},mult);},
 boltsAt(level,mult){return WO7.bolts.call({level:()=>level},mult);},
 entry(encounter){if(!encounter)return null;return RoadScenarioRegistry.regionalByTitle?.get(r10CanonicalTitle(encounter.title))||null;},
 action(entry,encounter,command){const rule=this.rules[entry?.id];if(!rule)return null;const key=choiceKey(String(command).trim().toLowerCase(),encounter)||String(command).trim().toUpperCase();return {id:entry.id,rule,action:rule.actions?.[key],level:WO7.level(),mode:'action'};},
 within(context,fn){const prior=this.active;this.active=context;try{return fn();}finally{this.active=prior;}},
 belongs(c,entry){const rule=this.rules[entry?.id];return !!rule&&!c.wo7Id&&!Object.prototype.hasOwnProperty.call(c,'regionalCombatLoot')&&(rule.combatNames?.includes(c.name)||(entry.id==='east:34'&&/^WARDEN \d+$/.test(c.name)));},
 prepare(c,entry){
  if(!c||c.source!=='encounter'||c.wo10Rewards)return;
  const rule=this.rules[entry?.id];if(!rule?.combat&&!rule?.callback)return;
  const level=WO7.level(),reward={id:entry.id,level};
  if(rule.combat?.xp!==undefined&&c.xp>0)c.xp=this.xpAt(level,rule.combat.xp);
  if(rule.callback?.xp!==undefined)reward.callbackXp=this.xpAt(level,rule.callback.xp);
  if(rule.callback?.bolts!==undefined)reward.callbackBolts=this.boltsAt(level,rule.callback.bolts);
  c.wo10Rewards=reward;this.enemyPurses(c);if(typeof Economy!=='undefined')Economy.prepare(c);
 },
 enemyPurses(c){
  const reward=c?.wo10Rewards,rule=this.rules[reward?.id]?.combat;if(!reward||!rule)return;
  if(rule.bolts!==undefined&&!c.wo12Economy){
   const purse=this.boltsAt(reward.level,rule.bolts);
   if(c.enemies?.length){for(const enemy of c.enemies)if(!enemy.wo10Purse){if(enemy.bolts>0)enemy.bolts=purse;enemy.wo10Purse=true;}c.bolts=c.enemies.reduce((sum,e)=>sum+(Number(e.bolts)||0),0);}
   else if(!reward.purseApplied&&c.bolts>0)c.bolts=purse;
   reward.purseApplied=true;
  }
  // The existing lookout replaces its own enemy array when help arrives.
  if(c.reinforcementsArrived&&!reward.reinforced&&rule.reinforcementXp!==undefined){c.xp=this.xpAt(reward.level,rule.reinforcementXp);reward.reinforced=true;}
 },
 install(){
  if(this.installed||!RoadScenarioRegistry.ready||!RoadScenarioRegistry.regionalByTitle)return;this.installed=true;const rewards=this;
  const xp=gainXp;gainXp=function(n){const q=rewards.active;if(n>0&&q){if(q.mode==='action'&&q.action?.xp&&Object.prototype.hasOwnProperty.call(q.action.xp,n))n=rewards.xpAt(q.level,q.action.xp[n]);else if(q.mode==='combat'&&q.callback&&q.combat.wo10Rewards.callbackXp!==undefined)n=q.combat.wo10Rewards.callbackXp;}return xp(n);};
  const bolts=gainBolts;gainBolts=function(n){const q=rewards.active;if(n>0&&q){if(q.mode==='action'&&q.action?.bolts&&Object.prototype.hasOwnProperty.call(q.action.bolts,n))n=typeof Economy!=='undefined'&&q.rule.combat?Economy.legacyActionPurse(q,n):rewards.boltsAt(q.level,q.action.bolts[n]);else if(q.mode==='combat'&&q.callback&&q.combat.wo10Rewards.callbackBolts!==undefined)n=q.combat.wo10Rewards.callbackBolts;}return bolts(n);};
  // Cover saved legacy variants and direct resolver calls without changing slots.
  for(const encounter of new Set([...encounters,...eastEncounters])){const entry=this.entry(encounter);if(!this.rules[entry?.id])continue;const resolve=encounter.resolve;encounter.resolve=function(command,...args){return rewards.within(rewards.action(entry,this,command),()=>resolve.call(this,command,...args));};}
  const resolve=resolveEncounter;resolveEncounter=function(command,...args){const encounter=currentEncounter(),entry=rewards.entry(encounter);return rewards.within(rewards.action(entry,encounter,command),()=>resolve(command,...args));};
  const start=startCombat;startCombat=function(spec,source,...args){const context=rewards.active;const result=start(spec,source,...args);if(source==='encounter'&&combatState&&context?.mode==='action')rewards.prepare(combatState,RoadScenarioRegistry.regionalById.get(context.id));return result;};
  const combat=handleCombat;handleCombat=function(command,...args){const c=combatState;if(!c||c.source!=='encounter')return combat(command,...args);
   // An in-progress pre-WO10 save gains the same rate once, without restarting it.
   if(!c.wo10Rewards){const entry=rewards.entry(currentEncounter());if(rewards.belongs(c,entry))rewards.prepare(c,entry);}
   rewards.enemyPurses(c);const stored=c.wo10Rewards,rule=rewards.rules[stored?.id];
   const context=stored?{id:stored.id,level:stored.level,mode:'combat',combat:c,callback:!!(c.wo2Reward||c.wo3Reward||c.wo4Reward)&&!!rule?.callback}:null;
   const result=rewards.within(context,()=>combat(command,...args));if(combatState===c)rewards.enemyPurses(c);return result;
  };
 }
};
LegacyEncounterRewards.install();
