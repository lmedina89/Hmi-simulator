const host = document.getElementById('screenHost');
const title = document.getElementById('screenTitle');

const names = {
  main:'Grundbild 010',
  plant:'Anlagenübersicht 011',
  preselection:'Vorwahlen 013',
  operating:'Betriebsarten 012',
  statistics:'Statistik 020',
  diagnostics:'SPS + PN 030',
  profinet:'System Diagnosepuffer',
  sysdiag:'Systemdiagnose',
  topology:'Topology Editor',
  snmp:'Detail Diagnose SNMP',
  sequencers:'AS 031',
  applications:'Applikationen',
  administration:'Administration',
  robot:'Roboter 014',
  process:'Rob-Prozessgeräte 015',
  global:'GlobalStatus 017',
  alarms:'ProDiag_Meldeanzeigen'
};

const state = {
  robotFault:true,
  robotFaultAcknowledged:false,
  controlVoltage:true,
  selectedStation:'115000 UQ1',
  robotOverview:1,
  processOverview:1,
  snmpPage:0,
  selectedSnmp:null,
  robotModes:{},
  processModes:{},
  sequences:{},
  alarmView:'current'
};

function render(name){
  const tpl = document.getElementById(`screen-${name}`);
  if(!tpl) return;
  host.innerHTML = '';
  host.appendChild(tpl.content.cloneNode(true));
  title.textContent = names[name] || name;
  initScreen(name);
}

