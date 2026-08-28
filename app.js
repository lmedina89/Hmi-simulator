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
  '115010R01':{station:'115000 UQ1',pf0:false,masi:false,drives:false,fk:false,auto:false,fault:true,maintenance:false},
  '115020R01':{station:'115020 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '115050R02':{station:'115050 UQ1',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '115060R01':{station:'115050 UQ1',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '115070R01':{station:'115070 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '115070R02':{station:'115070 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '115080R01':{station:'115085 SF1',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135100R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135110R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135120R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135120R02':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135120R03':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135130R01':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false},
  '135130R02':{station:'135100 V01',pf0:true,masi:true,drives:true,fk:true,auto:true,fault:false,maintenance:false}
};

const state={
  currentScreen:'main',history:[],selectedStation:'115000 UQ1',selectedRobot:'115010R01',robotOverview:1,processOverview:1,snmpPage:0,selectedSnmp:null,
  alarmView:'current',robotFaultAcknowledged:false,controlVoltage:true,plantIllumination:'off',workIllumination:'on',energyMode:'with',
  preselect:{11:{'Stop at end of cycle':'preset','line stop':'preset','Line Empty':'active','Production w/o part':'off','Creep speed':'off'},12:{'Stop at end of cycle':'preset','line stop':'preset','Line Empty':'active','Production w/o part':'off','Creep speed':'off'},13:{'Stop at end of cycle':'preset','line stop':'preset','Line Empty':'active','Production w/o part':'off','Creep speed':'off'}},
  stationMode:{},stationRunning:{},fixture:{MM11a:true,MM12b:true,BGT11a:true,BGT12b:false,MM14a:true},seqStep:2,sequences:{},processModes:{},interfacePage:0,
  correction:[{sequence:125,point:18,robot:'115010R01'},null,null,null,null,null,null,null],
  maintenance:{'115000':false,'115050':false,'135100':false},media:{air11:true,cool11:true,air13:true},
  alarms:[
    {id:'R115010',severity:'fault',ack:false,text:'TRAINING: 115010R01 robot fault — drives not enabled.'},
    {id:'LUBE',severity:'warning',ack:false,text:'TRAINING: Lubrication level low.'}
  ]
};

function render(name,opts={}){
  const tpl=document.getElementById(`screen-${name}`); if(!tpl)return;
  if(!opts.noHistory && state.currentScreen!==name) state.history.push(state.currentScreen);
  state.currentScreen=name; host.innerHTML=''; host.appendChild(tpl.content.cloneNode(true)); title.textContent=names[name]||name; initScreen(name); updatePersistentUI();
}
function goBack(){const prev=state.history.pop()||'main'; render(prev,{noHistory:true});}
function toast(message){const el=document.getElementById('hmiToast');if(!el)return;el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),1600);}
function robotColor(r){if(r.fault)return'red';if(r.maintenance)return'lightblue';if(r.pf0)return'green';return'gray';}
function activeAlarm(){return state.alarms.find(a=>!a.ack)||state.alarms[0];}
function updatePersistentUI(){
  document.querySelectorAll('.footer-nav [data-action="station"]').forEach(b=>b.classList.toggle('active-yellow',b.dataset.station===state.selectedStation));
  const a=activeAlarm(); const t1=document.getElementById('alarmText1'); if(t1)t1.textContent=a?a.text:'TRAINING: No active alarms.';
  const t2=document.getElementById('alarmText2'); if(t2)t2.textContent=state.alarms[1]?state.alarms[1].text:'TRAINING: System ready.';
}
function addAlarm(text,severity='warning'){const existing=state.alarms.find(a=>a.text===text&&!a.ack);if(!existing)state.alarms.unshift({id:`A${Date.now()}`,severity,ack:false,text});updatePersistentUI();}
function acknowledge(){const a=state.alarms.find(x=>!x.ack);if(a)a.ack=true;state.robotFaultAcknowledged=true;updatePersistentUI();toast(a?'Alarm acknowledged':'No unacknowledged alarms');}

