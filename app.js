const host=document.getElementById('screenHost');
const title=document.getElementById('screenTitle');

const names={
  main:'Grundbild 010',plant:'Anlagenübersicht 011',planttype:'ARG_Typ-Strg_004-AnlageTyp',
  preselection:'Vorwahlen 013',operating:'Betriebsarten 012',statistics:'Statistik 020',cycletime:'Taktzeiten_022',
  diagnostics:'SPS + PN 030',profinet:'System Diagnosepuffer',sysdiag:'Systemdiagnose',topology:'Topology Editor',snmp:'Detail Diagnose SNMP',
  sequencers:'AS 031',applications:'Applikationen',administration:'Administration',robot:'Roboter 014',process:'Rob-Prozessgeräte 015',
  global:'GlobaleStati_017',alarms:'ProDiag_Meldeanzeigen',station:'Station & Fixtures',fixture:'Stations & Fixtures',viewer:'Viewer',
  interface:'ARG2_Detail_GW_1',correction:'Dialog_Roboter_Korrektur',maintenance:'Werkerruf_018'
};

const stations=['115000 UQ1','115020 V01','115040 UQ1','115050 UQ1','115070 V01','115085 SF1','125090 UQ1','135095 SF1','135100 V01'];
const robots={
  '115010R01':{station:'115000 UQ1',pf0:false,masi:false,drives:false,fk:false,auto:false,fault:true,maintenance:false,running:false},
  '115020R01':{station:'115020 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '115050R02':{station:'115050 UQ1',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '115060R01':{station:'115050 UQ1',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '115070R01':{station:'115070 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '115070R02':{station:'115070 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '115080R01':{station:'115085 SF1',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135100R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135110R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135120R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135120R02':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135120R03':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135130R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false},
  '135130R02':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false}
};

const state={
  currentScreen:'main',history:[],selectedStation:'115000 UQ1',selectedRobot:'115010R01',robotOverview:1,processOverview:1,snmpPage:0,selectedSnmp:null,
  alarmView:'current',robotFaultAcknowledged:false,controlVoltage:true,plantIllumination:'off',workIllumination:'on',energyMode:'with',
  preselect:{11:{'Stop at end of cycle':'preset','line stop':'preset','Line Empty':'active','Production w/o part':'off','Creep speed':'off'},12:{'Stop at end of cycle':'preset','line stop':'preset','Line Empty':'active','Production w/o part':'off','Creep speed':'off'},13:{'Stop at end of cycle':'preset','line stop':'preset','Line Empty':'active','Production w/o part':'off','Creep speed':'off'}},
  stationMode:{'115020 V01':'automatic'},stationRunning:{},fixture:{MM11a:true,MM12b:false,BGT11a:true,BGT12b:false,MM14a:true},seqStep:1,sequences:{},processModes:{},interfacePage:0,
  trainingCell:{station:'115020 V01',robot:'115010R01',safetyDoorClosed:true,safetyAcknowledged:true,partPresent:true,clampCommand:false,robotRelease:false,interfaceRelease:true,failClampFeedback:false,cycleActive:false,sequenceStep:1,stepChangedAt:0,cycleStartedAt:0,lastCycleTime:0,cycleCount:0,faultCode:null,faultText:'',challenge:null,incorrectActions:0,eventLog:[]},
  correction:[{sequence:125,point:18,robot:'115010R01'},null,null,null,null,null,null,null],
  maintenance:{'115000':false,'115050':false,'135100':false},media:{air11:true,cool11:true,air13:true},
  alarms:[
    {id:'R115010',key:'ROBOT_115010',severity:'fault',ack:false,active:true,time:Date.now(),text:'TRAINING: 115010R01 robot fault — drives not enabled.'},
    {id:'LUBE',key:'LUBE',severity:'warning',ack:false,active:true,time:Date.now(),text:'TRAINING: Lubrication level low.'}
  ]
 };

const STORAGE_KEY='hmi-training-v08-state';
function saveSim(){
  try{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({robots,state:{
      selectedStation:state.selectedStation,selectedRobot:state.selectedRobot,robotOverview:state.robotOverview,
      alarmView:state.alarmView,robotFaultAcknowledged:state.robotFaultAcknowledged,controlVoltage:state.controlVoltage,
      plantIllumination:state.plantIllumination,workIllumination:state.workIllumination,energyMode:state.energyMode,
      preselect:state.preselect,stationMode:state.stationMode,stationRunning:state.stationRunning,fixture:state.fixture,
      seqStep:state.seqStep,sequences:state.sequences,processModes:state.processModes,interfacePage:state.interfacePage,trainingCell:state.trainingCell,
      correction:state.correction,maintenance:state.maintenance,media:state.media,alarms:state.alarms
    }}));
  }catch(e){}
}
function loadSim(){
  try{
    const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(!saved)return;
    if(saved.robots)Object.keys(saved.robots).forEach(id=>{if(robots[id])Object.assign(robots[id],saved.robots[id]);});
    if(saved.state){
      const savedCell=saved.state.trainingCell;
      Object.assign(state,saved.state);
      if(savedCell)Object.assign(state.trainingCell,savedCell);
    }
    state.alarms=(state.alarms||[]).map(a=>({active:a.active!==false,ack:!!a.ack,time:a.time||Date.now(),...a}));
  }catch(e){}
}
function resetSimulation(){
  try{localStorage.removeItem(STORAGE_KEY);}catch(e){}
  location.reload();
}
function robotReadyForAuto(r){return !!r&&!r.fault&&r.masi&&r.drives&&r.pf0&&!r.maintenance;}
function robotFault(id,text){
  const r=robots[id]; if(!r)return;
  r.fault=true;r.running=false;r.fk=false;r.auto=false;
  addAlarm(`TRAINING: ${id} ${text}`,'fault',`ROBOT_${id}`);
  if(state.trainingCell.challenge&&!state.trainingCell.challenge.solved)state.trainingCell.incorrectActions++;
  saveSim(); updatePersistentUI();
}
function robotStatusCommand(id,kind){
  const r=robots[id]; if(!r)return;
  state.selectedRobot=id;
  if(id!==state.trainingCell.robot)state.selectedStation=r.station;
  if(kind==='masi'){
    if(r.maintenance){addAlarm(`TRAINING: ${id} MaSi rejected — maintenance active.`,'fault',`ROBOT_${id}`);toast('MaSi inhibited');return;}
    if(id===state.trainingCell.robot&&(!state.trainingCell.safetyDoorClosed||!state.trainingCell.safetyAcknowledged)){robotFault(id,'MaSi rejected — safety door / acknowledgement not OK.');toast('Safety not ready');return;}
    if(!state.robotFaultAcknowledged&&r.fault){addAlarm(`TRAINING: ${id} safety reset rejected — acknowledge fault first.`,'fault',`ROBOT_${id}`);toast('Acknowledge fault first');return;}
    r.masi=true; toast(`${id}: MaSi / safety release OK`);
  }
  if(kind==='drives'){
    if(!r.masi){robotFault(id,'Drives ON rejected — MaSi / safety release missing.');toast('Drives inhibited');return;}
    if(r.fault&&!state.robotFaultAcknowledged){toast('Acknowledge fault first');return;}
    r.drives=true;r.fault=false;clearAlarm(`ROBOT_${id}`);toast(`${id}: Drives enabled`);
  }
  if(kind==='pf0'){
    if(r.fault||!r.masi||!r.drives){robotFault(id,'PF0/Home rejected — robot not ready.');toast('Home inhibited');return;}
    r.pf0=true;toast(`${id}: PF0 / Home reached`);
  }
  saveSim(); renderRobotRows(); updatePersistentUI();
}