function toast(message){
  const el = document.getElementById('hmiToast');
  if(!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(()=>el.classList.remove('show'),1800);
}

function setActiveChoice(button, selector){
  const scope = button.closest(selector) || button.parentElement;
  if(!scope) return;
  scope.querySelectorAll('.hmi-btn').forEach(b=>b.classList.remove('active-green','active-yellow','red'));
  button.classList.add('active-green');
}

function makeModePanel(cell){
  const labels=['Stop at end of cycle','line stop','Line Empty','Production w/o part','Creep speed'];
  return `<div class="section-title">Vorwahlen ${cell}</div>` +
    labels.map((label,i)=>`<div class="mode-row">
      <button class="hmi-btn ${i===2?'blue':''}" data-action="toggle-preselection" data-label="${label}">Pre-set</button>
      <div class="label">${label}</div>
    </div>`).join('');
}

function opRow(id){
  return `<div class="op-row" data-station="${id}">
    <button class="hmi-btn yellow" data-action="station-detail" data-station="${id}">${id}</button>
    <button class="hmi-btn" data-action="op-mode">E2</button>
    <button class="hmi-btn red" data-action="op-status">E Stop</button>
    <button class="hmi-btn active-green" data-action="op-status">operator safety</button>
    <button class="hmi-btn red" data-action="op-status">Controls</button>
    <button class="hmi-btn red" data-action="op-status">Start conditions</button>
    <button class="hmi-btn" data-action="op-command">Hold</button>
    <button class="hmi-btn" data-action="op-command">Manual</button>
    <button class="hmi-btn active-green" data-action="op-command">Automatic</button>
    <button class="hmi-btn" data-action="op-command">Stop</button>
    <button class="hmi-btn active-green" data-action="op-command">Start</button>
  </div>`;
}

function robotRow(id,fault=false){
  const mode = state.robotModes[id] || 'auto';
  return `<div class="robot-row" data-robot="${id}">
    <button class="hmi-btn yellow" data-action="robot-detail" data-robot="${id}">${id}</button>
    <button class="hmi-btn" data-action="robot-toggle">Without Robot</button>
    <button class="hmi-btn" data-action="robot-toggle">E2</button>
    <button class="hmi-btn ${fault?'red':mode==='auto'?'active-green':''}" data-action="robot-auto">Auto</button>
    <button class="hmi-btn ${fault?'':'active-green'}" data-action="robot-indicator">PF0</button>
    <button class="hmi-btn ${fault?'':'active-green'}" data-action="robot-indicator">MaSi</button>
    <button class="hmi-btn ${fault?'':'active-green'}" data-action="robot-indicator">Drives</button>
    <button class="hmi-btn ${fault?'':'active-green'}" data-action="robot-indicator">FK</button>
    <button class="hmi-btn" data-action="sequence-open">Sequence 125</button>
    <button class="hmi-btn ${mode==='start'?'active-green':''}" data-action="robot-start">Start</button>
    <button class="hmi-btn ${mode==='stop'?'red':''}" data-action="robot-stop">Stop</button>
  </div>`;
}

function processRow(id){
  const mode = state.processModes[id] || '';
  return `<div class="process-row" data-process="${id}">
    <button class="hmi-btn yellow" data-action="process-detail" data-process="${id}">${id}</button>
    <button class="hmi-btn ${mode==='without'?'active-green':''}" data-action="process-mode" data-mode="without">Without Process</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="vw">VW</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="max">MAX</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="flt">FLT</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="zi">ZI</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="force">Without Force</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="milling">milling</button>
    <button class="hmi-btn" data-action="process-mode" data-mode="maintenance">Maintenance</button>
  </div>`;
}

function renderRobotRows(){
  const groups = {
    1:['115010R01','115020R01','115050R02','115060R01','115070R01','115080R01'],
    2:['115070R02','135100R01','135110R01','135120R01','135120R02','135120R03'],
    3:['135130R01','135130R02']
  };
  const rows = document.getElementById('robotRows');
  if(!rows) return;
  rows.innerHTML = groups[state.robotOverview].map(id=>robotRow(id,id==='115010R01' && state.robotFault)).join('');
}

function renderProcessRows(){
  const groups = {
    1:['115020R01KE1','115020R01KW1','115020R02KE1','115020R02KW1','115070R01KE1','115070R01KW1'],
    2:['115070R02KE1','115070R02KW1','135100R01KE1','135100R01KW1','135120R01KE1','135120R01KW1'],
    3:['135120R02KE1','135120R02KW1','135120R03KE1','135120R03KW1'],
    4:['115010R01G01','115060R01G01','135110R01G01'],
    5:['115080R01G01','115080R01KE1','135130R01G01','135130R01KE1'],
    6:['115030R01G01','115030R01KL1']
  };
  const rows = document.getElementById('processRows');
  if(!rows) return;
  rows.innerHTML = groups[state.processOverview].map(processRow).join('');
}

function renderSnmp(){
  const grid = document.getElementById('snmpGrid');
  if(!grid) return;
  const start = state.snmpPage === 0 ? 1 : 129;
  const end = state.snmpPage === 0 ? 128 : 256;
  const buttons=[];
  for(let i=start;i<=end;i++){
    buttons.push(`<button class="hmi-btn snmp-device ${state.selectedSnmp===i?'active-green':''}" data-action="snmp-device" data-device="${i}">${String(i).padStart(3,'0')}</button>`);
  }
  grid.innerHTML = buttons.join('');
}

function renderAlarms(){
  const list=document.getElementById('alarmList');
  if(!list) return;
  const rows=[];
  const count = state.alarmView==='current' ? 14 : state.alarmView==='buffer' ? 24 : 10;
  for(let i=0;i<count;i++){
    const red = state.alarmView!=='log' && i>=6 && i<=10;
    rows.push(`<div class="alarm-line ${red?'red-line':'yellow-line'}">
      <span>12:17:${String(20+i).padStart(2,'0')}</span><span>8/3/2026</span><span>K</span>
      <span>${red?'TRAINING fault: device/interlock condition active':'TRAINING warning: PROFIenergy / station message'}</span>
    </div>`);
  }
  list.innerHTML=rows.join('');
}

function initScreen(name){
  if(name==='plant'){
    document.querySelectorAll('.robot-icon').forEach(el=>{
      el.addEventListener('click',()=>{
        document.getElementById('deviceInfo').textContent = `${el.dataset.device} selected — tap Robot below for its training controls.`;
      });
    });
  }

  if(name==='preselection'){
    document.querySelectorAll('.mode-panel').forEach(el=>{ el.innerHTML = makeModePanel(el.dataset.cell); });
    const cv=document.getElementById('controlVoltage');
    cv.textContent=state.controlVoltage?'On':'Off';
    cv.classList.toggle('active-green',state.controlVoltage);
    cv.dataset.action='control-voltage';
    document.querySelectorAll('.utility-card .segmented').forEach(group=>{
      group.querySelectorAll('button').forEach(b=>b.dataset.action='segmented-choice');
    });
  }

  if(name==='operating'){
    const ids=['11','115000','115050','12','13','135100'];
    document.getElementById('operatingRows').innerHTML=ids.map(opRow).join('');
  }

  if(name==='statistics'){
    document.querySelectorAll('.stats-toolbar button').forEach((b,i)=>{
      b.dataset.action=i===0?'stats-cycle':'stats-sequence';
    });
    document.querySelectorAll('.stats-card button').forEach(b=>b.dataset.action='stats-reset');
  }

  if(name==='diagnostics'){
    const d=new Date();
    ['diagDate1','diagDate2'].forEach(id=>document.getElementById(id).textContent=d.toLocaleDateString());
    ['diagTime1','diagTime2'].forEach(id=>document.getElementById(id).textContent=d.toLocaleTimeString());
  }

  if(name==='profinet'){
    const data=Array.from({length:20},(_,i)=>({name:`TRAINCELL---B1S1---DEV${String(i+1).padStart(2,'0')}`,ip:`172.20.10.${20+i}`}));
    document.getElementById('profinetGrid').innerHTML=data.map(x=>`<button class="profi-card" data-action="profinet-device" data-label="${x.name} / ${x.ip}"><span class="profi-ok"></span><strong>${x.name}</strong><br>${x.ip}</button>`).join('');
  }

  if(name==='sysdiag'){
    document.querySelectorAll('.alarm-toolbar button').forEach((b,i)=>{
      b.dataset.action=['sys-current','sys-buffer','sys-log','sys-archive'][i] || 'sys-current';
    });
  }

  if(name==='topology'){
    const map=document.getElementById('topologyMap');
    const nodes=['PLC','HMI','SCALANCE X1','ET200SP-1','ET200SP-2','Robot LAN','Safety PLC','Drive IO'];
    map.innerHTML=nodes.map((n,i)=>`<button class="topology-node ${i===0?'root':''}" data-action="topology-node" data-label="${n}">${n}<span>${i===0?'172.20.10.10':'172.20.10.'+(20+i)}</span></button>`).join('<div class="topology-link"></div>');
  }

  if(name==='snmp') renderSnmp();

  if(name==='sequencers'){
    document.querySelectorAll('.sequence-card').forEach(card=>{
      const id=card.dataset.id;
      const seq=state.sequences[id] || {step:1,running:false};
      card.innerHTML=`<div class="section-title">sequence control ${id}</div>
        <div class="sequence-tools"><span>${seq.running?'RUN':'AUTO'} · Step ${seq.step}</span>
        <button class="hmi-btn" data-action="seq-run" data-id="${id}">▶</button>
        <button class="hmi-btn" data-action="seq-step" data-id="${id}">Step</button>
        <button class="hmi-btn" data-action="seq-reset" data-id="${id}">Reset</button></div>
        <div class="sequence-line">S 001 &nbsp; S_Init: Grundstellung</div>
        <div class="sequence-line">S 002 &nbsp; S_FRG1: Release ${id}</div>`;
    });
  }

  if(name==='robot') renderRobotRows();
  if(name==='process') renderProcessRows();

  if(name==='global'){
    const cols=[
      ['115010R01FM Total','115010R01FM2 Drop 115020V01','115020R02FM Welding 115020V01','115030R01FM Pick 115040UQ1'],
      ['115070R01FM Total','115070R01FM Welding 115070V01','115080R01FM Drop 125090UQ2','115080R01FM Pick 115070V01'],
      ['135110R01FM Total','135110R01FM Pick 125090UQ2','135110R01FM Welding 135100R01','135120V01FM Load Small Part'],
      ['135120R03FM Total','135120R03FM1 Welding 135120V01','135120R02FM Welding 135120V01','135130R01FM Pick 135120V01']
    ];
    document.getElementById('globalGrid').innerHTML=cols.map(c=>`<div class="global-card"><h4>status</h4>${c.map(x=>`<button data-action="global-state">${x}</button>`).join('')}</div>`).join('');
  }

  if(name==='alarms'){
    renderAlarms();
    document.querySelectorAll('#screenHost .alarm-toolbar button').forEach((b,i)=>{
      b.dataset.action=['alarm-current','alarm-buffer','alarm-log','alarm-archive'][i] || 'alarm-current';
    });
  }
}

function handleAction(button){
  const action=button.dataset.action;
  if(!action) return;

  if(action==='station'){
    state.selectedStation=button.dataset.station;
    document.querySelectorAll('.footer-nav .cell').forEach(b=>b.classList.toggle('active-yellow',b===button));
    toast(`Station ${state.selectedStation} selected`);
    return;
  }
  if(action==='station-prev' || action==='station-next'){
    toast(action==='station-prev'?'Previous station group':'Next station group'); return;
  }
  if(action==='toggle-preselection'){
    button.classList.toggle('active-green');
    button.classList.remove('blue');
    toast(`${button.dataset.label}: ${button.classList.contains('active-green')?'preselected':'not preselected'}`); return;
  }
  if(action==='control-voltage'){
    state.controlVoltage=!state.controlVoltage;
    button.textContent=state.controlVoltage?'On':'Off';
    button.classList.toggle('active-green',state.controlVoltage);
    toast(`Control voltage ${state.controlVoltage?'ON':'OFF'} — training state only`); return;
  }
  if(action==='segmented-choice'){
    setActiveChoice(button,'.segmented'); toast(`${button.textContent.trim()} selected`); return;
  }
  if(action==='op-command'){
    const row=button.closest('.op-row');
    const label=button.textContent.trim();
    if(label==='Stop'){
      row.querySelectorAll('[data-action="op-command"]').forEach(b=>b.classList.remove('active-green','red'));
      button.classList.add('red');
    } else if(label==='Start' || label==='Automatic' || label==='Manual') {
      row.querySelectorAll('[data-action="op-command"]').forEach(b=>b.classList.remove('active-green','red'));
      button.classList.add('active-green');
    }
    toast(`${row.dataset.station}: ${label}`); return;
  }
  if(action==='op-mode' || action==='op-status'){
    toast(`${button.closest('.op-row').dataset.station}: ${button.textContent.trim()} status`); return;
  }
  if(action==='station-detail'){ toast(`Station ${button.dataset.station} selected`); return; }
  if(action==='stats-reset'){ toast('Training counter reset'); return; }
  if(action==='stats-cycle' || action==='stats-sequence'){
    document.querySelectorAll('.stats-toolbar button').forEach(b=>b.classList.remove('active-yellow'));
    button.classList.add('active-yellow'); toast(button.textContent.trim()); return;
  }
  if(action==='profinet-device'){ toast(`${button.dataset.label} — connection OK`); return; }
  if(action.startsWith('sys-')){
    const box=document.querySelector('.large-table .empty');
    const map={ 'sys-current':'No active system alarms in this training state.', 'sys-buffer':'Alarm buffer: 2 historical training messages.', 'sys-log':'Training alarm log opened.', 'sys-archive':'Archive management simulated.' };
    if(box) box.textContent=map[action]; toast(map[action]); return;
  }
  if(action==='topology-node'){
    document.querySelectorAll('.topology-node').forEach(b=>b.classList.remove('active-green'));
    button.classList.add('active-green');
    document.getElementById('topologyInfo').textContent=`${button.dataset.label}: simulated connection healthy.`; return;
  }
  if(action==='snmp-device'){
    state.selectedSnmp=Number(button.dataset.device); renderSnmp(); toast(`SNMP device ${button.dataset.device} selected`); return;
  }
  if(action==='snmp-prev'){ state.snmpPage=0; state.selectedSnmp=null; renderSnmp(); return; }
  if(action==='snmp-next'){ state.snmpPage=1; state.selectedSnmp=null; renderSnmp(); return; }
  if(action==='snmp-read'){ toast(state.selectedSnmp?`Read device ${state.selectedSnmp}: OK`:'Select an SNMP device first'); return; }
  if(action==='snmp-reset'){ toast(state.selectedSnmp?`Status reset for device ${state.selectedSnmp}`:'Select an SNMP device first'); return; }
  if(action==='seq-run' || action==='seq-step' || action==='seq-reset'){
    const id=button.dataset.id; const seq=state.sequences[id] || {step:1,running:false};
    if(action==='seq-run') seq.running=!seq.running;
    if(action==='seq-step') seq.step=Math.min(99,seq.step+1);
    if(action==='seq-reset'){ seq.step=1; seq.running=false; }
    state.sequences[id]=seq; initScreen('sequencers'); toast(`${id}: ${action.replace('seq-','')}`); return;
  }
  if(action==='robot-overview'){
    state.robotOverview=Number(button.dataset.page);
    document.querySelectorAll('[data-action="robot-overview"]').forEach(b=>b.classList.toggle('active-yellow',b===button));
    renderRobotRows(); return;
  }
  if(action==='robot-ack'){
    state.robotFaultAcknowledged=true;
    document.getElementById('alarmText1').textContent='TRAINING: Robot fault acknowledged — fault remains active.';
    toast('Robot fault acknowledged'); return;
  }
  if(action==='robot-correction'){ toast('Robot correction training view selected'); return; }
  if(action==='robot-archive'){ toast('Robot archive training view selected'); return; }
  if(action==='robot-detail'){ toast(`${button.dataset.robot}: robot detail/IO faceplate`); return; }
  if(action==='robot-toggle'){ button.classList.toggle('active-green'); toast(button.textContent.trim()); return; }
  if(action==='robot-indicator'){ toast(`${button.textContent.trim()} status indicator`); return; }
  if(action==='robot-auto' || action==='robot-start' || action==='robot-stop'){
    const row=button.closest('.robot-row'); const id=row.dataset.robot;
    if(id==='115010R01' && state.robotFault && action!=='robot-stop'){
      toast(`${id}: start inhibited by training fault`); return;
    }
    state.robotModes[id]=action==='robot-stop'?'stop':action==='robot-start'?'start':'auto';
    renderRobotRows(); toast(`${id}: ${state.robotModes[id]}`); return;
  }
  if(action==='sequence-open'){ toast(`${button.closest('.robot-row').dataset.robot}: Sequence 125 selected`); return; }
  if(action==='process-overview'){
    state.processOverview=Number(button.dataset.page);
    document.querySelectorAll('[data-action="process-overview"]').forEach(b=>b.classList.toggle('active-yellow',b===button));
    renderProcessRows(); return;
  }
  if(action==='process-ack'){ toast('Process-device kickout acknowledged'); return; }
  if(action==='process-detail'){ toast(`${button.dataset.process}: process-device faceplate`); return; }
  if(action==='process-mode'){
    const row=button.closest('.process-row'); const id=row.dataset.process;
    state.processModes[id]=button.dataset.mode;
    row.querySelectorAll('[data-action="process-mode"]').forEach(b=>b.classList.remove('active-green'));
    button.classList.add('active-green'); toast(`${id}: ${button.textContent.trim()}`); return;
  }
  if(action==='global-state'){ button.classList.toggle('active-green'); toast(button.textContent.trim()); return; }
  if(action==='alarm-current' || action==='alarm-buffer' || action==='alarm-log' || action==='alarm-archive'){
    state.alarmView=action.replace('alarm-','');
    document.querySelectorAll('#screenHost .alarm-toolbar button').forEach(b=>b.classList.remove('active-yellow'));
    button.classList.add('active-yellow'); renderAlarms(); toast(button.textContent.trim()); return;
  }
  if(action==='launch-tia'){ document.getElementById('applicationsInfo').textContent='TIA Portal launch simulated. No external engineering software is opened by this trainer.'; return; }
  if(action==='launch-eplan'){ document.getElementById('applicationsInfo').textContent='Eplan PDF selection simulated.'; return; }
  if(action==='project-info'){ document.getElementById('adminInfo').textContent='Project: HMI Training Simulator · Browser simulation · No PLC writes.'; return; }
  if(action==='clean-screen'){ document.getElementById('adminInfo').textContent='Clean-screen mode simulated. Controls remain available in training.'; return; }
  if(action==='end-wincc'){ toast('Exit command intentionally disabled in training simulator'); return; }
  if(action==='maintenance-cell'){ toast('Maintenance cell training function selected'); return; }
  if(action==='tech'){ toast(`${button.dataset.label}: technology detail selected`); return; }
  if(action==='interface'){ toast('Interface ARG2 selected'); return; }
}

document.addEventListener('click',event=>{
  const nav=event.target.closest('[data-nav]');
  if(nav){ render(nav.dataset.nav); return; }
  const action=event.target.closest('[data-action]');
  if(action) handleAction(action);
});

document.getElementById('ackBtn').addEventListener('click',()=>{
  state.robotFaultAcknowledged=true;
  document.getElementById('alarmText1').textContent=state.robotFault?'TRAINING: Robot fault acknowledged — fault remains active.':'No active training alarms.';
  toast('Alarm acknowledged');
});

function tick(){
  const d=new Date(); const date=d.toLocaleDateString(); const time=d.toLocaleTimeString();
  document.getElementById('dateText').textContent=date;
  document.getElementById('timeText').textContent=time;
  document.getElementById('alarmDate1').textContent=date;
  document.getElementById('alarmDate2').textContent=date;
  document.getElementById('alarmTime1').textContent=time;
  document.getElementById('alarmTime2').textContent=time;
}
tick(); setInterval(tick,1000); render('main');

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
