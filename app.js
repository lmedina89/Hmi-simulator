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
  sequencers:'AS 031',
  robot:'Roboter 014',
  process:'Rob-Prozessgeräte 015',
  global:'GlobalStatus 017',
  alarms:'ProDiag_Meldeanzeigen'
};

const state = { robotFault:true, controlVoltage:true };

function bindNav(scope=document){
  scope.querySelectorAll('[data-nav]').forEach(btn=>{
    btn.addEventListener('click',()=>render(btn.dataset.nav));
  });
}

function render(name){
  const tpl = document.getElementById(`screen-${name}`);
  if(!tpl) return;
  host.innerHTML = '';
  host.appendChild(tpl.content.cloneNode(true));
  title.textContent = names[name] || name;
  bindNav(host);
  initScreen(name);
}

function makeModePanel(cell){
  const labels=['Stop at end of cycle','line stop','Line Empty','Production w/o part','Creep speed'];
  return `<div class="section-title">Vorwahlen ${cell}</div>` +
    labels.map((label,i)=>`<div class="mode-row">
      <button class="hmi-btn ${i===2?'blue':''}">Pre-set</button>
      <div class="label">${label}</div>
    </div>`).join('');
}

function opRow(id){
  return `<div class="op-row">
    <button class="hmi-btn yellow">${id}</button>
    <button class="hmi-btn">E2</button>
    <button class="hmi-btn red">E Stop</button>
    <button class="hmi-btn active-green">operator safety</button>
    <button class="hmi-btn red">Controls</button>
    <button class="hmi-btn red">Start conditions</button>
    <button class="hmi-btn">Hold</button>
    <button class="hmi-btn">Manual</button>
    <button class="hmi-btn active-green">Automatic</button>
    <button class="hmi-btn">Stop</button>
    <button class="hmi-btn active-green">Start</button>
  </div>`;
}

function robotRow(id,fault=false){
  return `<div class="robot-row">
    <button class="hmi-btn yellow">${id}</button>
    <button class="hmi-btn">Without Robot</button>
    <button class="hmi-btn">E2</button>
    <button class="hmi-btn ${fault?'red':'active-green'}">Auto</button>
    <button class="hmi-btn ${fault?'':'active-green'}">PF0</button>
    <button class="hmi-btn ${fault?'':'active-green'}">MaSi</button>
    <button class="hmi-btn ${fault?'':'active-green'}">Drives</button>
    <button class="hmi-btn ${fault?'':'active-green'}">FK</button>
    <button class="hmi-btn">Sequence 125</button>
    <button class="hmi-btn">Start</button>
    <button class="hmi-btn">Stop</button>
  </div>`;
}

function processRow(id){
  return `<div class="process-row">
    <button class="hmi-btn yellow">${id}</button>
    <button class="hmi-btn">Without Process</button>
    <button class="hmi-btn">VW</button>
    <button class="hmi-btn">MAX</button>
    <button class="hmi-btn">FLT</button>
    <button class="hmi-btn">ZI</button>
    <button class="hmi-btn">Without Force</button>
    <button class="hmi-btn">milling</button>
    <button class="hmi-btn">Maintenance</button>
  </div>`;
}

