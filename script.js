/* audio.js - backsound + efek suara (WebAudio, tanpa file mp3) */
const SFX=(()=>{
let ac,mg,mus,sx,nb,muted=false,want=null,cur=null,tm=null,st=0,nx=0;
try{muted=localStorage.getItem('fa_mute')=='1'}catch(e){}
const f=n=>440*Math.pow(2,n/12);
const BPM={menu:84,stage:132,boss:168};
const CH=[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]],RT=[-24,-28,-21,-26];   // Am F C G
const CM=[[0,3,7],[0,3,7],[-4,0,3],[-2,2,5]],RM=[-24,-24,-28,-26];    // boss: lebih gelap

function init(){
 if(ac){if(ac.state=='suspended')ac.resume();return}
 const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
 ac=new C();mg=ac.createGain();mg.gain.value=muted?0:1;mg.connect(ac.destination);
 mus=ac.createGain();mus.gain.value=.2;mus.connect(mg);
 sx=ac.createGain();sx.gain.value=.55;sx.connect(mg);
 nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);
 const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
 if(want){const w=want;cur=null;scene(w)}}

function tone(fr,du,ty,v,dest,t,to){if(!ac)return;t=t||ac.currentTime;
 const o=ac.createOscillator(),g=ac.createGain();o.type=ty;o.frequency.setValueAtTime(fr,t);
 if(to)o.frequency.exponentialRampToValueAtTime(to,t+du);
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+du);
 o.connect(g);g.connect(dest||sx);o.start(t);o.stop(t+du+.02)}
function noise(du,v,fq,dest,t){if(!ac)return;t=t||ac.currentTime;
 const s=ac.createBufferSource(),h=ac.createBiquadFilter(),g=ac.createGain();
 s.buffer=nb;h.type='highpass';h.frequency.value=fq;
 g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+du);
 s.connect(h);h.connect(g);g.connect(dest||sx);s.start(t);s.stop(t+Math.min(du,.95))}

function stepM(t,d){const b=(st>>3)&3,i=st&7;
 if(cur=='menu'){
  if(i==0)CH[b].forEach(n=>tone(f(n),d*8,'sine',.3,mus,t));
  if(i%2==0)tone(f(CH[b][(i/2)%3]+12),d*1.8,'triangle',.45,mus,t);
 }else if(cur=='stage'){
  tone(f(RT[b]+(i%2?12:0)),d*.9,'square',.3,mus,t);
  tone(f(CH[b][i%3]+12),d*.8,'triangle',.45,mus,t);
  if(i==0||i==4)tone(130,.14,'sine',.9,mus,t,40);
  if(i%2)noise(.04,.22,7000,mus,t);
  if(i==0||i==3||i==6)tone(f(CH[b][i%3]+24),d*1.4,'square',.14,mus,t);
 }else if(cur=='boss'){
  tone(f(RM[b]+(i%4==3?7:0)),d*.95,'sawtooth',.32,mus,t);
  if(i%2==0)tone(130,.12,'sine',.9,mus,t,40);
  if(i==2||i==6)noise(.1,.4,1500,mus,t);
  if(i%2)noise(.03,.18,8000,mus,t);
  if(i==0||i==3||i==5)tone(f(CM[b][i%3]+12),d*1.2,'sawtooth',.2,mus,t);
 }}

function scene(name){want=name;if(!ac||cur===name)return;cur=name;
 clearInterval(tm);tm=null;
 if(name=='win'){[0,4,7,12,7,12,16,19].forEach((n,i)=>tone(f(n+3),.28,'square',.35,sx,ac.currentTime+i*.13));return}
 if(!BPM[name])return;
 st=0;nx=ac.currentTime+.1;
 tm=setInterval(()=>{const d=60/BPM[cur]/2;while(nx<ac.currentTime+.2){stepM(nx,d);nx+=d;st++}},50)}

function play(n,x){if(!ac||muted)return;const t=ac.currentTime;
 switch(n){
  case 'click':tone(700,.06,'square',.3);break;
  case 'shoot':x?tone(1300,.1,'sawtooth',.3,0,0,300):tone(900,.09,'square',.25,0,0,220);break;
  case 'jump':tone(260,.16,'square',.3,0,0,640);break;
  case 'drop':tone(420,.13,'square',.25,0,0,140);break;
  case 'kill':noise(.16,.5,1200);tone(600,.16,'triangle',.4,0,0,100);break;
  case 'hurt':tone(320,.4,'sawtooth',.5,0,0,60);noise(.25,.5,400);break;
  case 'block':tone(1200,.09,'sine',.4,0,0,1900);break;
  case 'power':[0,4,7,12].forEach((k,i)=>tone(f(k+3),.12,'square',.3,0,t+i*.06));break;
  case 'heart':tone(f(7),.1,'triangle',.5);tone(f(14),.2,'triangle',.5,0,t+.1);break;
  case 'bosshit':noise(.08,.4,2500);tone(160,.1,'square',.3,0,0,60);break;
  case 'bossdie':noise(.95,.7,300);tone(500,.9,'sawtooth',.45,0,0,40);break;
  case 'warn':for(let i=0;i<4;i++)tone(i%2?440:660,.25,'square',.35,0,t+i*.27);break;
  case 'over':[7,4,0,-5].forEach((k,i)=>tone(f(k),.35,'triangle',.5,0,t+i*.22));break;
  case 'combo':tone(f(10+Math.min(x||0,8)*2),.1,'square',.2);break;
 }}