function makeModePanel(cell){
  const labels=['Stop at end of cycle','line stop','Line Empty','Production w/o part','Creep speed'];
  return `<div class="section-title mode-title">Vorwahlen <b>${cell}</b></div>`+labels.map(label=>{const v=state.preselect[cell][label];return `<div class="mode-row"><button class="hmi-btn pre-btn ${v==='active'?'blue':v==='preset'?'preflash':''}" data-action="toggle-preselection" data-cell="${cell}" data-label="${label}"><span class="release-dot ${v==='off'?'gray':'yellow-dot'}"></span>Pre-set</button><div class="label">${label}</div></div>`}).join('');
}
function opRow(id){const mode=state.stationMode[id]||'automatic',run=state.stationRunning[id]??true;return `<div class="op-row" data-station="${id}"><button class="hmi-btn yellow" data-action="station-open" data-station="${id}">${id}</button><button class="hmi-btn">E2</button><button class="hmi-btn red">E Stop</button><button class="hmi-btn active-green">operator safety</button><button class="hmi-btn ${run?'active-green':'red'}">Controls</button><button class="hmi-btn ${run?'active-green':'red'}">Start cond.</button><button class="hmi-btn ${mode==='manual'?'active-green':''}" data-action="station-mode" data-mode="manual">Manual</button><button class="hmi-btn ${mode==='automatic'?'active-green':''}" data-action="station-mode" data-mode="automatic">Automatic</button><button class="hmi-btn ${!run?'red':''}" data-action="station-stop">Stop</button><button class="hmi-btn ${run?'active-green':''}" data-action="station-start">Start</button></div>`;}
function robotRow(id){const r=robots[id],c=robotColor(r);return `<div class="robot-row" data-robot="${id}"><button class="hmi-btn yellow" data-action="robot-detail" data-robot="${id}">${id}</button><button class="hmi-btn" data-action="robot-without">Without Robot</button><button class="hmi-btn">E2</button><button class="hmi-btn ${r.auto?'active-green':''}" data-action="robot-auto">Auto</button><button class="hmi-btn ${r.pf0?'active-green':''}" data-action="robot-indicator">PF0</button><button class="hmi-btn ${r.masi?'active-green':''}" data-action="robot-indicator">MaSi</button><button class="hmi-btn ${r.drives?'active-green':''}" data-action="robot-indicator">Drives</button><button class="hmi-btn ${r.fk?'active-green':''}" data-action="robot-indicator">FK</button><button class="hmi-btn" data-action="sequence-open">Sequence 125</button><button class="hmi-btn" data-action="robot-start">Start</button><button class="hmi-btn ${c==='red'?'red':''}" data-action="robot-stop">Stop</button><button class="hmi-btn ${r.maintenance?'light-blue':''}" data-action="robot-maintenance">Maintenance</button></div>`;}
function renderRobotRows(){const groups={1:['115010R01','115020R01','115050R02','115060R01','115070R01','115080R01'],2:['115070R02','135100R01','135110R01','135120R01','135120R02','135120R03'],3:['135130R01','135130R02']};const el=document.getElementById('robotRows');if(el)el.innerHTML=groups[state.robotOverview].map(robotRow).join('');}
function processRow(id){const mode=state.processModes[id]||'';return `<div class="process-row" data-process="${id}"><button class="hmi-btn yellow" data-action="process-detail" data-process="${id}">${id}</button><button class="hmi-btn ${mode==='without'?'active-green':''}" data-action="process-mode" data-mode="without">Without Process</button><button class="hmi-btn" data-action="process-mode" data-mode="vw">VW</button><button class="hmi-btn" data-action="process-mode" data-mode="max">MAX</button><button class="hmi-btn" data-action="process-mode" data-mode="flt">FLT</button><button class="hmi-btn" data-action="process-mode" data-mode="zi">ZI</button><button class="hmi-btn" data-action="process-mode" data-mode="force">Without Force</button><button class="hmi-btn" data-action="process-mode" data-mode="milling">milling</button><button class="hmi-btn" data-action="process-mode" data-mode="maintenance">Maintenance</button></div>`;}
function renderProcessRows(){const groups={1:['115020R01KE1','115020R01KW1','115020R02KE1','115020R02KW1','115070R01KE1','115070R01KW1'],2:['115070R02KE1','115070R02KW1','135100R01KE1','135100R01KW1','135120R01KE1','135120R01KW1'],3:['135120R02KE1','135120R02KW1','135120R03KE1','135120R03KW1'],4:['115010R01G01','115060R01G01','135110R01G01'],5:['115080R01G01','115080R01KE1','135130R01G01','135130R01KE1'],6:['115030R01G01','115030R01KL1']};const el=document.getElementById('processRows');if(el)el.innerHTML=groups[state.processOverview].map(processRow).join('');}

