const $=id=>document.getElementById(id);
const SU=['♠','♥','♦','♣'],RK=['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
let deck=[],P=[],D=[],hide=true,over=true;

function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));window.scrollTo(0,0)}
function mk(){deck=[];SU.forEach(s=>RK.forEach(r=>deck.push({s,r})));for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}}
function val(h){let t=0,a=0;h.forEach(c=>{if(c.r==='A'){a++;t+=11}else t+=['J','Q','K'].includes(c.r)?10:+c.r});while(t>21&&a){t-=10;a--}return t}
function cardEl(c,back){const d=document.createElement('div');if(back){d.className='card back';d.textContent='?';return d}
d.className='card'+(c.s==='♥'||c.s==='♦'?' red':'');d.innerHTML='<span>'+c.r+'</span><span class="s">'+c.s+'</span><span class="r2">'+c.r+'</span>';return d}

let shownP=99,shownD=99;
function sync(box,cards,hideIdx){
 while(box.children.length>cards.length)box.lastChild.remove();
 cards.forEach((c,i)=>{
  const ch=box.children[i],isBack=hideIdx===i;
  if(!ch){
   const e=cardEl(c,isBack);
   e.classList.add('fade-in');
   box.appendChild(e);
  } else {
   const shouldBeBack=isBack;
   const isCurrentlyBack=ch.classList.contains('back');
   if(shouldBeBack!==isCurrentlyBack){
    const e=cardEl(c,shouldBeBack);e.classList.add('flip');box.replaceChild(e,ch);
   } else if(!shouldBeBack&&(ch.querySelector('span')&&ch.querySelector('span').textContent!==c.r)){
    const e=cardEl(c,false);box.replaceChild(e,ch);
   }
  }
 });
}

function draw(){
 const p=P.slice(0,shownP),d=D.slice(0,shownD);
 sync($('ph'),p,-1);sync($('dh'),d,hide?1:-1);
 $('ps').textContent=val(p);$('ds').textContent=hide?(d.length?'?':'0'):val(d);
}

function setBtn(on){$('hit').disabled=!on;$('stand').disabled=!on}

function deal(){
 mk();P=[deck.pop(),deck.pop()];D=[deck.pop(),deck.pop()];hide=true;over=true;shownP=0;shownD=0;
 $('ph').innerHTML='';$('dh').innerHTML='';$('status').textContent='กำลังแจกไพ่...';setBtn(false);show('game');draw();
 [['P',1],['D',1],['P',2],['D',2]].forEach((s,i)=>setTimeout(()=>{if(s[0]==='P')shownP=s[1];else shownD=s[1];draw();sfx.card()},450+i*600));
 setTimeout(()=>{over=false;$('status').textContent='ตาของคุณ: จั่วหรือหยุด?';setBtn(true);if(val(P)===21)stand()},450+4*600);
}

function finish(res,msg){
 over=true;hide=false;draw();setBtn(false);$('status').textContent=msg;
 setTimeout(()=>sfx[res](),200);
 setTimeout(()=>{
  if(res==='win'){$('winMsg').textContent=msg;show('win')}
  else if(res==='lose'){$('loseMsg').textContent=msg;show('lose')}
  else show('draw');
 },1600);
}

function hit(){if(over)return;P.push(deck.pop());shownP=P.length;draw();sfx.card();const v=val(P);
 if(v>21)finish('lose','แต้มของคุณ '+v+' เกิน 21 คุณแพ้!');else if(v===21)stand()}

function stand(){if(over)return;setBtn(false);over=true;hide=false;shownD=D.length;draw();$('status').textContent='บอทกำลังเล่น...';
 (function step(){
  if(val(D)<17){setTimeout(()=>{D.push(deck.pop());shownD=D.length;draw();sfx.card();step()},800);return}
  const p=val(P),d=val(D);
  if(d>21)finish('win','บอทแต้มเกิน 21 ('+d+') คุณชนะ!');
  else if(p>d)finish('win','คุณ '+p+' แต้ม ชนะบอท '+d+' แต้ม!');
  else if(p<d)finish('lose','คุณ '+p+' แต้ม แพ้บอท '+d+' แต้ม');
  else finish('draw','เสมอกัน '+p+' แต้ม');
 })()}

/* ===== จัดการข้อมูล JSON ===== */
let currentUser='', currentDateStr='';

$('mk').onclick=()=>{
 const nameVal=$('fullName').value.trim();
 if(!nameVal){$('err').textContent='กรุณากรอกชื่อ-นามสกุล';return}
 $('err').textContent='';
 currentUser=nameVal;
 
 // กำหนดวันที่ทำกิจกรรม (รูปแบบ YYYY-MM-DD)
 const now=new Date();
 currentDateStr=now.toISOString().split('T')[0];

 show('result');
};