function toggle(){muted=!muted;try{localStorage.setItem('fa_mute',muted?'1':'0')}catch(e){}
 if(mg)mg.gain.value=muted?0:1;return muted}
document.addEventListener('visibilitychange',()=>{if(!ac)return;document.hidden?ac.suspend():ac.resume()});
['pointerdown','keydown','touchstart'].forEach(e=>addEventListener(e,init,{passive:true}));
return{init,scene,play,toggle,get muted(){return muted}}})();
const $=s=>document.querySelector(s);
const PAL={y:'#ffd93b',s:'#d6c7d9',k:'#ff3350',w:'#1a1530',b:'#3d3166',r:'#e02b2b',d:'#262626',g:'#6b8f8a',K:'#8a4f00',L:'#ffffff',M:'#ffe27a',F:'#ff7a1a',G:'#ffc02e',H:'#fff6b0',R:'#d63a1a',Y:'#ffd93b',W:'#ffffff',X:'#dff0ff',E:'#2a5bd9',S:'#ffe3bd'};
function mk(m,white){const c=document.createElement('canvas');c.width=m[0].length;c.height=m.length;const x=c.getContext('2d');
 m.forEach((r,j)=>[...r].forEach((ch,i)=>{if(PAL[ch]){x.fillStyle=PAL[ch];x.fillRect(i,j,1,1)}}));
 if(white){x.globalCompositeOperation='source-in';x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height)}return c}
const ANG=["....yyyyyy....","...yyyyyyyy...","..yyssssssyy..","..yskssskssy..","..yssssssssy..","..yyssssssyy..","bbyywwwwwwyybb","bbywwwwwwwwybb","bbywwwwwwwwybb",".byywwwwwwyyb.","..yywwwwwwyy..","..yy.wwww.yy..","...y.wwww.y...","....ss..ss...."];
const IMP=["..r......r..","..rrrrrrrr..","..rrkrrkrr..","ddrrrrrrrrdd","dddrrrrrrddd",".dddrrrrddd.","..d.rrrr.d..","....rrrr....","...rr..rr...","...rr..rr.rr"];
const STR=["....KK....","...KyyK...","KKKKyyKKKK",".KyyyyyyK.","..KyyyyK..","..KyyyyK..",".KyyKKyyK.",".KyK..KyK.",".KK....KK."];
const HRT=[".rr.rr.","rrrrrrr","rrrrrrr",".rrrrr.","..rrr..","...r..."];
const LGT=[".....MM.....",".....MM.....","..M.MLLM.M..","...MLLLLM...","MMMLLLLLLMMM","...MLLLLM...","..M.MLLM.M..",".....MM.....",".....MM.....","............"];
const FIRE=["....F.....","...FF.F...","..FFFFF.F.","..FGGGFF..",".FFGGGGFF.",".FGGHHGGF.",".FGHHHHGF.",".RFGHHGFR.","..RRFFRR.."];
const BAN=ANG.map(r=>r.replace(/y/g,'Y').replace(/w/g,'W').replace(/b/g,'X').replace(/k/g,'E').replace(/s/g,'S'));
const A=mk(ANG),I=mk(LGT),S=mk(FIRE),BS=mk(BAN),IW=mk(BAN,1),HF=mk(HRT),HE=mk(HRT.map(r=>r.replace(/r/g,'g')));
function paint(id,spr){const c=$(id);c.getContext('2d').drawImage(spr,0,0)}
paint('#la',A);paint('#ia',A);paint('#il',I);paint('#if',S);paint('#ib',BS);
const AO=(()=>{const c=document.createElement('canvas');c.width=16;c.height=16;const x=c.getContext('2d'),w=document.createElement('canvas');w.width=14;w.height=14;const y=w.getContext('2d');y.drawImage(A,0,0);y.globalCompositeOperation='source-in';y.fillStyle='#c9a0ff';y.fillRect(0,0,14,14);[[0,1],[2,1],[1,0],[1,2]].forEach(o=>x.drawImage(w,o[0],o[1]));x.drawImage(A,1,1);return c})();

/* ---------- shake & high score (suara ada di audio.js -> SFX) ---------- */
let SH=0,HS=0;try{HS=+localStorage.getItem('fa_hs')||0}catch(e){}
const saveHS=()=>{try{localStorage.setItem('fa_hs',HS)}catch(e){}};

/* ---------- pages ---------- */
let cur=1,G=null,stage=3,last=performance.now();
const keys={},touch={u:0,d:0,a:0};
function show(n){cur=n;document.querySelectorAll('.page').forEach((p,i)=>p.classList.toggle('on',i+1==n));
 if(n==2){ld.p=0;ld.go=0}
 if(n==3||n==4){$('#slot'+n).appendChild($('#box'));newGame(n)}
 if(n==6){E.t=0;$('#wl').classList.remove('vis')}
 if(n==5){const b=document.querySelector('.bw');b.style.animation='none';b.offsetWidth;b.style.animation='';conf.length=0}
 if(n!=3&&n!=4)SFX.scene(n==5?'win':'menu')}