function stationCode(){return state.selectedStation.replace(' ','');}
function renderFixtureRows(){const el=document.getElementById('fixtureRows');if(!el)return;const code=stationCode();const rows=[['MM11','Clamp with Pin'],['MM12','Clamp'],['MM13','Clamp'],['MM14','Locating Pin']];el.innerHTML=rows.map(([id,label],i)=>`<div class="fixture-row"><button class="io-square" data-action="fixture-toggle" data-sensor="${id}a">R</button><div class="fixture-label"><b>${label}</b><span>${code}${id}</span><small>K100 &nbsp; a b c d</small></div><button class="io-square" data-action="fixture-toggle" data-sensor="${id}b">V</button></div>`).join('');}
function renderStationStatus(){const el=document.getElementById('stationStatusTable');if(!el)return;const c=stationCode();el.innerHTML=`<div class="section-title">Status</div><div>${c}FM &nbsp;&nbsp; Total</div><div>${c}FM2 &nbsp;&nbsp; Welding ${state.selectedRobot}</div><div>${c}FM1 &nbsp;&nbsp; Release / Pick</div>`;}
function renderViewer(){const el=document.getElementById('viewerSteps');if(!el)return;const steps=['S1  S_Init: Grundstellung','T1  T_FRG1: Release robot Drop','S2  S_FRG1: Release','T2  T_M12: Clamp confirmed','S3  S_MM11V: Position','T3  T_M14: Locator','S4  S_FRG2: Robot clear','T4  T_FK: Complete','S5  S_End'];el.innerHTML=steps.map((x,i)=>`<button class="viewer-step ${i===state.seqStep-1?'active-green':''}" data-action="viewer-step" data-step="${i+1}">${x}</button>`).join('');}
function renderInterface(){const ins=document.getElementById('interfaceInputs'),outs=document.getElementById('interfaceOutputs');if(!ins||!outs)return;const r=robots[state.selectedRobot]||Object.values(robots)[0];const sm=state.stationMode[state.selectedStation]||'automatic';const inRows=[['I920.0','Linked Operation',true],['I920.1','Access Request',false],['I920.2','Production Without Part',state.preselect[11]['Production w/o part']==='active'],['I920.3','Access Release',true],['I920.5','Release Hand mode',sm==='manual'],['I920.6','Release Auto mode',sm==='automatic'],['I921.0','Release Drop',state.stationRunning[state.selectedStation]??true],['I922.4','Locking Release 45',true]];const outRows=[['Q920.0','Linked Operation',true],['Q920.1','Access Request',false],['Q920.2','Production Without Part',false],['Q921.4','Robot in Sequence 20',state.seqStep>1],['Q921.7','Robot Home Position',r.pf0],['Q923.0','Machine Safety Release',r.masi],['Q923.1','Maintenance Enabled/Active',r.maintenance],['Q923.4','Without Robot',false]];const make=rows=>rows.map(([addr,label,on])=>`<div class="io-row"><span>${addr}</span><span class="io-bit ${on?'on':''}">${on?'1':'0'}</span><span>${label}</span></div>`).join('');ins.innerHTML=make(inRows);outs.innerHTML=make(outRows);}
function renderCycle(){const el=document.getElementById('cycleGrid');if(!el)return;const ids=['115000UQ1','115010R01','115020V01','115020R01','115070R02','115080R01','135100V01','135110R01','135120V01','135120R01','135130R01'];el.innerHTML=ids.map((id,i)=>{const set=(38+(i%4)*4).toFixed(1),actual=(Number(set)+(i===1?18.4:(i%3)*0.7)).toFixed(1),diff=(actual-set).toFixed(1);return `<div class="cycle-card"><div class="section-title">${id}</div><div class="cycle-line"><button class="hmi-btn">Actual&gt;setp</button><button class="hmi-btn">Without indication</button><span>Setpoint<br><b>${set}</b></span><span>Actual<br><b>${actual}</b></span><span>Diff.<br><b class="${Number(diff)>5?'bad':''}">${diff}</b></span></div></div>`}).join('');}
function renderGlobal(){const grid=document.querySelector('.global-grid');if(!grid)return;const groups=[['115010R01FM',['Total','Drop 115020V01']],['115020R02FM',['Total','Welding 115020V01','Welding 115020R02','Welding 115020R01']],['115030R01FM',['Total','Drop 115040UQ1','Glue 115030R01','Pick 115020V01']],['115070R01FM',['Total','Welding 115070V01','Welding 115070R02','Welding 115070R01']],['115080R01FM',['Total','Drop 125090UQ2','Pick 115070V01']],['135110R01FM',['Total','Pick 125090UQ2','Welding 135100R01','Load Small Part']],['135120V01FM',['Total','Welding 135120R03','Welding 135120R02','Welding 135120R01']],['135130R01FM',['Total','Drop 215140UQ1','Welding 135120V01','Pick 135120V01']]];grid.innerHTML=groups.map(([h,rows])=>`<div class="global-card"><h4>status</h4>${rows.map((r,i)=>`<div><b>${h}${i||''}</b>&nbsp;&nbsp;${r}</div>`).join('')}</div>`).join('');}
function renderSnmp(){const grid=document.getElementById('snmpGrid');if(!grid)return;const start=state.snmpPage?129:1,end=state.snmpPage?256:128;grid.innerHTML=Array.from({length:end-start+1},(_,i)=>start+i).map(n=>`<button class="hmi-btn snmp-device ${state.selectedSnmp===n?'active-green':''}" data-action="snmp-device" data-device="${n}">${String(n).padStart(3,'0')}</button>`).join('');}
function renderAlarms(){const list=document.getElementById('alarmList');if(!list)return;const rows=state.alarmView==='current'?state.alarms.filter(a=>!a.ack):state.alarms;list.innerHTML=(rows.length?rows:[{severity:'warning',text:'TRAINING: No active alarms.'}]).map((a,i)=>`<div class="alarm-line ${a.severity==='fault'?'red-line':'yellow-line'}"><span>${new Date().toLocaleTimeString()}</span><span>${new Date().toLocaleDateString()}</span><span>K</span><span>${a.text}</span></div>`).join('');}