$('dl').onclick=()=>{
 const m=$('dlMsg');

 try{
  if(!currentUser) throw new Error('no name');

  // สร้างเฉพาะ Portfolio Items
  const portfolioItems=[
   {
    id:'item-001',
    title:'blackjack',
    type:'Challenge',
    date:currentDateStr,
    role:'User',
    description:'Play Blackjack activity',
    skills:[
     'Thinking and planning'
    ],
    reflection:{
     whatIDid:'play blackjack',
     whatILearned:'Thinking and planning',
     challenge:'Win the game',
     nextStep:'Win as much as possible.'
    },
    evidence:[
     'https://anuntacahi-fangtun.github.io/Blackjack/'
    ]
   }
  ];

  // แปลงข้อมูลเป็น JSON
  const blob=new Blob(
   [JSON.stringify(portfolioItems,null,2)],
   {type:'application/json'}
  );

  // สร้างลิงก์ดาวน์โหลด
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');

  a.href=url;
  a.download='portfolio-items-blackjack-'+
   currentUser.replace(/[\\/:*?"<>|\s]+/g,'_')+
   '.json';

  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(()=>URL.revokeObjectURL(url),1000);

  m.textContent='ดาวน์โหลด Portfolio Items JSON สำเร็จเรียบร้อย!';

 }catch(e){
  m.textContent='ไม่สามารถสร้างไฟล์ได้ กรุณาลองใหม่อีกครั้ง';
 }
};

/* ===== เสียง (Web Audio) ===== */
let ac,master,mus,fx,muted=false,nextT=0,bar=0,timer=null;
const hz=m=>440*Math.pow(2,(m-69)/12);
function initAudio(){
 if(ac){if(ac.state==='suspended')ac.resume();return}
 try{ac=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return}
 master=ac.createGain();master.gain.value=muted?0:1;master.connect(ac.destination);
 mus=ac.createGain();mus.gain.value=.13;mus.connect(master);
 fx=ac.createGain();fx.gain.value=.5;fx.connect(master);
 nextT=ac.currentTime+.1;sched();timer=setInterval(sched,1000);
}
function note(f,t,d,type,vol,dest,lp){
 const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;
 let out=o;if(lp){const b=ac.createBiquadFilter();b.type='lowpass';b.frequency.value=lp;o.connect(b);out=b}
 out.connect(g);g.connect(dest);
 g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+Math.min(.04,d/3));g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.start(t);o.stop(t+d+.05);
}
const CH=[[57,60,64],[53,57,60],[48,52,55],[55,59,62]];
function sched(){
 if(!ac)return;
 while(nextT<ac.currentTime+2.5){
  const c=CH[bar%4],BL=2.4;
  c.forEach(m=>{note(hz(m),nextT,BL,'sawtooth',.18,mus,500);note(hz(m)*1.004,nextT,BL,'triangle',.2,mus,700)});
  note(hz(c[0]-12),nextT,BL*.95,'sine',.5,mus);
  for(let i=0;i<8;i++){const m=c[i%3]+(i%4===3?24:12);note(hz(m),nextT+i*.3,.28,'triangle',.22,mus)}
  nextT+=BL;bar++;
 }
}
function tone(f,d,type,vol,to,delay){
 if(!ac)return;const t=ac.currentTime+(delay||0),o=ac.createOscillator(),g=ac.createGain();
 o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
 o.connect(g);g.connect(fx);g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.start(t);o.stop(t+d+.05);
}
function swish(){
 if(!ac)return;const n=Math.floor(ac.sampleRate*.12),b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);
 for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n);
 const s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();
 s.buffer=b;f.type='bandpass';f.frequency.value=2500;g.gain.value=.5;s.connect(f);f.connect(g);g.connect(fx);s.start();
}
const sfx={
 click(){tone(880,.09,'square',.25,1500)},
 card(){swish();tone(260,.1,'triangle',.4,120)},
 win(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.35,'square',.22,0,i*.12))},
 lose(){[400,320,250,160].forEach((f,i)=>tone(f,.4,'sawtooth',.25,f*.8,i*.2))},
 draw(){tone(440,.25,'triangle',.4,0,0);tone(440,.25,'triangle',.4,0,.3)}
};

document.addEventListener('click',e=>{initAudio();if(e.target.closest('.btn'))sfx.click()});
$('snd').onclick=()=>{
 muted=!muted;if(master)master.gain.value=muted?0:1;
 $('snd').textContent=muted?'🔇 เสียง: ปิด':'🔊 เสียง: เปิด';
};

/* ===== ปุ่มและการควบคุมอื่นๆ ===== */
$('startBtn').onclick=deal;
$('hit').onclick=hit;
$('stand').onclick=stand;
$('again1').onclick=$('again2').onclick=$('again3').onclick=deal;
$('quit').onclick=()=>show('bye');
$('home').onclick=()=>{history.replaceState(null,'',location.pathname+location.search);show('start')};