$('#st').onclick=()=>{SFX.init();SFX.play('click');show(2)};
const mu=$('#mu');if(mu){mu.classList.toggle('off',SFX.muted);mu.onclick=()=>mu.classList.toggle('off',SFX.toggle())}
const md=$('#md'),openM=k=>{$('#how').style.display=k=='how'?'block':'none';$('#abt').style.display=k=='abt'?'block':'none';md.classList.add('on');$('.pn').scrollTop=0},closeM=()=>md.classList.remove('on');
$('#hw').onclick=()=>{SFX.play('click');openM('how')};$('#ab').onclick=()=>{SFX.play('click');openM('abt')};$('#mc').onclick=()=>{SFX.play('click');closeM()};md.onclick=e=>{if(e.target===md)closeM()};addEventListener('keydown',e=>{if(e.key=='Escape')closeM()});$('#pa').onclick=()=>{SFX.play('click');show(1)};$('#ge').onclick=()=>{SFX.play('click');show(6)};$('#rt').onclick=()=>{SFX.play('click');newGame(stage)};
(()=>{const p=[];for(let i=0;i<30;i++){const a=i/30*Math.PI*2,r=i%2?39:50;p.push((50+r*Math.cos(a)).toFixed(1)+'% '+(50+r*Math.sin(a)*.92).toFixed(1)+'%')}
 $('#bu').style.clipPath='polygon('+p.join(',')+')'})();

/* ---------- controls ---------- */
addEventListener('keydown',e=>{const k=e.key.toLowerCase();keys[k]=1;if(k.startsWith('arrow')||k==' ')e.preventDefault()});
addEventListener('keyup',e=>keys[e.key.toLowerCase()]=0);
addEventListener('touchstart',()=>$('#ctl').classList.add('show'),{once:true,passive:true});
document.querySelectorAll('.cb').forEach(b=>{const k=b.dataset.k;
 const on=e=>{e.preventDefault();touch[k]=1;b.classList.add('dn')},off=()=>{touch[k]=0;b.classList.remove('dn')};
 b.addEventListener('pointerdown',on);['pointerup','pointercancel','pointerleave'].forEach(t=>b.addEventListener(t,off));
 b.addEventListener('contextmenu',e=>e.preventDefault())});

/* ---------- background (cover / loading / win) ---------- */
const bg=$('#bg'),bx=bg.getContext('2d');let BW,BH,cl=[],conf=[];
function rs(){BW=180;BH=Math.max(60,Math.round(180*innerHeight/innerWidth));bg.width=BW;bg.height=BH;
 cl=Array.from({length:8},()=>({x:Math.random()*BW,y:Math.random()*BH,s:2+Math.random()*3,v:2+Math.random()*5}))}
rs();addEventListener('resize',rs);
function bgDraw(dt){bx.clearRect(0,0,BW,BH);
 cl.forEach(c=>{c.x-=c.v*dt;if(c.x<-c.s*14)c.x=BW+4;const x=c.x|0,y=c.y|0,s=c.s|0;
  bx.fillStyle='rgba(255,255,255,.6)';bx.fillRect(x,y+s,s*10,s*2);bx.fillRect(x+s,y,s*4,s*2);bx.fillRect(x+s*5,y-s,s*4,s*3);
  bx.fillStyle='rgba(180,215,235,.5)';bx.fillRect(x+s,y+s*3,s*9,s)});
 if(cur==5){fwT-=dt;if(fwT<=0){fwT=.35+Math.random()*.4;const fx=Math.random()*BW,fy=BH*(.1+Math.random()*.45),col=['#ffd93b','#ff5d8f','#19e6d4','#fff','#ff9a3c'][Math.random()*5|0];for(let i=0;i<26;i++){const a=i/26*6.28,v=22+Math.random()*16;FW.push({x:fx,y:fy,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:1.1,c:col})}}FW.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=30*dt;p.l-=dt;bx.fillStyle=p.c;bx.globalAlpha=Math.max(0,p.l);bx.fillRect(p.x|0,p.y|0,2,2);bx.globalAlpha=1});FW=FW.filter(p=>p.l>0);if(Math.random()<.5)conf.push({x:Math.random()*BW,y:-3,v:18+Math.random()*30,c:['#ffd93b','#ff5d8f','#fff','#19e6d4','#e02b2b'][Math.random()*5|0]});
  conf.forEach(p=>{p.y+=p.v*dt;bx.fillStyle=p.c;bx.fillRect(p.x|0,p.y|0,2,2)});conf=conf.filter(p=>p.y<BH)}}