function render(name,opts={}){
  const tpl=document.getElementById(`screen-${name}`); if(!tpl)return;
  if(!opts.noHistory && state.currentScreen!==name) state.history.push(state.currentScreen);
  state.currentScreen=name; host.innerHTML=''; host.appendChild(tpl.content.cloneNode(true)); title.textContent=names[name]||name; initScreen(name); updatePersistentUI();
}
function goBack(){const prev=state.history.pop()||'main'; render(prev,{noHistory:true});}
function toast(message){const el=document.getElementById('hmiToast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1600);}
function robotColor(r){if(r.fault)return'red';if(r.maintenance)return'lightblue';if(r.pf0)return'green';return'gray';}
function activeAlarm(){return state.alarms.find(a=>a.active&&!a.ack)||state.alarms.find(a=>a.active)||null;}
function updatePersistentUI(){
  document.querySelectorAll('.footer-nav [data-action="station"]').forEach(b=>b.classList.toggle('active-yellow',b.dataset.station===state.selectedStation));
  const robotFaultActive=Object.values(robots).some(r=>r.fault);
  document.querySelectorAll('[data-nav="robot"]').forEach(b=>b.classList.toggle('red',robotFaultActive));
  document.querySelectorAll('[data-nav="plant"]').forEach(b=>b.classList.toggle('red',!!state.trainingCell.faultCode));
  const a=activeAlarm(), active=state.alarms.filter(x=>x.active);
  const t1=document.getElementById('alarmText1');if(t1)t1.textContent=a?a.text:'TRAINING: No active alarms.';
  const t2=document.getElementById('alarmText2');if(t2)t2.textContent=active[1]?active[1].text:'TRAINING: System ready.';
}
function addAlarm(text,severity='warning',key=text){
  let a=state.alarms.find(x=>x.key===key&&x.active);
  if(a){a.text=text;a.severity=severity;a.ack=false;a.time=Date.now();}
  else state.alarms.unshift({id:`A${Date.now()}${Math.random().toString(16).slice(2,5)}`,key,severity,ack:false,active:true,time:Date.now(),text});
  recordEvent(text.replace(/^TRAINING:\s*/,''));
  saveSim();updatePersistentUI();
}
function clearAlarm(key){const a=state.alarms.find(x=>x.key===key&&x.active);if(a){a.active=false;a.cleared=Date.now();saveSim();updatePersistentUI();}}
function acknowledge(){
  const a=state.alarms.find(x=>x.active&&!x.ack);
  if(a)a.ack=true;
  state.robotFaultAcknowledged=true;
  saveSim();updatePersistentUI();if(state.currentScreen==='alarms')renderAlarms();
  toast(a?'Alarm acknowledged':'No unacknowledged alarms');
}
function cellState(){return state.trainingCell;}
function isTrainingStation(id){return id===state.trainingCell.station;}
function trainingRobot(){return robots[state.trainingCell.robot];}
function recordEvent(text){
  const c=state.trainingCell;if(!c||!Array.isArray(c.eventLog))return;
  c.eventLog.unshift({time:Date.now(),text});if(c.eventLog.length>40)c.eventLog.length=40;
}
function setCellStep(step){const c=cellState();if(c.sequenceStep===step)return;c.sequenceStep=step;state.seqStep=step;c.stepChangedAt=Date.now();recordEvent(`${c.station.replace(' ','')} sequence -> S${String(step).padStart(3,'0')}`);saveSim();refreshCurrentScreen();}
function setCellFault(code,text,severity='fault'){
  const c=cellState();if(c.faultCode===code&&c.faultText===text)return;c.faultCode=code;c.faultText=text;addAlarm(`TRAINING: ${c.station} ${text}`,severity,`CELL_${code}`);refreshCurrentScreen();
}
function clearCellFault(code){const c=cellState();if(!code||c.faultCode===code){c.faultCode=null;c.faultText='';}if(code)clearAlarm(`CELL_${code}`);saveSim();}
function refreshCurrentScreen(){
  if(state.currentScreen==='station'){renderStationSequence();renderFixtureRows();renderStationStatus();updateStationToolbar();}
  if(state.currentScreen==='fixture')renderFixtureStatus();
  if(state.currentScreen==='viewer')renderViewer();
  if(state.currentScreen==='interface')renderInterface();
  if(state.currentScreen==='global')renderGlobal();
  if(state.currentScreen==='cycletime')renderCycle();
  if(state.currentScreen==='administration')renderAdminCellPanel();
  updatePersistentUI();
}
const CELL_STEPS={
  1:['S_Init: Grundstellung','Ready for cycle start'],2:['S_Part: Part check','Waiting for part present'],3:['S_MM12V: Clamp close','Waiting for MM12b clamp feedback'],4:['S_FRG1: Robot release','Waiting for ARG2 / robot release'],5:['S_ROB: Robot working','Robot executing simulated process'],6:['S_FK: Robot complete','Waiting for total completion FK'],7:['S_MM12R: Unclamp','Returning fixture to initial position'],8:['S_End: Cycle complete','Cycle finished']
};
function trainingPrerequisiteFailure(){
  const c=cellState(),r=trainingRobot(),mode=state.stationMode[c.station]||'automatic';
  if(!state.controlVoltage)return 'K100 control voltage OFF';
  if(mode!=='automatic')return 'station not in Automatic';
  if(!c.safetyDoorClosed)return 'safety door open';
  if(!c.safetyAcknowledged)return 'safety acknowledgement missing';
  if(!robotReadyForAuto(r)||!r.auto)return `${c.robot} not ready in Auto`;
  return null;
}
function startTrainingCycle(){
  const c=cellState(),fail=trainingPrerequisiteFailure();
  if(fail){c.incorrectActions++;setCellFault('START_INHIBIT',`Start rejected — ${fail}.`);toast('Start inhibited');return false;}
  clearAlarm('CELL_START_INHIBIT');clearAlarm('CELL_PART');clearAlarm('CELL_CLAMP');clearAlarm('CELL_INTERFACE');clearAlarm('CELL_AIR');
  c.faultCode=null;c.faultText='';c.cycleActive=true;c.sequenceStep=2;state.seqStep=2;c.stepChangedAt=Date.now();c.cycleStartedAt=Date.now();c.clampCommand=false;c.robotRelease=false;
  state.stationRunning[c.station]=true;recordEvent('Cycle start accepted');saveSim();refreshCurrentScreen();toast(`${c.station}: Cycle start accepted`);return true;
}
function stopTrainingCycle(reason='operator stop'){
  const c=cellState(),r=trainingRobot();c.cycleActive=false;c.robotRelease=false;c.clampCommand=false;state.stationRunning[c.station]=false;r.running=false;
  addAlarm(`TRAINING: ${c.station} stopped — ${reason}.`,'warning','CELL_STOP');recordEvent(`Cycle stopped: ${reason}`);saveSim();refreshCurrentScreen();
}
function openSafetyDoor(){
  const c=cellState(),r=trainingRobot();c.safetyDoorClosed=false;c.safetyAcknowledged=false;c.cycleActive=false;c.robotRelease=false;state.stationRunning[c.station]=false;
  r.masi=false;r.drives=false;r.auto=false;r.running=false;r.fk=false;r.fault=true;state.robotFaultAcknowledged=false;
  setCellFault('SAFETY','Safety door open — machine safety release removed.');addAlarm(`TRAINING: ${c.robot} safety circuit interrupted.`,'fault',`ROBOT_${c.robot}`);saveSim();refreshCurrentScreen();
}
function closeSafetyDoor(){const c=cellState();c.safetyDoorClosed=true;clearAlarm('CELL_SAFETY');c.faultCode='SAFETY_ACK';c.faultText='Safety door closed — acknowledgement required';addAlarm(`TRAINING: ${c.station} safety acknowledgement required.`,'warning','CELL_SAFETY_ACK');saveSim();refreshCurrentScreen();}
function acknowledgeCellSafety(){const c=cellState();if(!c.safetyDoorClosed){toast('Close safety door first');return;}if(!state.robotFaultAcknowledged){toast('Acknowledge alarm first');return;}c.safetyAcknowledged=true;if(c.faultCode==='SAFETY_ACK'){c.faultCode=null;c.faultText='';}clearAlarm('CELL_SAFETY_ACK');recordEvent('Safety acknowledged');saveSim();refreshCurrentScreen();toast('Cell safety acknowledged');}
function completeChallenge(){const c=cellState();if(!c.challenge||c.challenge.solved)return;c.challenge.solved=true;c.challenge.elapsed=Math.round((Date.now()-c.challenge.startedAt)/1000);addAlarm(`TRAINING: Challenge complete — ${c.challenge.elapsed}s, ${c.incorrectActions} rejected action(s).`,'warning','CHALLENGE_DONE');saveSim();}
function simulationTick(){
  const c=cellState();if(!c.cycleActive)return;const r=trainingRobot(),elapsed=Date.now()-c.stepChangedAt;
  if(!c.safetyDoorClosed){openSafetyDoor();return;}
  if(!state.controlVoltage){c.cycleActive=false;setCellFault('K100','Sequence stopped — K100 control voltage lost.');return;}
  if(!state.media.air11){setCellFault('AIR','Sequence waiting — air pressure not ready.');return;}else if(c.faultCode==='AIR'){clearCellFault('AIR');}
  switch(c.sequenceStep){
    case 2:
      if(c.partPresent){if(c.faultCode==='PART')clearCellFault('PART');else clearAlarm('CELL_PART');if(elapsed>550)setCellStep(3);}else setCellFault('PART','Sequence waiting — part-present signal missing.');break;
    case 3:
      c.clampCommand=true;
      if(!c.failClampFeedback&&elapsed>500)state.fixture.MM12b=true;
      if(state.fixture.MM12b){if(c.faultCode==='CLAMP')clearCellFault('CLAMP');else clearAlarm('CELL_CLAMP');if(elapsed>750)setCellStep(4);}else if(elapsed>850)setCellFault('CLAMP','Sequence waiting — MM12b clamp closed feedback missing.');break;
    case 4:
      c.robotRelease=!!c.interfaceRelease;
      if(!c.interfaceRelease)setCellFault('INTERFACE','Sequence waiting — ARG2 robot release missing.');
      else if(!robotReadyForAuto(r)||!r.auto)setCellFault('ROBOT_READY',`Sequence waiting — ${c.robot} not ready.`);
      else {if(c.faultCode==='INTERFACE')clearCellFault('INTERFACE');if(c.faultCode==='ROBOT_READY')clearCellFault('ROBOT_READY');clearAlarm('CELL_INTERFACE');clearAlarm('CELL_ROBOT_READY');if(elapsed>600)setCellStep(5);}break;
    case 5:
      c.robotRelease=true;r.running=true;r.fk=false;
      if(elapsed>1250){r.running=false;r.fk=true;setCellStep(6);}break;
    case 6: if(r.fk&&elapsed>500)setCellStep(7);break;
    case 7:
      c.clampCommand=false;if(elapsed>450)state.fixture.MM12b=false;if(elapsed>700)setCellStep(8);break;
    case 8:
      if(elapsed>500){c.cycleActive=false;c.robotRelease=false;state.stationRunning[c.station]=false;c.cycleCount++;c.lastCycleTime=(Date.now()-c.cycleStartedAt)/1000;recordEvent(`Cycle complete ${c.lastCycleTime.toFixed(1)} s`);completeChallenge();saveSim();refreshCurrentScreen();}
      break;
  }
}
function loadRandomChallenge(){
  const c=cellState();restoreTrainingCell(false);const choices=['part','clamp','air'];const cause=choices[Math.floor(Math.random()*choices.length)];
  if(cause==='part'){c.partPresent=false;state.fixture.BGT11a=false;}
  if(cause==='clamp'){c.failClampFeedback=true;state.fixture.MM12b=false;}
  if(cause==='interface')c.interfaceRelease=false;
  if(cause==='air')state.media.air11=false;
  c.challenge={cause,startedAt:Date.now(),solved:false,elapsed:null};c.incorrectActions=0;recordEvent('Hidden troubleshooting challenge loaded');saveSim();refreshCurrentScreen();toast('Hidden fault loaded — diagnose 115020 V01');
}
function restoreTrainingCell(showToast=true){
  const c=cellState(),r=trainingRobot();Object.assign(c,{safetyDoorClosed:true,safetyAcknowledged:true,partPresent:true,clampCommand:false,robotRelease:false,interfaceRelease:true,failClampFeedback:false,cycleActive:false,sequenceStep:1,stepChangedAt:Date.now(),cycleStartedAt:0,faultCode:null,faultText:'',challenge:null,incorrectActions:0});
  state.fixture.BGT11a=true;state.fixture.MM12b=false;state.media.air11=true;state.stationMode[c.station]='automatic';state.stationRunning[c.station]=false;
  Object.assign(r,{pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false,running:false});state.robotFaultAcknowledged=true;
  state.alarms.forEach(a=>{if(a.key&&(/^(CELL_|ROBOT_)/.test(a.key)))a.active=false;});recordEvent('Training cell restored healthy');saveSim();refreshCurrentScreen();if(showToast)toast('115020 V01 restored healthy');
}
function renderAdminCellPanel(){
  const el=document.getElementById('cellTrainingPanel');if(!el)return;const c=cellState(),r=trainingRobot();
  el.innerHTML=`<div class="section-title">115020 V01 · interactive training cell</div><div class="trainer-grid"><button class="hmi-btn ${c.safetyDoorClosed?'active-green':'red'}" data-action="trainer-safety">Safety door<br>${c.safetyDoorClosed?'CLOSED':'OPEN'}</button><button class="hmi-btn ${c.partPresent?'active-green':'red'}" data-action="trainer-part">Part sensor<br>${c.partPresent?'PRESENT':'MISSING'}</button><button class="hmi-btn ${!c.failClampFeedback?'active-green':'red'}" data-action="trainer-clampfault">MM12 feedback<br>${c.failClampFeedback?'FAILED':'OK'}</button><button class="hmi-btn ${c.interfaceRelease?'active-green':'red'}" data-action="trainer-interface">ARG2 release<br>${c.interfaceRelease?'OK':'MISSING'}</button><button class="hmi-btn ${state.media.air11?'active-green':'red'}" data-action="trainer-air">Air pressure<br>${state.media.air11?'OK':'LOW'}</button><button class="hmi-btn yellow" data-action="trainer-random">Random challenge</button><button class="hmi-btn" data-action="trainer-restore">Restore cell</button></div><div class="trainer-status">Sequence S${String(c.sequenceStep).padStart(3,'0')} · Cycle ${c.cycleActive?'RUNNING':'STOPPED'} · Robot ${r.fault?'FAULT':r.auto?'AUTO READY':'NOT READY'} · Cycles ${c.cycleCount}${c.challenge?` · Challenge ${c.challenge.solved?'SOLVED':'ACTIVE'}`:''}</div>`;
}

function makeModePanel(cell){
  const labels=['Stop at end of cycle','line stop','Line Empty','Production w/o part','Creep speed'];
  return `<div class="section-title mode-title">Vorwahlen <b>${cell}</b></div>`+labels.map(label=>{const v=state.preselect[cell][label];return `<div class="mode-row"><button class="hmi-btn pre-btn ${v==='active'?'blue':v==='preset'?'preflash':''}" data-action="toggle-preselection" data-cell="${cell}" data-label="${label}"><span class="release-dot ${v==='off'?'gray':'yellow-dot'}"></span>Pre-set</button><div class="label">${label}</div></div>`}).join('');
}
function opRow(id){const mode=state.stationMode[id]||'automatic',run=state.stationRunning[id]??true;return `<div class="op-row" data-station="${id}"><button class="hmi-btn yellow" data-action="station-open" data-station="${id}">${id}</button><button class="hmi-btn">E2</button><button class="hmi-btn red">E Stop</button><button class="hmi-btn active-green">operator safety</button><button class="hmi-btn ${run?'active-green':'red'}">Controls</button><button class="hmi-btn ${run?'active-green':'red'}">Start cond.</button><button class="hmi-btn ${mode==='manual'?'active-green':''}" data-action="station-mode" data-mode="manual">Manual</button><button class="hmi-btn ${mode==='automatic'?'active-green':''}" data-action="station-mode" data-mode="automatic">Automatic</button><button class="hmi-btn ${!run?'red':''}" data-action="station-stop">Stop</button><button class="hmi-btn ${run?'active-green':''}" data-action="station-start">Start</button></div>`;}
function robotRow(id){const r=robots[id],c=robotColor(r);return `<div class="robot-row" data-robot="${id}"><button class="hmi-btn yellow" data-action="robot-detail" data-robot="${id}">${id}</button><button class="hmi-btn" data-action="robot-without">Without Robot</button><button class="hmi-btn">E2</button><button class="hmi-btn ${r.auto?'active-green':''}" data-action="robot-auto">Auto</button><button class="hmi-btn ${r.pf0?'active-green':''}" data-action="robot-status" data-kind="pf0">PF0</button><button class="hmi-btn ${r.masi?'active-green':''}" data-action="robot-status" data-kind="masi">MaSi</button><button class="hmi-btn ${r.drives?'active-green':''}" data-action="robot-status" data-kind="drives">Drives</button><button class="hmi-btn ${r.fk?'active-green':''}" data-action="robot-indicator">FK</button><button class="hmi-btn" data-action="sequence-open">Sequence 125</button><button class="hmi-btn ${r.running?'active-green':''}" data-action="robot-start">Start</button><button class="hmi-btn ${c==='red'?'red':''}" data-action="robot-stop">Stop</button><button class="hmi-btn ${r.maintenance?'light-blue':''}" data-action="robot-maintenance">Maintenance</button></div>`;}
function renderRobotRows(){const groups={1:['115010R01','115020R01','115050R02','115060R01','115070R01','115080R01'],2:['115070R02','135100R01','135110R01','135120R01','135120R02','135120R03'],3:['135130R01','135130R02']};const el=document.getElementById('robotRows');if(el)el.innerHTML=groups[state.robotOverview].map(robotRow).join('');}
function processRow(id){const mode=state.processModes[id]||'';return `<div class="process-row" data-process="${id}"><button class="hmi-btn yellow" data-action="process-detail" data-process="${id}">${id}</button><button class="hmi-btn ${mode==='without'?'active-green':''}" data-action="process-mode" data-mode="without">Without Process</button><button class="hmi-btn" data-action="process-mode" data-mode="vw">VW</button><button class="hmi-btn" data-action="process-mode" data-mode="max">MAX</button><button class="hmi-btn" data-action="process-mode" data-mode="flt">FLT</button><button class="hmi-btn" data-action="process-mode" data-mode="zi">ZI</button><button class="hmi-btn" data-action="process-mode" data-mode="force">Without Force</button><button class="hmi-btn" data-action="process-mode" data-mode="milling">milling</button><button class="hmi-btn" data-action="process-mode" data-mode="maintenance">Maintenance</button></div>`;}
function renderProcessRows(){const groups={1:['115020R01KE1','115020R01KW1','115020R02KE1','115020R02KW1','115070R01KE1','115070R01KW1'],2:['115070R02KE1','115070R02KW1','135100R01KE1','135100R01KW1','135120R01KE1','135120R01KW1'],3:['135120R02KE1','135120R02KW1','135120R03KE1','135120R03KW1'],4:['115010R01G01','115060R01G01','135110R01G01'],5:['115080R01G01','115080R01KE1','135130R01G01','135130R01KE1'],6:['115030R01G01','115030R01KL1']};const el=document.getElementById('processRows');if(el)el.innerHTML=groups[state.processOverview].map(processRow).join('');}

function stationCode(){return state.selectedStation.replace(' ','');}
function renderFixtureRows(){
  const el=document.getElementById('fixtureRows');if(!el)return;const code=stationCode(),isCell=isTrainingStation(state.selectedStation),c=cellState();
  const rows=[['MM11','Clamp with Pin'],['MM12','Clamp'],['MM13','Clamp'],['MM14','Locating Pin']];
  el.innerHTML=rows.map(([id,label])=>{const a=state.fixture[`${id}a`],b=state.fixture[`${id}b`];return `<div class="fixture-row"><button class="io-square ${a?'active-green':''}" data-action="fixture-toggle" data-sensor="${id}a">R</button><div class="fixture-label"><b>${label}</b><span>${code}${id}</span><small>${isCell&&id==='MM12'?`CMD ${c.clampCommand?'CLOSE':'OPEN'} · FB ${state.fixture.MM12b?'CLOSED':'OPEN'}`:'K100   a b c d'}</small></div><button class="io-square ${b?'active-green':''}" data-action="fixture-toggle" data-sensor="${id}b">V</button></div>`}).join('');
}
function renderFixtureStatus(){
  document.querySelectorAll('.callout').forEach(b=>{const on=!!state.fixture[b.dataset.sensor];b.classList.toggle('active-green',on);b.classList.toggle('red',!on);});
  const info=document.getElementById('fixtureInfo');if(info&&isTrainingStation(state.selectedStation)){const c=cellState();info.textContent=`Part BGT11a: ${c.partPresent?'PRESENT':'MISSING'} | Clamp command: ${c.clampCommand?'CLOSE':'OPEN'} | MM12b feedback: ${state.fixture.MM12b?'CLOSED':'OPEN'}`;}
}
function renderStationSequence(){
  if(!isTrainingStation(state.selectedStation))return;const c=cellState(),def=CELL_STEPS[c.sequenceStep]||CELL_STEPS[1],line=document.getElementById('stationSeqLine');
  if(line)line.textContent=`S ${String(c.sequenceStep).padStart(3,'0')}   ${def[0]} — ${def[1]}`;
  const db=document.getElementById('stationSeqDb');if(db)db.textContent='"115020V01#AS_DB"';
  const live=document.getElementById('stationLiveStatus');if(live)live.textContent=c.faultText?`HOLD: ${c.faultText}`:`${c.cycleActive?'AUTO SEQUENCE ACTIVE':'READY'} · Cycle count ${c.cycleCount} · Last ${c.lastCycleTime?c.lastCycleTime.toFixed(1)+' s':'--'}`;
}
function updateStationToolbar(){
  if(!isTrainingStation(state.selectedStation))return;const c=cellState(),mode=state.stationMode[c.station]||'automatic';
  document.querySelectorAll('.station-toolbar [data-action="station-mode"]').forEach(b=>b.classList.toggle('active-green',b.dataset.mode===mode));
  const ack=document.querySelector('[data-action="cell-safety-ack"]');if(ack)ack.classList.toggle('active-green',c.safetyAcknowledged&&c.safetyDoorClosed);
}
function renderStationStatus(){
  const el=document.getElementById('stationStatusTable');if(!el)return;const ccode=stationCode();
  if(isTrainingStation(state.selectedStation)){const c=cellState(),r=trainingRobot(),events=c.eventLog.slice(0,3);el.innerHTML=`<div class="section-title">Live PLC status</div><div><b>K100</b> ${state.controlVoltage?'1':'0'} · <b>Safety</b> ${c.safetyDoorClosed&&c.safetyAcknowledged?'1':'0'} · <b>Air</b> ${state.media.air11?'1':'0'}</div><div><b>Part</b> ${c.partPresent?'1':'0'} · <b>Clamp cmd</b> ${c.clampCommand?'1':'0'} · <b>MM12b</b> ${state.fixture.MM12b?'1':'0'}</div><div><b>Robot release</b> ${c.robotRelease?'1':'0'} · <b>Auto</b> ${r.auto?'1':'0'} · <b>FK</b> ${r.fk?'1':'0'}</div>${events.map(e=>`<div class="event-mini">${new Date(e.time).toLocaleTimeString()} ${e.text}</div>`).join('')}`;return;}
  el.innerHTML=`<div class="section-title">Status</div><div>${ccode}FM &nbsp;&nbsp; Total</div><div>${ccode}FM2 &nbsp;&nbsp; Welding ${state.selectedRobot}</div><div>${ccode}FM1 &nbsp;&nbsp; Release / Pick</div>`;
}
function renderViewer(){
  const el=document.getElementById('viewerSteps');if(!el)return;const c=cellState(),cellMode=isTrainingStation(state.selectedStation);const steps=cellMode?Object.keys(CELL_STEPS).map(n=>`S${n}  ${CELL_STEPS[n][0]}`):['S1  S_Init: Grundstellung','T1  T_FRG1: Release robot Drop','S2  S_FRG1: Release','T2  T_M12: Clamp confirmed','S3  S_MM11V: Position','T3  T_M14: Locator','S4  S_FRG2: Robot clear','T4  T_FK: Complete','S5  S_End'];const active=cellMode?c.sequenceStep:state.seqStep;
  el.innerHTML=steps.map((x,i)=>`<button class="viewer-step ${i===active-1?'active-green':''}" data-action="viewer-step" data-step="${i+1}">${x}</button>`).join('');
  const titleEl=document.getElementById('viewerTransitionTitle'),logic=document.getElementById('viewerLogic');if(cellMode&&titleEl&&logic){const s=c.sequenceStep;titleEl.textContent=`S${s}: ${CELL_STEPS[s][1]}`;const logicText={1:'Ready = K100 & Safety & Auto',2:`BGT11a PartPresent = ${c.partPresent?1:0}`,3:`Q ClampClose=${c.clampCommand?1:0} / I MM12b=${state.fixture.MM12b?1:0}`,4:`ARG2 Release=${c.interfaceRelease?1:0} / RobotReady=${robotReadyForAuto(trainingRobot())&&trainingRobot().auto?1:0}`,5:`Robot Running=${trainingRobot().running?1:0}`,6:`Robot FK=${trainingRobot().fk?1:0}`,7:`ClampCloseCmd=${c.clampCommand?1:0}`,8:'CycleComplete = 1'};logic.textContent=logicText[s]||'Training logic';}
}
function renderInterface(){
  const ins=document.getElementById('interfaceInputs'),outs=document.getElementById('interfaceOutputs');if(!ins||!outs)return;const r=trainingRobot(),c=cellState(),sm=state.stationMode[c.station]||'automatic';let inRows,outRows;
  if(state.interfacePage===0){inRows=[['I920.0','Linked Operation',true],['I920.1','Safety Door Closed',c.safetyDoorClosed],['I920.2','Part Present BGT11a',c.partPresent],['I920.3','Safety Acknowledged',c.safetyAcknowledged],['I920.4','Clamp Closed MM12b',state.fixture.MM12b],['I920.5','Auto Mode',sm==='automatic'],['I920.6','Air Pressure OK',state.media.air11],['I920.7','Robot Complete FK',r.fk]];outRows=[['Q920.0','K100 Control Voltage',state.controlVoltage],['Q920.1','Station Cycle Active',c.cycleActive],['Q920.2','Clamp Close Command',c.clampCommand],['Q920.3','Robot Release',c.robotRelease],['Q920.4','Robot Auto',r.auto],['Q920.5','Robot Drives Ready',r.drives],['Q920.6','Machine Safety Release',r.masi],['Q920.7','Interface Release ARG2',c.interfaceRelease]];}
  else {inRows=[['I921.0','Sequence S002 Part',c.sequenceStep===2],['I921.1','Sequence S003 Clamp',c.sequenceStep===3],['I921.2','Sequence S004 Release',c.sequenceStep===4],['I921.3','Sequence S005 Robot',c.sequenceStep===5],['I921.4','Sequence S006 Complete',c.sequenceStep===6],['I921.5','Sequence S007 Unclamp',c.sequenceStep===7],['I921.6','Sequence S008 End',c.sequenceStep===8],['I921.7','Cell Fault Active',!!c.faultCode]];outRows=[['Q921.0','Robot PF0/Home',r.pf0],['Q921.1','Robot MaSi',r.masi],['Q921.2','Robot Running',r.running],['Q921.3','Station Running',!!state.stationRunning[c.station]],['Q921.4','Clamp Feedback Failure Injected',c.failClampFeedback],['Q921.5','Challenge Active',!!c.challenge&&!c.challenge.solved],['Q921.6','Cycle Complete',c.sequenceStep===8&&!c.cycleActive],['Q921.7','Fault Acknowledged',state.robotFaultAcknowledged]];}
  const make=rows=>rows.map(([addr,label,on])=>`<div class="io-row"><span>${addr}</span><span class="io-bit ${on?'on':''}">${on?'1':'0'}</span><span>${label}</span></div>`).join('');ins.innerHTML=make(inRows);outs.innerHTML=make(outRows);
}
function renderCycle(){const el=document.getElementById('cycleGrid');if(!el)return;const c=cellState();const ids=['115000UQ1','115010R01','115020V01','115020R01','115070R02','115080R01','135100V01','135110R01','135120V01','135120R01','135130R01'];el.innerHTML=ids.map((id,i)=>{const set=id==='115020V01'?8.0:(38+(i%4)*4),actual=id==='115020V01'?(c.lastCycleTime||0):(Number(set)+(i===1?18.4:(i%3)*0.7)),diff=actual?actual-set:0;return `<div class="cycle-card"><div class="section-title">${id}</div><div class="cycle-line"><button class="hmi-btn">Actual&gt;setp</button><button class="hmi-btn">Without indication</button><span>Setpoint<br><b>${Number(set).toFixed(1)}</b></span><span>Actual<br><b>${actual?Number(actual).toFixed(1):'--'}</b></span><span>Diff.<br><b class="${Number(diff)>5?'bad':''}">${actual?Number(diff).toFixed(1):'--'}</b></span></div></div>`}).join('');}
function renderGlobal(){const grid=document.querySelector('.global-grid');if(!grid)return;const c=cellState(),r=trainingRobot();const groups=[['115020V01FM',[`Total / ${c.cycleActive?'RUN':'STOP'}`,`Step S${String(c.sequenceStep).padStart(3,'0')}`,`Clamp ${c.clampCommand?'CMD CLOSE':'OPEN'} / FB ${state.fixture.MM12b?'1':'0'}`,`Robot Release ${c.robotRelease?'1':'0'} / FK ${r.fk?'1':'0'}`]],['115020R02FM',['Total','Welding 115020V01','Welding 115020R02','Welding 115020R01']],['115030R01FM',['Total','Drop 115040UQ1','Glue 115030R01','Pick 115020V01']],['115070R01FM',['Total','Welding 115070V01','Welding 115070R02','Welding 115070R01']],['115080R01FM',['Total','Drop 125090UQ2','Pick 115070V01']],['135110R01FM',['Total','Pick 125090UQ2','Welding 135100R01','Load Small Part']],['135120V01FM',['Total','Welding 135120R03','Welding 135120R02','Welding 135120R01']],['135130R01FM',['Total','Drop 215140UQ1','Welding 135120V01','Pick 135120V01']]];grid.innerHTML=groups.map(([h,rows])=>`<div class="global-card"><h4>status</h4>${rows.map((rr,i)=>`<div><b>${h}${i||''}</b>&nbsp;&nbsp;${rr}</div>`).join('')}</div>`).join('');}
function renderSnmp(){const grid=document.getElementById('snmpGrid');if(!grid)return;const start=state.snmpPage?129:1,end=state.snmpPage?256:128;grid.innerHTML=Array.from({length:end-start+1},(_,i)=>start+i).map(n=>`<button class="hmi-btn snmp-device ${state.selectedSnmp===n?'active-green':''}" data-action="snmp-device" data-device="${n}">${String(n).padStart(3,'0')}</button>`).join('');}
function renderAlarms(){const list=document.getElementById('alarmList');if(!list)return;let rows;if(state.alarmView==='current')rows=state.alarms.filter(a=>a.active);else rows=state.alarms;list.innerHTML=(rows.length?rows:[{severity:'warning',active:false,ack:true,time:Date.now(),text:'TRAINING: No active alarms.'}]).map(a=>{const d=new Date(a.time||Date.now());const status=a.active?(a.ack?'A':'K'):'G';return `<div class="alarm-line ${a.severity==='fault'&&a.active?'red-line':'yellow-line'}"><span>${d.toLocaleTimeString()}</span><span>${d.toLocaleDateString()}</span><span>${status}</span><span>${a.text}</span></div>`}).join('');}

function initScreen(name){
  if(name==='plant'){
    const c=cellState(),r=trainingRobot();const safe=c.safetyDoorClosed&&c.safetyAcknowledged,ready=safe&&robotReadyForAuto(r)&&r.auto&&!c.faultCode;
    const safeTag=document.getElementById('cell11SafeTag'),safeLamp=document.getElementById('cell11SafeLamp'),readyTag=document.getElementById('cell11ReadyTag'),readyLamp=document.getElementById('cell11ReadyLamp');
    if(safeTag)safeTag.setAttribute('class',safe?'tag-green':'tag-red');if(safeLamp)safeLamp.setAttribute('class',safe?'lamp-green':'lamp-red');if(readyTag)readyTag.setAttribute('class',ready?'tag-green':'tag-yellow');if(readyLamp)readyLamp.setAttribute('class',ready?'lamp-green':'lamp-red');
    document.querySelectorAll('.robot-icon').forEach(el=>{const id=(el.dataset.device||'').replace('Robot ','');const r=robots[id];const circle=el.querySelector('circle');if(circle&&r){circle.setAttribute('class',robotColor(r)==='red'?'robot-red':robotColor(r)==='green'?'robot-green':robotColor(r)==='lightblue'?'robot-blue':'robot-yellow');}el.addEventListener('click',()=>{if(robots[id]){state.selectedRobot=id;state.selectedStation=robots[id].station;render('robot');}});});
  }
  if(name==='preselection'){document.querySelectorAll('.mode-panel').forEach(el=>el.innerHTML=makeModePanel(el.dataset.cell));const cv=document.getElementById('controlVoltage');if(cv){cv.textContent=state.controlVoltage?'On':'Off';cv.classList.toggle('active-green',state.controlVoltage);cv.dataset.action='control-voltage';}document.querySelectorAll('.utility-card .segmented').forEach(g=>g.querySelectorAll('button').forEach(b=>b.dataset.action='segmented-choice'));}
  if(name==='operating'){const el=document.getElementById('operatingRows');if(el)el.innerHTML=['11','115000','115050','12','13','135100'].map(opRow).join('');}
  if(name==='statistics'){document.querySelectorAll('.stats-toolbar button').forEach((b,i)=>{b.dataset.action=i===0?'stats-cycle':'stats-sequence'});document.querySelectorAll('.stats-card button').forEach(b=>b.dataset.action='stats-reset');}
  if(name==='diagnostics'){const d=new Date();['diagDate1','diagDate2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=d.toLocaleDateString()});['diagTime1','diagTime2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=d.toLocaleTimeString()});}
  if(name==='profinet'){const data=Array.from({length:20},(_,i)=>({name:`TRAINCELL---B1S1---DEV${String(i+1).padStart(2,'0')}`,ip:`172.20.10.${20+i}`}));document.getElementById('profinetGrid').innerHTML=data.map(x=>`<button class="profi-card" data-action="profinet-device" data-label="${x.name} / ${x.ip}"><span class="profi-ok"></span><strong>${x.name}</strong><br>${x.ip}</button>`).join('');}
  if(name==='sysdiag'){document.querySelectorAll('.alarm-toolbar button').forEach((b,i)=>b.dataset.action=['sys-current','sys-buffer','sys-log','sys-archive'][i]||'sys-current');}
  if(name==='topology'){const map=document.getElementById('topologyMap');if(map){const nodes=['PLC','HMI','SCALANCE X1','ET200SP-1','ET200SP-2','Robot LAN','Safety PLC','Drive IO'];map.innerHTML=nodes.map((n,i)=>`<button class="topology-node ${i===0?'root':''}" data-action="topology-node" data-label="${n}">${n}<span>${i===0?'CPU 1517F-3 PN/DP':'PROFINET'}</span></button>${i<nodes.length-1?'<i class="topology-link"></i>':''}`).join('');}}
  if(name==='snmp')renderSnmp();
  if(name==='sequencers'){document.querySelectorAll('.sequence-card').forEach((card,i)=>{const id=card.dataset.id||card.dataset.sequence||`SEQ${i+1}`;const seq=state.sequences[id]||{step:1,running:false};card.innerHTML=`<div class="section-title">sequence control ${id}</div><div class="sequence-tools"><b>${id}#AS_DB</b><button class="hmi-btn" data-action="seq-run" data-id="${id}">${seq.running?'Pause':'Run'}</button><button class="hmi-btn" data-action="seq-step" data-id="${id}">Step ${seq.step}</button><button class="hmi-btn" data-action="seq-reset" data-id="${id}">Reset</button></div><div class="sequence-line">S 001 &nbsp; S_Init: Grundstellung</div><div class="sequence-line">S 002 &nbsp; S_FRG1: Release robot / station</div>`;});}
  if(name==='robot'){document.querySelectorAll('[data-action="robot-overview"]').forEach(b=>b.classList.toggle('active-yellow',Number(b.dataset.page)===state.robotOverview));renderRobotRows();}
  if(name==='process'){document.querySelectorAll('[data-action="process-overview"]').forEach(b=>b.classList.toggle('active-yellow',Number(b.dataset.page)===state.processOverview));renderProcessRows();}
  if(name==='global')renderGlobal();
  if(name==='alarms'){document.querySelectorAll('.alarm-toolbar button').forEach((b,i)=>b.dataset.action=['alarm-current','alarm-buffer','alarm-log','alarm-archive'][i]||'alarm-current');renderAlarms();}
  if(name==='station'){const n=document.getElementById('stationName');if(n)n.textContent=stationCode();const db=document.getElementById('stationSeqDb');if(db)db.textContent=`"${stationCode()}#AS_DB"`;renderFixtureRows();renderStationStatus();renderStationSequence();updateStationToolbar();}
  if(name==='fixture'){renderFixtureStatus();}
  if(name==='administration')renderAdminCellPanel();
  if(name==='viewer')renderViewer(); if(name==='interface')renderInterface(); if(name==='cycletime')renderCycle();
  if(name==='correction'){const el=document.getElementById('correctionRows');if(el)el.innerHTML=state.correction.map((x,i)=>`<div class="correction-row"><span>${x?x.sequence:0}</span><span>${x?x.point:0}</span><button class="hmi-btn" data-action="correction-delete" data-index="${i}">Delete</button><span>${x?x.robot:''}</span></div>`).join('');}
  if(name==='maintenance'){const el=document.getElementById('maintenanceRows');if(el)el.innerHTML=['115000','115050','135100'].map(id=>`<div class="maintenance-row"><div class="maint-station">${id}</div><button class="hmi-btn" data-action="maint-supervisor" data-id="${id}">system<br>supervisor</button><div class="maint-request">Parts request</div><button class="hmi-btn ${state.maintenance[id]?'active-green':''}" data-action="maint-call" data-id="${id}">${state.maintenance[id]?'CALL ACTIVE':'Call'}</button></div>`).join('');}
}

function handleAction(button){const action=button.dataset.action;
  if(action==='station'){state.selectedStation=button.dataset.station;render('station');return;}
  if(action==='station-prev'||action==='station-next'){const i=stations.indexOf(state.selectedStation),d=action==='station-prev'?-1:1;state.selectedStation=stations[(i+d+stations.length)%stations.length];render('station');return;}
  if(action==='station-open'){state.selectedStation=button.dataset.station;render('station');return;}
  if(action==='toggle-preselection'){const cell=button.dataset.cell,label=button.dataset.label,cur=state.preselect[cell][label];state.preselect[cell][label]=cur==='off'?'preset':cur==='preset'?'active':'off';initScreen('preselection');return;}
  if(action==='control-voltage'){state.controlVoltage=!state.controlVoltage;initScreen('preselection');if(!state.controlVoltage)addAlarm('TRAINING: Control voltage K100 switched off.','warning');return;}
  if(action==='media-toggle'){const key=button.dataset.media;state.media[key]=!state.media[key];button.classList.toggle('active-green',state.media[key]);button.textContent=state.media[key]?(key.startsWith('air')?'Air':'On'):'Off';if(!state.media[key])addAlarm(`TRAINING: ${key} media preselection OFF.`,'warning');return;}
  if(action==='segmented-choice'){const group=button.parentElement;group.querySelectorAll('button').forEach(b=>b.classList.remove('blue','active-green'));button.classList.add('blue');toast(button.textContent.trim());return;}
  if(action==='station-mode'){const row=button.closest('.op-row');const target=row?.dataset.station||state.selectedStation;if(row)state.selectedStation=target;state.stationMode[target]=button.dataset.mode||button.textContent.trim().toLowerCase();if(isTrainingStation(target)&&state.stationMode[target]!=='automatic'&&state.trainingCell.cycleActive)stopTrainingCycle('operating mode changed');saveSim();if(state.currentScreen==='station')render('station',{noHistory:true});else initScreen('operating');return;}
  if(action==='station-start'){const row=button.closest('.op-row');const code=row?.dataset.station||state.selectedStation;if(row)state.selectedStation=code;if(isTrainingStation(code)){startTrainingCycle();if(state.currentScreen==='operating')initScreen('operating');return;}if(!state.controlVoltage){addAlarm(`TRAINING: ${code} Start rejected — K100 control voltage off.`,'fault',`ST_${code}_START`);toast('Start inhibited');return;}state.stationRunning[code]=true;saveSim();toast(`${code}: Start`);if(state.currentScreen==='station')render('station',{noHistory:true});else initScreen('operating');return;}
  if(action==='station-stop'){const row=button.closest('.op-row');const target=row?.dataset.station||state.selectedStation;if(row)state.selectedStation=target;if(isTrainingStation(target)){stopTrainingCycle('operator stop');if(state.currentScreen==='operating')initScreen('operating');return;}state.stationRunning[target]=false;addAlarm(`TRAINING: ${target} stopped.`,'warning',`ST_${target}_STOP`);saveSim();if(state.currentScreen==='station')render('station',{noHistory:true});else initScreen('operating');return;}
  if(action==='cell-safety-ack'){acknowledgeCellSafety();return;}
  if(action==='station-seq-step'){if(isTrainingStation(state.selectedStation)){toast('Sequence is PLC-driven in this training cell');return;}state.seqStep=Math.min(9,state.seqStep+1);document.getElementById('stationSeqLine').textContent=`S ${String(state.seqStep).padStart(3,'0')}   Training sequence advanced`;return;}
  if(action==='station-viewer'){render('viewer');return;} if(action==='fixture-view'){render('fixture');return;} if(action==='cell-interface'){render('interface');return;}
  if(action==='fixture-toggle'||action==='fixture-sensor'){const key=button.dataset.sensor;if(isTrainingStation(state.selectedStation)&&key==='BGT11a'){state.trainingCell.partPresent=!state.trainingCell.partPresent;state.fixture.BGT11a=state.trainingCell.partPresent;if(state.trainingCell.partPresent)clearAlarm('CELL_PART');}else{state.fixture[key]=!state.fixture[key];if(isTrainingStation(state.selectedStation)&&key==='MM12b'&&state.fixture.MM12b)clearAlarm('CELL_CLAMP');}saveSim();renderFixtureRows();renderFixtureStatus();renderStationStatus();refreshCurrentScreen();return;}
  if(action==='viewer-step'){if(isTrainingStation(state.selectedStation)){const n=Number(button.dataset.step),def=CELL_STEPS[n];toast(def?`${def[0]} — ${def[1]}`:'Sequence step');return;}state.seqStep=Number(button.dataset.step);renderViewer();document.getElementById('viewerTransitionTitle').textContent=`T${state.seqStep}: Training transition`;document.getElementById('viewerLogic').textContent=`${stationCode()}_AS_Frg${state.seqStep}`;return;}
  if(action==='stats-cycle'){render('cycletime');return;} if(action==='stats-sequence'){render('sequencers');return;} if(action==='stats-reset'){toast('Training counter reset');return;}
  if(action==='profinet-device'){toast(`${button.dataset.label} — simulated connection OK`);return;}
  if(action?.startsWith('sys-')){const box=document.querySelector('.large-table .empty');const map={'sys-current':'Current system alarms displayed.','sys-buffer':'Alarm buffer: historical training messages.','sys-log':'Training alarm log opened.','sys-archive':'Archive management simulated.'};if(box)box.textContent=map[action];return;}
  if(action==='topology-node'){document.querySelectorAll('.topology-node').forEach(b=>b.classList.remove('active-green'));button.classList.add('active-green');const e=document.getElementById('topologyInfo');if(e)e.textContent=`${button.dataset.label}: simulated connection healthy.`;return;}
  if(action==='snmp-device'){state.selectedSnmp=Number(button.dataset.device);renderSnmp();return;} if(action==='snmp-prev'){state.snmpPage=0;state.selectedSnmp=null;renderSnmp();return;} if(action==='snmp-next'){state.snmpPage=1;state.selectedSnmp=null;renderSnmp();return;} if(action==='snmp-read'){toast(state.selectedSnmp?`Read device ${state.selectedSnmp}: OK`:'Select a device');return;} if(action==='snmp-reset'){toast(state.selectedSnmp?`Reset device ${state.selectedSnmp}`:'Select a device');return;}
  if(action==='seq-run'||action==='seq-step'||action==='seq-reset'){const id=button.dataset.id,seq=state.sequences[id]||{step:1,running:false};if(action==='seq-run')seq.running=!seq.running;if(action==='seq-step')seq.step++;if(action==='seq-reset'){seq.step=1;seq.running=false;}state.sequences[id]=seq;initScreen('sequencers');return;}
  if(action==='robot-overview'){state.robotOverview=Number(button.dataset.page);renderRobotRows();return;}
  if(action==='robot-detail'){state.selectedRobot=button.dataset.robot;state.selectedStation=state.selectedRobot===state.trainingCell.robot?state.trainingCell.station:(robots[state.selectedRobot]?.station||state.selectedStation);toast(`${state.selectedRobot} selected`);return;}
  if(action==='robot-auto'){const row=button.closest('.robot-row'),id=row.dataset.robot,r=robots[id];if(!robotReadyForAuto(r)){robotFault(id,'Auto rejected — PF0, MaSi, Drives, or fault reset condition missing.');toast('Auto inhibited');renderRobotRows();return;}r.auto=!r.auto;if(!r.auto)r.running=false;saveSim();renderRobotRows();refreshCurrentScreen();return;}
  if(action==='robot-start'){const id=button.closest('.robot-row').dataset.robot,r=robots[id];if(!robotReadyForAuto(r)||!r.auto){robotFault(id,'Start rejected — robot must be fault-free, homed, safe, drives ON, and Auto selected.');toast('Start inhibited');renderRobotRows();return;}r.running=true;r.fk=true;toast(`${id}: Start accepted`);saveSim();renderRobotRows();refreshCurrentScreen();return;}
  if(action==='robot-stop'){const id=button.closest('.robot-row').dataset.robot;robots[id].running=false;robots[id].fk=false;addAlarm(`TRAINING: ${id} stopped.`,'warning');saveSim();renderRobotRows();return;}
  if(action==='robot-maintenance'){const id=button.closest('.robot-row').dataset.robot,r=robots[id];if(r.running){addAlarm(`TRAINING: ${id} Maintenance rejected — stop robot first.`,'fault');toast('Stop robot first');return;}r.maintenance=!r.maintenance;r.auto=false;if(r.maintenance){r.drives=false;r.pf0=false;}saveSim();renderRobotRows();return;}
  if(action==='robot-status'){const id=button.closest('.robot-row').dataset.robot;robotStatusCommand(id,button.dataset.kind);return;}
  if(action==='robot-indicator'){toast(`${button.textContent.trim()} is a status indicator`);return;} if(action==='robot-without'){button.classList.toggle('active-green');return;}
  if(action==='robot-ack'){acknowledge();return;} if(action==='robot-correction'){render('correction');return;} if(action==='robot-archive'){toast('Robot archive training view');return;} if(action==='sequence-open'){render('viewer');return;}
  if(action==='process-overview'){state.processOverview=Number(button.dataset.page);renderProcessRows();return;} if(action==='process-ack'){acknowledge();return;} if(action==='process-detail'){toast(`${button.dataset.process}: selected`);return;} if(action==='process-mode'){const row=button.closest('.process-row'),id=row.dataset.process;state.processModes[id]=button.dataset.mode;renderProcessRows();return;}
  if(action==='alarm-current'||action==='alarm-buffer'||action==='alarm-log'||action==='alarm-archive'){state.alarmView=action.replace('alarm-','');renderAlarms();return;}
  if(action==='trainer-safety'){if(state.trainingCell.safetyDoorClosed)openSafetyDoor();else closeSafetyDoor();return;}
  if(action==='trainer-part'){state.trainingCell.partPresent=!state.trainingCell.partPresent;state.fixture.BGT11a=state.trainingCell.partPresent;if(state.trainingCell.partPresent)clearAlarm('CELL_PART');saveSim();renderAdminCellPanel();return;}
  if(action==='trainer-clampfault'){state.trainingCell.failClampFeedback=!state.trainingCell.failClampFeedback;if(!state.trainingCell.failClampFeedback)clearAlarm('CELL_CLAMP');saveSim();renderAdminCellPanel();return;}
  if(action==='trainer-interface'){state.trainingCell.interfaceRelease=!state.trainingCell.interfaceRelease;if(state.trainingCell.interfaceRelease)clearAlarm('CELL_INTERFACE');saveSim();renderAdminCellPanel();return;}
  if(action==='trainer-air'){state.media.air11=!state.media.air11;if(state.media.air11)clearAlarm('CELL_AIR');saveSim();renderAdminCellPanel();return;}
  if(action==='trainer-random'){loadRandomChallenge();return;}
  if(action==='trainer-restore'){restoreTrainingCell();return;}
  if(action==='reset-sim'){resetSimulation();return;}
  if(action==='launch-tia'||action==='launch-eplan'){toast('External engineering application intentionally not launched in training');return;} if(action==='project-info'){const e=document.getElementById('adminInfo');if(e)e.textContent='Project: HMI Training Simulator v0.8 · interactive simulated PLC cell · no PLC connection.';return;} if(action==='clean-screen'){toast('Clean screen simulated');return;} if(action==='end-wincc'){toast('Exit disabled in training');return;}
  if(action==='tech'){toast(`${button.dataset.label}: technology detail selected`);return;} if(action==='type-item'){toast(`${button.dataset.label}: type information`);return;}
  if(action==='interface-page'){state.interfacePage=1-state.interfacePage;renderInterface();return;}
  if(action==='correction-delete'){state.correction[Number(button.dataset.index)]=null;initScreen('correction');return;}
  if(action==='maint-call'){const id=button.dataset.id;state.maintenance[id]=!state.maintenance[id];if(state.maintenance[id])addAlarm(`TRAINING: Maintenance call active for ${id}.`,'warning');initScreen('maintenance');return;} if(action==='maint-supervisor'){toast(`${button.dataset.id}: system supervisor call`);return;}
}

document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){if(nav.dataset.nav==='back')goBack();else render(nav.dataset.nav);return;}const a=e.target.closest('[data-action]');if(a)handleAction(a);});
document.getElementById('ackBtn').addEventListener('click',acknowledge);