function initScreen(name){
  if(name==='plant'){
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
  if(name==='station'){const n=document.getElementById('stationName');if(n)n.textContent=stationCode();const db=document.getElementById('stationSeqDb');if(db)db.textContent=`"${stationCode()}#AS_DB"`;renderFixtureRows();renderStationStatus();}
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
  if(action==='station-mode'){const row=button.closest('.op-row');const target=row?.dataset.station||state.selectedStation;if(row)state.selectedStation=target;state.stationMode[target]=button.dataset.mode||button.textContent.trim().toLowerCase();if(state.currentScreen==='station')render('station',{noHistory:true});else initScreen('operating');return;}
  if(action==='station-start'){const row=button.closest('.op-row');const code=row?.dataset.station||state.selectedStation;if(row)state.selectedStation=code;if(!state.controlVoltage){addAlarm(`TRAINING: ${code} Start rejected — K100 control voltage off.`,'fault');toast('Start inhibited');return;}state.stationRunning[code]=true;toast(`${code}: Start`);if(state.currentScreen==='station')render('station',{noHistory:true});else initScreen('operating');return;}
  if(action==='station-stop'){const row=button.closest('.op-row');const target=row?.dataset.station||state.selectedStation;if(row)state.selectedStation=target;state.stationRunning[target]=false;addAlarm(`TRAINING: ${target} stopped.`,'warning');if(state.currentScreen==='station')render('station',{noHistory:true});else initScreen('operating');return;}
  if(action==='station-seq-step'){state.seqStep=Math.min(9,state.seqStep+1);document.getElementById('stationSeqLine').textContent=`S ${String(state.seqStep).padStart(3,'0')}   Training sequence advanced`;return;}
  if(action==='station-viewer'){render('viewer');return;} if(action==='fixture-view'){render('fixture');return;}
  if(action==='fixture-toggle'||action==='fixture-sensor'){const key=button.dataset.sensor;state.fixture[key]=!state.fixture[key];const info=document.getElementById('fixtureInfo');if(info)info.textContent=`${key}: ${state.fixture[key]?'ON / made':'OFF / not made'}`;if(!state.fixture[key])addAlarm(`TRAINING: ${stationCode()} ${key} not made — sequence waiting.`,'fault');return;}
  if(action==='viewer-step'){state.seqStep=Number(button.dataset.step);renderViewer();document.getElementById('viewerTransitionTitle').textContent=`T${state.seqStep}: Training transition`;document.getElementById('viewerLogic').textContent=`${stationCode()}_AS_Frg${state.seqStep}`;return;}
  if(action==='stats-cycle'){render('cycletime');return;} if(action==='stats-sequence'){render('sequencers');return;} if(action==='stats-reset'){toast('Training counter reset');return;}
  if(action==='profinet-device'){toast(`${button.dataset.label} — simulated connection OK`);return;}
  if(action?.startsWith('sys-')){const box=document.querySelector('.large-table .empty');const map={'sys-current':'Current system alarms displayed.','sys-buffer':'Alarm buffer: historical training messages.','sys-log':'Training alarm log opened.','sys-archive':'Archive management simulated.'};if(box)box.textContent=map[action];return;}
  if(action==='topology-node'){document.querySelectorAll('.topology-node').forEach(b=>b.classList.remove('active-green'));button.classList.add('active-green');const e=document.getElementById('topologyInfo');if(e)e.textContent=`${button.dataset.label}: simulated connection healthy.`;return;}
  if(action==='snmp-device'){state.selectedSnmp=Number(button.dataset.device);renderSnmp();return;} if(action==='snmp-prev'){state.snmpPage=0;state.selectedSnmp=null;renderSnmp();return;} if(action==='snmp-next'){state.snmpPage=1;state.selectedSnmp=null;renderSnmp();return;} if(action==='snmp-read'){toast(state.selectedSnmp?`Read device ${state.selectedSnmp}: OK`:'Select a device');return;} if(action==='snmp-reset'){toast(state.selectedSnmp?`Reset device ${state.selectedSnmp}`:'Select a device');return;}
  if(action==='seq-run'||action==='seq-step'||action==='seq-reset'){const id=button.dataset.id,seq=state.sequences[id]||{step:1,running:false};if(action==='seq-run')seq.running=!seq.running;if(action==='seq-step')seq.step++;if(action==='seq-reset'){seq.step=1;seq.running=false;}state.sequences[id]=seq;initScreen('sequencers');return;}
  if(action==='robot-overview'){state.robotOverview=Number(button.dataset.page);renderRobotRows();return;}
  if(action==='robot-detail'){state.selectedRobot=button.dataset.robot;state.selectedStation=robots[state.selectedRobot]?.station||state.selectedStation;toast(`${state.selectedRobot} selected`);return;}
  if(action==='robot-auto'){const row=button.closest('.robot-row'),id=row.dataset.robot,r=robots[id];if(r.fault||!r.drives){addAlarm(`TRAINING: ${id} Auto rejected — robot not ready.`,'fault');toast('Auto inhibited');return;}r.auto=!r.auto;renderRobotRows();return;}
  if(action==='robot-start'){const id=button.closest('.robot-row').dataset.robot,r=robots[id];if(r.fault||!r.drives||!r.masi){addAlarm(`TRAINING: ${id} Start rejected — readiness condition missing.`,'fault');toast('Start inhibited');return;}r.auto=true;r.fk=true;toast(`${id}: Start accepted`);renderRobotRows();return;}
  if(action==='robot-stop'){const id=button.closest('.robot-row').dataset.robot;robots[id].auto=false;robots[id].fk=false;addAlarm(`TRAINING: ${id} stopped.`,'warning');renderRobotRows();return;}
  if(action==='robot-maintenance'){const id=button.closest('.robot-row').dataset.robot,r=robots[id];r.maintenance=!r.maintenance;r.auto=false;renderRobotRows();return;}
  if(action==='robot-indicator'){toast(`${button.textContent.trim()} is a status indicator`);return;} if(action==='robot-without'){button.classList.toggle('active-green');return;}
  if(action==='robot-ack'){acknowledge();return;} if(action==='robot-correction'){render('correction');return;} if(action==='robot-archive'){toast('Robot archive training view');return;} if(action==='sequence-open'){render('viewer');return;}
  if(action==='process-overview'){state.processOverview=Number(button.dataset.page);renderProcessRows();return;} if(action==='process-ack'){acknowledge();return;} if(action==='process-detail'){toast(`${button.dataset.process}: selected`);return;} if(action==='process-mode'){const row=button.closest('.process-row'),id=row.dataset.process;state.processModes[id]=button.dataset.mode;renderProcessRows();return;}
  if(action==='alarm-current'||action==='alarm-buffer'||action==='alarm-log'||action==='alarm-archive'){state.alarmView=action.replace('alarm-','');renderAlarms();return;}
  if(action==='launch-tia'||action==='launch-eplan'){toast('External engineering application intentionally not launched in training');return;} if(action==='project-info'){const e=document.getElementById('adminInfo');if(e)e.textContent='Project: HMI Training Simulator · Browser simulation · no PLC connection.';return;} if(action==='clean-screen'){toast('Clean screen simulated');return;} if(action==='end-wincc'){toast('Exit disabled in training');return;}
  if(action==='tech'){toast(`${button.dataset.label}: technology detail selected`);return;} if(action==='type-item'){toast(`${button.dataset.label}: type information`);return;}
  if(action==='interface-page'){state.interfacePage=1-state.interfacePage;renderInterface();return;}
  if(action==='correction-delete'){state.correction[Number(button.dataset.index)]=null;initScreen('correction');return;}
  if(action==='maint-call'){const id=button.dataset.id;state.maintenance[id]=!state.maintenance[id];if(state.maintenance[id])addAlarm(`TRAINING: Maintenance call active for ${id}.`,'warning');initScreen('maintenance');return;} if(action==='maint-supervisor'){toast(`${button.dataset.id}: system supervisor call`);return;}
}

document.addEventListener('click',e=>{const nav=e.target.closest('[data-nav]');if(nav){if(nav.dataset.nav==='back')goBack();else render(nav.dataset.nav);return;}const a=e.target.closest('[data-action]');if(a)handleAction(a);});
document.getElementById('ackBtn').addEventListener('click',acknowledge);

function tick(){const d=new Date(),date=d.toLocaleDateString(),time=d.toLocaleTimeString();['dateText','alarmDate1','alarmDate2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=date});['timeText','alarmTime1','alarmTime2'].forEach(id=>{const e=document.getElementById(id);if(e)e.textContent=time});}
tick();setInterval(tick,1000);render('main',{noHistory:true});

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