let T=0,bgi=0,SP=[],FE=[],CL=[],FW=[],E={t:0},fwT=0;
function pc(x,y,s,a,bank){x|=0;y|=0;bx.globalAlpha=a;bx.fillStyle='#b9d9ea';bx.fillRect(x+s,y+s*3,s*10,s);bx.fillStyle='#fff';bx.fillRect(x,y+s,s*12,s*2);bx.fillRect(x+s*2,y,s*4,s*2);bx.fillRect(x+s*6,y-s,s*4,s*3);bx.fillRect(x+s*9,y,s*2,s*2);if(bank){bx.fillStyle='#e4f4fa';bx.fillRect(x+s,y+s*3,s*10,BH)}bx.globalAlpha=1}
function bgDraw2(dt){T+=dt;
 if(bgi!==BH){bgi=BH;SP=Array.from({length:40},()=>({x:Math.random()*BW,y:Math.random()*BH*.85,p:Math.random()*6}));FE=Array.from({length:9},()=>({x:Math.random()*BW,y:Math.random()*BH,v:6+Math.random()*8,p:Math.random()*6}));CL=Array.from({length:10},(_,i)=>({x:Math.random()*BW,y:BH*(.12+Math.random()*.6),s:i<5?2:3,v:i<5?3:7,a:i<5?.45:.75}))}
 const gr=bx.createLinearGradient(0,0,0,BH);gr.addColorStop(0,'#2bb7b0');gr.addColorStop(.55,'#7fe3c4');gr.addColorStop(1,'#eafcf2');bx.fillStyle=gr;bx.fillRect(0,0,BW,BH);
 const cx=BW/2,R=BH*1.6;bx.fillStyle='rgba(255,255,255,.1)';
 for(let i=0;i<9;i++){const a=T*.05+i*.7;bx.beginPath();bx.moveTo(cx,-8);bx.lineTo(cx+Math.cos(a)*R,-8+Math.sin(a)*R);bx.lineTo(cx+Math.cos(a+.2)*R,-8+Math.sin(a+.2)*R);bx.fill()}
 const rg=bx.createRadialGradient(cx,BH*.4,0,cx,BH*.4,BH*.7);rg.addColorStop(0,'rgba(255,255,255,.55)');rg.addColorStop(1,'rgba(255,255,255,0)');bx.fillStyle=rg;bx.fillRect(0,0,BW,BH);
 SP.forEach(p=>{const a=.3+.7*Math.abs(Math.sin(T*1.6+p.p));bx.fillStyle='rgba(255,255,255,'+a+')';const x=p.x|0,y=p.y|0;bx.fillRect(x,y,1,1);if(a>.8){bx.fillRect(x-1,y,3,1);bx.fillRect(x,y-1,1,3)}});
 CL.forEach(c=>{c.x-=c.v*dt;if(c.x<-c.s*14)c.x=BW+c.s*2;pc(c.x,c.y,c.s,c.a)});
 FE.forEach(f=>{f.y+=f.v*dt;f.x+=Math.sin(T*1.2+f.p)*8*dt;if(f.y>BH+4){f.y=-4;f.x=Math.random()*BW}bx.fillStyle='rgba(255,255,255,.9)';const x=f.x|0,y=f.y|0;bx.fillRect(x,y,1,1);bx.fillRect(x+1,y+1,1,1);bx.fillRect(x+2,y+2,1,1);bx.fillRect(x+1,y,2,1)});
 [[-14,BH-30,9],[20,BH-20,7],[BW-90,BH-34,9],[BW-44,BH-22,7]].forEach((b,i)=>pc(b[0],b[1]+Math.sin(T*.8+i)*1.5,b[2],1,1));
 if(cur==5){if(Math.random()<.5)conf.push({x:Math.random()*BW,y:-3,v:18+Math.random()*30,c:['#ffd93b','#ff5d8f','#fff','#19e6d4','#e02b2b'][Math.random()*5|0]});conf.forEach(p=>{p.y+=p.v*dt;bx.fillStyle=p.c;bx.fillRect(p.x|0,p.y|0,2,2)});conf=conf.filter(p=>p.y<BH)}}
/* ---------- loading ---------- */
const ld={p:0};
function ldUpd(dt){ld.p=Math.min(1,ld.p+dt/4.5);$('#fl').style.width=(ld.p*100)+'%';
 const L=document.querySelector('.ld');$('#la').style.top=(ld.p*(L.clientHeight-250))+'px';
 $('#lt').textContent='LOADING'+'.'.repeat(1+(performance.now()/350|0)%3);
 if(ld.p>=1&&!ld.go){ld.go=1;setTimeout(()=>cur==2&&show(3),500)}}

/* ---------- game ---------- */
const cv=$('#c'),g=cv.getContext('2d');let W=320,H=192,D=150,U=80,SD=153,SU=83;const LEN=2600;
function fit(){const a=innerWidth/innerHeight;if(a>=1.25){H=192;W=Math.min(480,Math.round(H*a))}else{W=200;H=Math.min(520,Math.round(W/a))}cv.width=W;cv.height=H;g.imageSmoothingEnabled=false;
 const c=$('#ctl'),ch=c.offsetParent!==null?c.offsetHeight*H/innerHeight:0,mid=(44+H-ch-8)/2;D=Math.round(mid+42);U=D-66;SD=D+3;SU=U+3}