function initScreen(name){
  if(name==='plant'){
    document.querySelectorAll('.robot-icon').forEach(el=>{
      el.addEventListener('click',()=>{
        document.getElementById('deviceInfo').textContent =
          `${el.dataset.device} selected — simulated detail/faceplate would open here.`;
      });
    });
  }

  if(name==='preselection'){
    document.querySelectorAll('.mode-panel').forEach(el=>{
      el.innerHTML = makeModePanel(el.dataset.cell);
    });
    const cv = document.getElementById('controlVoltage');
    cv.addEventListener('click',()=>{
      state.controlVoltage = !state.controlVoltage;
      cv.textContent = state.controlVoltage ? 'On' : 'Off';
      cv.classList.toggle('active-green', state.controlVoltage);
    });
  }

  if(name==='operating'){
    const ids=['11','115000','115050','12','13','135100'];
    document.getElementById('operatingRows').innerHTML = ids.map(opRow).join('');
  }

  if(name==='diagnostics'){
    const d = new Date();
    ['diagDate1','diagDate2'].forEach(id=>document.getElementById(id).textContent=d.toLocaleDateString());
    ['diagTime1','diagTime2'].forEach(id=>document.getElementById(id).textContent=d.toLocaleTimeString());
  }

  if(name==='profinet'){
    const data = Array.from({length:20},(_,i)=>({
      name:`TRAINCELL---B1S1---DEV${String(i+1).padStart(2,'0')}`,
      ip:`172.20.10.${20+i}`
    }));
    document.getElementById('profinetGrid').innerHTML = data.map(x=>`
      <div class="profi-card"><span class="profi-ok"></span><strong>${x.name}</strong><br>${x.ip}</div>
    `).join('');
  }

  if(name==='sequencers'){
    document.querySelectorAll('.sequence-card').forEach(card=>{
      const id = card.dataset.id;
      card.innerHTML = `<div class="section-title">sequence control ${id}</div>
        <div style="padding:6px;font-size:11px">AUTO</div>
        <div style="padding:4px;font-size:10px">S 001 &nbsp; S_Init: Grundstellung</div>
        <div style="padding:4px;font-size:10px">S 002 &nbsp; S_FRG1: Release ${id}</div>`;
    });
  }

  if(name==='robot'){
    const ids=['115010R01','115020R01','115050R02','115060R01','115070R01','135100R01'];
    document.getElementById('robotRows').innerHTML = ids.map((id,i)=>robotRow(id,i===0 && state.robotFault)).join('');
  }

  if(name==='process'){
    const ids=['115020R01KE1','115020R01KW1','115020R02KE1','115020R02KW1','115070R01KE1','115070R01KW1'];
    document.getElementById('processRows').innerHTML = ids.map(processRow).join('');
  }

  if(name==='global'){
    const cols = [
      ['115010R01FM Total','115010R01FM2 Drop 115020V01','115020R02FM Welding 115020V01','115030R01FM Pick 115040UQ1'],
      ['115070R01FM Total','115070R01FM Welding 115070V01','115080R01FM Drop 125090UQ2','115080R01FM Pick 115070V01'],
      ['135110R01FM Total','135110R01FM Pick 125090UQ2','135110R01FM Welding 135100R01','135120V01FM Load Small Part'],
      ['135120R03FM Total','135120R03FM1 Welding 135120V01','135120R02FM Welding 135120V01','135130R01FM Pick 135120V01']
    ];
    document.getElementById('globalGrid').innerHTML = cols.map(c=>`
      <div class="global-card"><h4>status</h4>${c.map(x=>`<div>${x}</div>`).join('')}</div>
    `).join('');
  }

  if(name==='alarms'){
    const rows=[];
    for(let i=0;i<24;i++){
      const red = i>=8 && i<=18;
      rows.push(`<div class="alarm-line ${red?'red-line':'yellow-line'}">
        <span>12:17:${String(20+i).padStart(2,'0')}</span>
        <span>8/3/2026</span>
        <span>K</span>
        <span>${red?'TRAINING fault: device/interlock condition active':'TRAINING warning: PROFIenergy / station message'}</span>
      </div>`);
    }
    document.getElementById('alarmList').innerHTML = rows.join('');
  }
}

document.getElementById('ackBtn').addEventListener('click',()=>{
  document.getElementById('alarmText1').textContent =
    state.robotFault ? 'TRAINING: Robot fault acknowledged — fault remains active.' : 'No active training alarms.';
});

bindNav();