function tick(){const d=new Date(),date=d.toLocaleDateString(),time=d.toLocaleTimeString();['dateText','alarmDate1','alarmDate2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=date});['timeText','alarmTime1','alarmTime2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=time});}
loadSim();tick();setInterval(tick,1000);setInterval(simulationTick,250);render('main',{noHistory:true});

/* v0.5 — fixed-resolution HMI viewport fitting. visualViewport already reports
   the actually visible browser area on iOS, so no guessed toolbar subtraction. */
const HMI_DESIGN_WIDTH=1280;
const HMI_DESIGN_HEIGHT=720;
let fitFrame=0;
let fitTimers=[];

function getVisibleViewport(){
  const vv=window.visualViewport;
  const width=vv&&vv.width>0?vv.width:(window.innerWidth||document.documentElement.clientWidth);
  const height=vv&&vv.height>0?vv.height:(window.innerHeight||document.documentElement.clientHeight);
  return {width,height,offsetLeft:vv?vv.offsetLeft:0,offsetTop:vv?vv.offsetTop:0};
}

function scaleHMI(){
  cancelAnimationFrame(fitFrame);
  fitFrame=requestAnimationFrame(()=>{
    const shell=document.getElementById('hmiShell');
    const viewportEl=document.getElementById('hmiViewport');
    if(!shell||!viewportEl) return;
    const view=getVisibleViewport();
    if(!Number.isFinite(view.width)||!Number.isFinite(view.height)||view.width<=0||view.height<=0) return;
    viewportEl.style.left=`${view.offsetLeft}px`;
    viewportEl.style.top=`${view.offsetTop}px`;
    viewportEl.style.width=`${view.width}px`;
    viewportEl.style.height=`${view.height}px`;
    const scale=Math.min(view.width/HMI_DESIGN_WIDTH,view.height/HMI_DESIGN_HEIGHT);
    const scaledWidth=HMI_DESIGN_WIDTH*scale;
    const scaledHeight=HMI_DESIGN_HEIGHT*scale;
    const x=(view.width-scaledWidth)/2;
    const y=(view.height-scaledHeight)/2;
    document.documentElement.style.setProperty('--hmi-scale',String(scale));
    document.documentElement.style.setProperty('--hmi-x',`${x}px`);
    document.documentElement.style.setProperty('--hmi-y',`${y}px`);
  });
}

function queueFit(){
  fitTimers.forEach(clearTimeout); fitTimers=[]; scaleHMI();
  [60,180,400,800].forEach(ms=>fitTimers.push(setTimeout(scaleHMI,ms)));
}
window.addEventListener('resize',queueFit,{passive:true});
window.addEventListener('orientationchange',queueFit,{passive:true});
window.addEventListener('pageshow',queueFit,{passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize',scaleHMI,{passive:true});
  window.visualViewport.addEventListener('scroll',scaleHMI,{passive:true});
}
queueFit();