fit();let ori=innerWidth>=innerHeight*1.25;addEventListener('resize',()=>{const o=innerWidth>=innerHeight*1.25;if(o!==ori){ori=o;if(cur==3||cur==4)newGame(stage);else fit()}});
const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
const touchUI=()=>$('#ctl').offsetParent!==null;
const mkE=(t,x,sf,a,b)=>t=='i'?{t,x,y:sf-20,a,b,d:-1,w:24,h:20}:{t,x,y:sf-34,w:20,h:18};
function newGame(st){SFX.scene(st==3?'stage':'boss');$('#ctl').classList.toggle('boss',st==4);fit();stage=st;SH=0;const s=G={shE:100,shCd:0,sh:false,cam:0,t:0,lives:3,score:0,combo:0,ct:0,pw:0,inv:0,ax:st==3?60:40,ay:SD-28,vy:0,gr:1,drop:0,bl:[],en:[],eb:[],pt:[],cd:0,over:false,done:false,boss:null,msg:'',mt:0,tr:0,st4:2,up:[],lx:st==3?Math.round(W*.13):-100};
 if(st==3){const x0=Math.round(W*.35);
  [[0,230],[330,260],[700,240],[1090,300],[1520,240],[1880,270]].forEach(a=>{const u={x:x0+a[0],w:a[1]};s.up.push(u);
   [[28,'s'],[u.w/2-12,'i'],[u.w-48,'s']].forEach(p=>s.en.push(mkE(p[1],u.x+p[0],SU,u.x,u.x+u.w-24)))});
  [[260,'i'],[470,'s'],[640,'i'],[910,'i'],[1260,'s'],[1400,'i'],[1700,'i'],[1980,'s'],[2200,'i'],[2330,'i']].forEach(p=>s.en.push(mkE(p[1],p[0],SD,p[0]-45,p[0]+45)));
  s.msg=touchUI()?'UP JUMP  DOWN DROP':'W JUMP  S DROP  D ATTACK';s.mt=4}
 else{s.up.push({x:-60,w:Math.round(W*.62)+60});s.boss={x:W+80,y:U-49,hp:30,max:30,fl:0,cd:2,cd2:5,in:1};s.msg=touchUI()?'BOSS! TAP SHIELD':'BOSS!  TAP E: SHIELD';s.mt=3.5}
 $('#over').style.display='none'}