function tick(){
  const d = new Date();
  const date = d.toLocaleDateString();
  const time = d.toLocaleTimeString();
  document.getElementById('dateText').textContent = date;
  document.getElementById('timeText').textContent = time;
  document.getElementById('alarmDate1').textContent = date;
  document.getElementById('alarmDate2').textContent = date;
  document.getElementById('alarmTime1').textContent = time;
  document.getElementById('alarmTime2').textContent = time;
}
tick();
setInterval(tick,1000);
render('main');

/* v0.3 — fit the entire fixed-resolution HMI inside the actually visible browser area.
   The HMI itself stays 1280x720; only the outer shell is scaled/translated. */
const HMI_DESIGN_WIDTH = 1280;
const HMI_DESIGN_HEIGHT = 720;

let fitFrame = 0;

function getVisibleViewport(){
  const vv = window.visualViewport;
  return {
    width: vv?.width || document.documentElement.clientWidth || window.innerWidth,
    height: vv?.height || document.documentElement.clientHeight || window.innerHeight,
    offsetLeft: vv?.offsetLeft || 0,
    offsetTop: vv?.offsetTop || 0
  };
}

function getBrowserSafeInsets(view){
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const landscape = view.width > view.height;
  const compactMobile = coarsePointer && landscape && view.width <= 1100 && view.height <= 520;

  // iPhone in-app browsers can draw large controls ON TOP of the webpage instead
  // of subtracting them from visualViewport. Reserve a little room on those views.
  if(compactMobile){
    return { top: 62, right: 10, bottom: 16, left: 10 };
  }
  return { top: 6, right: 6, bottom: 6, left: 6 };
}

function scaleHMI(){
  cancelAnimationFrame(fitFrame);
  fitFrame = requestAnimationFrame(()=>{
    const shell = document.getElementById('hmiShell');
    const viewportEl = document.getElementById('hmiViewport');
    if(!shell || !viewportEl) return;

    const view = getVisibleViewport();
    if(!view.width || !view.height) return;

    // Track the visual viewport itself so browser zoom/toolbar movement cannot
    // leave the HMI centered in a stale layout viewport.
    viewportEl.style.left = `${view.offsetLeft}px`;
    viewportEl.style.top = `${view.offsetTop}px`;
    viewportEl.style.width = `${view.width}px`;
    viewportEl.style.height = `${view.height}px`;

    const inset = getBrowserSafeInsets(view);
    const availableWidth = Math.max(1, view.width - inset.left - inset.right);
    const availableHeight = Math.max(1, view.height - inset.top - inset.bottom);

    const scale = Math.min(
      availableWidth / HMI_DESIGN_WIDTH,
      availableHeight / HMI_DESIGN_HEIGHT
    );

    const scaledWidth = HMI_DESIGN_WIDTH * scale;
    const scaledHeight = HMI_DESIGN_HEIGHT * scale;

    // Center inside the safe visible rectangle. Letterboxing is intentional.
    const x = inset.left + (availableWidth - scaledWidth) / 2;
    const y = inset.top + (availableHeight - scaledHeight) / 2;

    document.documentElement.style.setProperty('--hmi-scale', scale.toFixed(6));
    document.documentElement.style.setProperty('--hmi-x', `${x.toFixed(2)}px`);
    document.documentElement.style.setProperty('--hmi-y', `${y.toFixed(2)}px`);
  });
}

function queueFit(){
  scaleHMI();
  // iOS reports a few viewport sizes while rotating/showing browser chrome.
  setTimeout(scaleHMI, 80);
  setTimeout(scaleHMI, 240);
  setTimeout(scaleHMI, 600);
}

window.addEventListener('resize', queueFit, {passive:true});
window.addEventListener('orientationchange', queueFit, {passive:true});
window.addEventListener('pageshow', queueFit, {passive:true});
if(window.visualViewport){
  window.visualViewport.addEventListener('resize', scaleHMI, {passive:true});
  window.visualViewport.addEventListener('scroll', scaleHMI, {passive:true});
}
queueFit();