function burst(x,y,c,n){for(let i=0;i<n;i++){const a=Math.random()*6.28,v=30+Math.random()*70;G.pt.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,l:.5+Math.random()*.4,c})}}
function hurt(){const s=G;if(s.sh){burst(s.ax+28,s.ay+14,'#7fe9ff',3);SFX.play('block');return}if(s.inv>0)return;s.lives--;s.inv=1.6;s.combo=0;SH=.3;SFX.play('hurt');navigator.vibrate&&navigator.vibrate(80);burst(s.ax+14,s.ay+14,'#e02b2b',12);if(s.lives<=0){s.over=true;HS=Math.max(HS,s.score);saveHS();SFX.scene(null);SFX.play('over');$('#over').style.display='flex'}}
function shoot(){const s=G,y=s.ay+12,x=s.ax+28;s.cd=s.pw>0?.17:.36;SFX.play('shoot',s.pw>0);s.bl.push({x,y,vy:0});if(s.pw>0){s.bl.push({x,y:y-6,vy:-30});s.bl.push({x,y:y+6,vy:30})}}
function upd(dt){const s=G;s.t+=dt;if(s.mt>0)s.mt-=dt;if(SH>0)SH-=dt;s.ct-=dt;if(s.ct<=0)s.combo=0;
 if(!s.done){
  const up=keys.w||keys.arrowup||touch.u,dn=keys.s||keys.arrowdown||touch.d;
  if(stage==3&&!s.tr)s.ax+=60*dt;
  if(dn){if(s.gr&&s.ay+28<SD-3){s.drop=.25;s.vy=60;s.gr=0;SFX.play('drop')}else if(!s.gr){s.drop=.25;s.vy=Math.min(420,s.vy+900*dt)}}
  if(up&&s.gr){s.vy=-360;s.gr=0;SFX.play('jump')}
  s.drop-=dt;const pf=s.ay+28;s.vy=Math.min(420,s.vy+700*dt);s.ay+=s.vy*dt;const f=s.ay+28;s.gr=0;
  if(s.vy>=0){const c=s.ax+14;
   if(s.drop<=0&&s.up.some(u=>c>=u.x&&c<=u.x+u.w)&&pf<=SU+1&&f>=SU){s.ay=SU-28;s.vy=0;s.gr=1}
   else if(c>=s.lx&&pf<=SD+1&&f>=SD){s.ay=SD-28;s.vy=0;s.gr=1}}
  if(s.ay>H+60){s.ay=SD-28;s.vy=0}if(s.ay<0){s.ay=0;s.vy=0}
  if(stage==4&&(keys.e||touch.sh))s.sh=true;
  s.cd-=dt;if((keys.d||touch.a)&&s.cd<=0)shoot();
  if(s.pw>0)s.pw-=dt;if(s.inv>0)s.inv-=dt;
  const me={x:s.ax+4,y:s.ay+5,w:20,h:21};
  s.cam=stage==3?Math.max(0,s.ax-W*.3):0;
  if(stage==3){
   if(!s.tr&&s.ax>=LEN){s.tr=1;s.trT=2.2;s.msg='WARNING!! ANGEL INCOMING';s.mt=2.2;SFX.play('warn')}
   if(s.tr){s.trT-=dt;if(s.trT<=0){show(4);return}}
  }else{
   s.st4-=dt;if(s.st4<=0){s.st4=10;if(!s.en.some(e=>e.t=='s'))s.en.push({t:'s',x:70,y:SU-34,w:20,h:18})}
   const b=s.boss;
   if(b){if(b.in){b.x-=60*dt;b.y=U-49;if(b.x<=W-88)b.in=0}
    else{b.y=(U+D)/2-49+Math.sin(s.t*.5)*Math.min(36,H*.4);b.cd-=dt;b.cd2-=dt;if(b.fl>0)b.fl-=dt;
     const fr=b.hp/b.max,aim=da=>{const a=Math.atan2(s.ay+14-(b.y+30),s.ax-b.x)+da;s.eb.push({x:b.x,y:b.y+28,vx:Math.cos(a)*115,vy:Math.sin(a)*115})};
     if(b.cd<=0){b.cd=.9+fr*1.1;aim(0)}
     if(b.cd2<=0){b.cd2=3+fr*3;aim(-.35);aim(0);aim(.35)}
     const br={x:b.x+10,y:b.y+8,w:50,h:54};
     if(ov(me,br))hurt();
     s.bl.forEach(bl=>{if(!bl.dead&&ov({x:bl.x,y:bl.y,w:8,h:4},br)){bl.dead=1;b.hp--;b.fl=.1;SFX.play('bosshit');SH=Math.max(SH,.08);burst(bl.x+6,bl.y,'#fff',3);s.score+=2;
      if(b.hp<=0){s.done=1;SFX.play('bossdie');SFX.scene(null);SH=.6;HS=Math.max(HS,s.score);saveHS();burst(b.x+35,b.y+35,'#fff6b0',50);burst(b.x+35,b.y+35,'#cfa8ff',40);s.boss=null;setTimeout(()=>show(6),1900)}}})}}
  }
  s.en.forEach(e=>{if(e.t=='i'){e.x+=e.d*28*dt;if(e.x<e.a)e.d=1;if(e.x>e.b)e.d=-1}
   const r={x:e.x,y:e.y,w:e.w,h:e.h};
   if(ov(me,r)){if(e.t=='s'){e.dead=1;s.pw=7;s.score+=5;SFX.play('power');burst(e.x+10,e.y+9,'#ff7a1a',12)}else if(e.t=='h'){e.dead=1;if(s.lives<3)s.lives++;SFX.play('heart');burst(e.x+7,e.y+6,'#ff3350',10)}else hurt()}
   else if(e.t=='i')s.bl.forEach(b=>{if(!b.dead&&!e.dead&&ov({x:b.x,y:b.y,w:8,h:4},r)){b.dead=1;e.dead=1;s.combo=s.ct>0?s.combo+1:1;s.ct=2;s.score+=10*Math.min(s.combo,5);SFX.play('kill');if(s.combo>1)SFX.play('combo',s.combo);if(Math.random()<.15)s.en.push({t:'h',x:e.x+5,y:e.y+4,w:14,h:12});burst(e.x+12,e.y+10,'#fff6b0',14)}})});
  s.en=s.en.filter(e=>!e.dead);
  s.eb.forEach(e=>{e.x+=e.vx*dt;e.y+=e.vy*dt;if(ov(me,{x:e.x-3,y:e.y-3,w:7,h:7})){e.dead=1;hurt()}});
  s.eb=s.eb.filter(e=>!e.dead&&e.x>-10&&e.y>-10&&e.y<H+10);
 }
 s.bl.forEach(b=>{b.x+=260*dt;b.y+=(b.vy||0)*dt});s.bl=s.bl.filter(b=>!b.dead&&b.x<s.cam+W+10);
 s.pt.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt});s.pt=s.pt.filter(p=>p.l>0)}

function tile(x,y){g.fillStyle='#a9cde3';g.fillRect(x+4,y+14,56,3);g.fillStyle='#cfe6f3';g.fillRect(x,y+9,64,6);g.fillStyle='#fff';g.fillRect(x,y+4,64,8);g.fillRect(x+2,y,16,6);g.fillRect(x+8,y-4,12,6);g.fillRect(x+24,y-2,18,8);g.fillRect(x+30,y-6,10,6);g.fillRect(x+46,y,16,6);g.fillRect(x+52,y-3,8,4);g.fillRect(x+12,y+12,10,3);g.fillRect(x+38,y+12,12,3)}
function strip(x0,x1,y,cx){if(x1<cx-10||x0>cx+W+10)return;g.save();g.beginPath();g.rect(x0,y-12,x1-x0,40);g.clip();for(let x=x0;x<x1;x+=64)tile(x,y);g.restore();g.fillStyle='#fff';g.fillRect(x0-5,y+3,8,9);g.fillRect(x0-2,y-1,8,6);g.fillRect(x1-3,y+3,8,9);g.fillRect(x1-6,y-1,8,6);g.fillStyle='#cfe6f3';g.fillRect(x0-4,y+10,8,4);g.fillRect(x1-4,y+10,8,4)}
function mtn(par,col,hh,sd,cx){g.fillStyle=col;const o=cx*par;for(let x=0;x<W;x+=3){const h=Math.floor((Math.sin((x+o)*.045+sd)+Math.sin((x+o)*.1+sd*2)*.5+1.6)*hh/3.1);g.fillRect(x,H-8-h,3,H)}}
function moon(){const cx=Math.round(W*.8),cy=30;g.fillStyle='#fff3c0';for(let d=-10;d<=10;d++){const w=Math.floor(Math.sqrt(100-d*d));g.fillRect(cx-w,cy+d,w*2,1)}g.fillStyle='#e6d79a';g.fillRect(cx-4,cy-3,4,3);g.fillRect(cx+2,cy+3,3,3)}
function draw(){const s=G;if(!s)return;const cx=Math.round(s.cam);
 const gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,'#1b1d5c');gr.addColorStop(.55,'#5a3a9c');gr.addColorStop(1,'#ff90b4');g.fillStyle=gr;g.fillRect(0,0,W,H);
 g.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<16;i++){const x=(((i*97+40-cx*.08*(1+i%3))%W)+W)%W;g.fillRect(x|0,(i*53)%(H*.6)|0,2,2)}
 moon();mtn(.12,'#3b2a85',70,1,cx);mtn(.25,'#2a1d66',50,4,cx);
 const shx=SH>0?Math.round((Math.random()-.5)*SH*20):0,shy=SH>0?Math.round((Math.random()-.5)*SH*20):0;
 g.save();g.translate(-cx+shx,shy);
 strip(s.lx,stage==3?LEN+300:W+120,D,cx);s.up.forEach(u=>strip(u.x,u.x+u.w,U,cx));
 s.en.forEach(e=>{if(e.x<cx-40||e.x>cx+W+40)return;if(e.t=='s')g.drawImage(S,e.x|0,(e.y+Math.sin(s.t*5+e.x*.1)*2)|0,20,18);else if(e.t=='h')g.drawImage(HF,e.x|0,(e.y+Math.sin(s.t*5)*2)|0,14,12);else{g.fillStyle='rgba(255,240,150,'+(.2+.12*Math.sin(s.t*6+e.x))+')';g.beginPath();g.arc(e.x+12,e.y+10,16,0,6.28);g.fill();g.drawImage(I,e.x|0,(e.y+Math.sin(s.t*4+e.x)*1.5)|0,24,20)}});
 if(s.boss){const b=s.boss;g.drawImage(b.fl>0?IW:BS,b.x|0,b.y|0,70,70)}
 s.bl.forEach(b=>{const f=s.pw>0;g.fillStyle=f?'#ff7a1a':'#b46bff';g.fillRect(b.x|0,b.y|0,8,4);g.fillStyle=f?'#fff3a8':'#f0dcff';g.fillRect((b.x|0)+4,(b.y|0)+1,4,2)});
 s.eb.forEach(e=>{g.fillStyle='#ffe98a';g.fillRect((e.x|0)-3,(e.y|0)-3,7,7);g.fillStyle='#fff';g.fillRect((e.x|0)-1,(e.y|0)-1,3,3)});
 if(!s.over&&!(s.inv>0&&((s.t*12)|0)%2)){
  const ax=Math.round(s.ax),ay=Math.round(s.ay+(s.gr?Math.sin(s.t*14):0));
  if(s.pw>0){g.fillStyle='rgba(255,120,30,.38)';g.fillRect(ax-4,ay-6,36,36)}
  g.drawImage(AO,ax-2,ay-2,32,32);g.fillStyle='#9b1030';g.fillRect(ax+8,ay-5,12,2);g.fillStyle='#ff4a63';g.fillRect(ax+10,ay-5,8,1)}
 if(s.sh){const cx2=Math.round(s.ax)+14,cy2=Math.round(s.ay)+14;g.fillStyle='rgba(127,233,255,.25)';g.strokeStyle='rgba(180,245,255,.95)';g.lineWidth=2;g.beginPath();g.arc(cx2,cy2,21+Math.sin(s.t*20),0,6.28);g.fill();g.stroke()}
 s.pt.forEach(p=>{g.fillStyle=p.c;g.fillRect(p.x|0,p.y|0,3,3)});
 g.restore();
 for(let i=0;i<3;i++)g.drawImage(i<s.lives?HF:HE,6+i*17,6,14,12);
 g.font='8px "Press Start 2P",monospace';g.textBaseline='top';g.fillStyle='#fff';g.drawImage(S,6,22,10,9);g.fillText(String(s.score),20,22);
 if(s.pw>0){g.fillStyle='#ffd93b';g.fillRect(6,35,s.pw/7*50,4)}
 if(stage==4){g.strokeStyle='#fff';g.lineWidth=1;g.strokeRect(6.5,42.5,50,6);g.fillStyle='#7fe9ff';if(s.sh)g.fillRect(8,44,47,3)}
 const bw=104,bx0=W-bw-8;g.strokeStyle='#fff';g.lineWidth=2;g.strokeRect(bx0,8,bw,9);
 g.fillStyle=stage==3?'#fff':'#e02b2b';g.fillRect(bx0+2,10,(bw-4)*(stage==3?Math.min(1,s.ax/LEN):(s.boss?s.boss.hp/s.boss.max:0)),5);
 g.fillStyle='#fff';g.fillText(stage==3?'STAGE':'BOSS',bx0,20);
 g.fillText('HP '+Math.max(HS,s.score),bx0,32);
 if(s.combo>1){g.fillStyle='#ffd93b';g.fillText('x'+Math.min(s.combo,5)+' COMBO',6,52)}
 if(s.mt>0&&((s.t*6)|0)%4!=3){g.textAlign='center';g.fillStyle='#0a3a66';g.fillText(s.msg,W/2+1,H/2-39);g.fillStyle='#fff';g.fillText(s.msg,W/2,H/2-40);g.textAlign='left'}}

function earth(dt){const e=E;e.t+=dt;T+=dt;const t=e.t,cx=BW/2,cy=BH/2;
 if(t<4.4){bx.fillStyle='#050818';bx.fillRect(0,0,BW,BH);
  SP.forEach(p=>{bx.fillStyle='rgba(255,255,255,'+(.4+.6*Math.abs(Math.sin(T*2+p.p)))+')';bx.fillRect(p.x|0,p.y|0,1,1)});
  const k=t/4.4,r=10+k*k*k*330,img=bx.getImageData(0,0,BW,BH),d=img.data,x0=Math.max(0,Math.floor(cx-r)),x1=Math.min(BW,Math.ceil(cx+r)),y0=Math.max(0,Math.floor(cy-r)),y1=Math.min(BH,Math.ceil(cy+r));
  for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const dx=x+.5-cx,dy=y+.5-cy;if(dx*dx+dy*dy>r*r)continue;
   const u=dx/r,v=dy/r,z=Math.sqrt(Math.max(0,1-u*u-v*v)),lo=Math.atan2(u,z)+t*.5,la=Math.asin(v),n=Math.sin(lo*3+1.3)+Math.sin(la*5+lo*2)+Math.sin(lo*7-la*3)*.5;
   let R=36,Gc=104,B=214;if(n>.9){R=63;Gc=174;B=74}if(Math.sin(lo*9+la*6+t)*Math.sin(la*11-lo*4)>.55){R=Gc=B=255}
   const sh=.5+.5*z;R*=sh;Gc*=sh;B*=sh;if(z<.2){R=130;Gc=190;B=255}
   const i=(y*BW+x)*4;d[i]=R;d[i+1]=Gc;d[i+2]=B;d[i+3]=255}
  bx.putImageData(img,0,0);
  if(t>3.9){bx.fillStyle='rgba(255,255,255,'+Math.min(1,(t-3.9)/.5)+')';bx.fillRect(0,0,BW,BH)}}
 else{const s=t-4.4,gr=bx.createLinearGradient(0,0,0,BH);gr.addColorStop(0,'#3aa6ff');gr.addColorStop(1,'#cdeeff');bx.fillStyle=gr;bx.fillRect(0,0,BW,BH);
  bx.fillStyle='#fff6b0';bx.fillRect(BW-34,14,16,16);
  const m=Math.min(s,3),dist=s*20+260*(m-m*m/6);
  for(let i=0;i<12;i++){const y=BH+30-((i*61+dist*(.5+(i%3)*.4))%(BH+70));pc((i*47)%BW-10,y,2+i%3,.9)}
  const gy=Math.round(BH-Math.min(1,Math.max(0,(t-5.2)/2.4))*BH*.28);
  if(t>5.2){bx.fillStyle='#3fae4a';for(let x=0;x<BW;x+=2){const h=Math.round(Math.sin(x*.07)*4+Math.sin(x*.15)*2);bx.fillRect(x,gy+h,2,BH)}
   bx.fillStyle='#2f8f3a';bx.fillRect(0,gy+12,BW,BH);
   for(let i=0;i<9;i++){const x=i*21+8,ty=Math.round(gy+8+(i%3)*5);bx.fillStyle='#7a4a1a';bx.fillRect(x,ty,2,6);bx.fillStyle='#1f7a2e';bx.fillRect(x-3,ty-4,8,4);bx.fillRect(x-2,ty-8,6,4);bx.fillRect(x-1,ty-11,4,3)}}
  if(s<.8){bx.fillStyle='rgba(255,255,255,'+(1-s/.8)+')';bx.fillRect(0,0,BW,BH)}
  if(t>7.8)$('#wl').classList.add('vis')}}

function loop(n){const dt=Math.min(.05,(n-last)/1000);last=n;
 if(cur==3||cur==4){if(G&&!G.over)upd(dt);draw()}else{cur==6?earth(dt):bgDraw2(dt);if(cur==2)ldUpd(dt)}
 requestAnimationFrame(loop)}
requestAnimationFrame(loop);