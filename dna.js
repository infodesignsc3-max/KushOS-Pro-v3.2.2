// ══════════════════════════════════════════════════════════
// DNA DOUBLE HELIX + FLOATING MOLECULES — LOGIN SCREEN
// Bioluminescent theme · Drag to spin · Molecules bounce
// ══════════════════════════════════════════════════════════
(function () {
  'use strict';

  // ── Canvas setup: two layers ───────────────────────────
  // Canvases are inserted INSIDE #login-screen so they share its
  // stacking context — guaranteed above .login-bg, no external
  // z-index battle needed.
  const loginScreen = document.getElementById('login-screen');
  const mountTarget = loginScreen || document.body;

  const dnaCanvas = document.createElement('canvas');
  dnaCanvas.id = 'dna-canvas';
  dnaCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:1;display:block;';
  mountTarget.insertBefore(dnaCanvas, mountTarget.firstChild);
  const dc = dnaCanvas.getContext('2d');

  const molCanvas = document.createElement('canvas');
  molCanvas.id = 'mol-canvas';
  molCanvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;display:block;';
  mountTarget.insertBefore(molCanvas, dnaCanvas.nextSibling);
  const mc = molCanvas.getContext('2d');

  // ── Visibility: hide canvases and pause rAF when login is gone ──
  let _rafRunning = true;
  function syncVisibility() {
    if (!loginScreen) return;
    const hidden = getComputedStyle(loginScreen).display === 'none';
    dnaCanvas.style.opacity = hidden ? '0' : '1';
    molCanvas.style.opacity = hidden ? '0' : '1';
    _rafRunning = !hidden;
  }

  if (loginScreen) {
    new MutationObserver(syncVisibility).observe(loginScreen, {
      attributes: true,
      attributeFilter: ['style', 'class']
    });
  }

  // Run immediately and after a tick to handle auth.js race
  syncVisibility();
  setTimeout(syncVisibility, 0);

  // ── Sizing ─────────────────────────────────────────────
  let W, H;

  function resize() {
    W = dnaCanvas.width  = molCanvas.width  = window.innerWidth;
    H = dnaCanvas.height = molCanvas.height = window.innerHeight;
    initMols();
  }
  window.addEventListener('resize', resize);

  // ── DNA state ──────────────────────────────────────────
  const RUNGS = 26;
  const BASES = ['A','T','G','C'];
  const PAIR  = { A:'T', T:'A', G:'C', C:'G' };
  const seq   = Array.from({ length: RUNGS }, () => BASES[Math.floor(Math.random()*4)]);

  let autoY = 0, dragY = 0, dragX = 0, rotX = 0.14;
  let isDrag = false, lx = 0, ly = 0, vY = 0, vX = 0;

  const SC = [
    { n:'#6dbf70', g:'rgba(109,191,112,', l:'rgba(93,192,96,'  },
    { n:'#5ba3f5', g:'rgba(91,163,245,',  l:'rgba(61,143,235,' },
  ];
  const BC = {
    A:{ g:'rgba(109,191,112,' }, T:{ g:'rgba(141,212,144,' },
    G:{ g:'rgba(91,163,245,',  }, C:{ g:'rgba(169,142,232,' },
  };

  function rotYX(x,y,z,ry,rx){
    const cy=Math.cos(ry),sy=Math.sin(ry);
    const x1=x*cy+z*sy, z1=-x*sy+z*cy;
    const cx=Math.cos(rx),sx=Math.sin(rx);
    return { x:x1, y:y*cx-z1*sx, z:y*sx+z1*cx };
  }
  function proj(px,py,pz){
    const fov=Math.min(W,H)*1.5, sc=fov/(fov+pz);
    return { sx:W/2+px*sc, sy:H/2+py*sc, sc };
  }
  function getPts(ry,rx){
    const hr=Math.min(W,H)*0.095, hh=Math.min(W,H)*0.68;
    const step=(Math.PI*2*2.2)/RUNGS, out=[];
    for(let i=0;i<RUNGS;i++){
      const t=i/(RUNGS-1), ang=step*i, y=(t-.5)*hh;
      for(let s=0;s<2;s++){
        const off=s*Math.PI, x3=Math.cos(ang+off)*hr, z3=Math.sin(ang+off)*hr;
        const r=rotYX(x3,y,z3,ry,rx), p=proj(r.x,r.y,r.z);
        out.push({ i,s,rz:r.z,sx:p.sx,sy:p.sy,sc:p.sc,base:s===0?seq[i]:PAIR[seq[i]] });
      }
    }
    return out;
  }

  function drawDNA(ts) {
    dc.clearRect(0,0,W,H);
    const ry=autoY+dragY, rx=rotX+dragX;
    const P=getPts(ry,rx);
    for(let s=0;s<2;s++){
      const col=SC[s];
      for(let i=0;i<RUNGS-1;i++){
        const a=P[i*2+s], b=P[(i+1)*2+s], al=0.35+0.55*((a.sc+b.sc)/2);
        dc.save(); dc.beginPath(); dc.moveTo(a.sx,a.sy); dc.lineTo(b.sx,b.sy);
        dc.strokeStyle=col.l+al+')'; dc.lineWidth=Math.max(0.8,3.2*((a.sc+b.sc)/2));
        dc.shadowColor=col.g+(al*0.5)+')'; dc.shadowBlur=6; dc.stroke(); dc.restore();
      }
    }
    const order=Array.from({length:RUNGS},(_,i)=>({i,z:(P[i*2].rz+P[i*2+1].rz)/2})).sort((a,b)=>a.z-b.z);
    for(const {i} of order){
      const a=P[i*2], b=P[i*2+1], scm=(a.sc+b.sc)/2, al=0.28+0.65*scm, bc=BC[a.base]||BC['A'];
      dc.save(); dc.beginPath(); dc.moveTo(a.sx,a.sy); dc.lineTo(b.sx,b.sy);
      dc.strokeStyle=bc.g+(al*0.5)+')'; dc.lineWidth=Math.max(0.5,2.2*scm);
      dc.shadowColor=bc.g+(al*0.35)+')'; dc.shadowBlur=5; dc.stroke(); dc.restore();
      for(let s=0;s<2;s++){
        const p=P[i*2+s], col=SC[s], r=Math.max(1.5,5.2*p.sc), a2=0.18+0.72*p.sc;
        dc.save(); dc.beginPath(); dc.arc(p.sx,p.sy,r*2.2,0,Math.PI*2);
        const g=dc.createRadialGradient(p.sx,p.sy,0,p.sx,p.sy,r*2.2);
        g.addColorStop(0,col.g+(a2*0.28)+')'); g.addColorStop(0.5,col.g+(a2*0.09)+')'); g.addColorStop(1,col.g+'0)');
        dc.fillStyle=g; dc.fill(); dc.restore();
        dc.save(); dc.beginPath(); dc.arc(p.sx,p.sy,r,0,Math.PI*2);
        dc.fillStyle=col.n; dc.globalAlpha=a2; dc.shadowColor=col.g+a2+')'; dc.shadowBlur=9*p.sc; dc.fill(); dc.restore();
        if(p.sc>0.88){
          const pulse=0.5+0.5*Math.sin(ts*0.0025+i*0.65);
          dc.save(); dc.beginPath(); dc.arc(p.sx,p.sy,r*(1.7+pulse*0.7),0,Math.PI*2);
          dc.strokeStyle=col.g+(0.28*pulse)+')'; dc.lineWidth=1.1; dc.stroke(); dc.restore();
        }
      }
    }
  }

  // ── MOLECULE DEFINITIONS ───────────────────────────────
  const MOL_TYPES = [
    { atoms:[{dx:0,dy:0,r:7,c:'#5ba3f5',lbl:'O'},{dx:-12,dy:10,r:4.5,c:'#8ed4f8',lbl:'H'},{dx:12,dy:10,r:4.5,c:'#8ed4f8',lbl:'H'}] },
    { atoms:[{dx:0,dy:0,r:6,c:'#a98ee8',lbl:'C'},{dx:-16,dy:0,r:5,c:'#6dbf70',lbl:'O'},{dx:16,dy:0,r:5,c:'#6dbf70',lbl:'O'}] },
    { atoms:[{dx:0,dy:0,r:7,c:'#6dbf70',lbl:'N'},{dx:-11,dy:11,r:4,c:'#8ed491',lbl:'H'},{dx:11,dy:11,r:4,c:'#8ed491',lbl:'H'},{dx:0,dy:-14,r:4,c:'#8ed491',lbl:'H'}] },
    { atoms:[{dx:0,dy:0,r:6.5,c:'#c9a227',lbl:'C'},{dx:-13,dy:-13,r:4,c:'#e8c84a',lbl:'H'},{dx:13,dy:-13,r:4,c:'#e8c84a',lbl:'H'},{dx:-13,dy:13,r:4,c:'#e8c84a',lbl:'H'},{dx:13,dy:13,r:4,c:'#e8c84a',lbl:'H'}] },
    { atoms:[{dx:-9,dy:0,r:5.5,c:'#5ba3f5',lbl:'O'},{dx:9,dy:0,r:5.5,c:'#5ba3f5',lbl:'O'}] },
    { atoms:[{dx:-9,dy:0,r:5.5,c:'#6dbf70',lbl:'N'},{dx:9,dy:0,r:5.5,c:'#6dbf70',lbl:'N'}] },
    { ring:true, atoms:[{dx:0,dy:-14,r:5,c:'#e8a845'},{dx:12,dy:-7,r:5,c:'#e8a845'},{dx:12,dy:7,r:5,c:'#e8a845'},{dx:0,dy:14,r:5,c:'#e8a845'},{dx:-12,dy:7,r:5,c:'#e8a845'},{dx:-12,dy:-7,r:5,c:'#e8a845'}] },
    { atoms:[{dx:-8,dy:0,r:5,c:'#8ed491',lbl:'H'},{dx:8,dy:0,r:7,c:'#ff5555',lbl:'Cl'}] },
    { atoms:[{dx:0,dy:0,r:6,c:'#57985a',lbl:'Mg'},{dx:0,dy:-14,r:4.5,c:'#6dbf70',lbl:'O'},{dx:0,dy:14,r:4.5,c:'#6dbf70',lbl:'O'},{dx:-14,dy:0,r:4.5,c:'#6dbf70',lbl:'O'},{dx:14,dy:0,r:4.5,c:'#6dbf70',lbl:'O'}] },
  ];

  function hexToRgb(hex){
    return parseInt(hex.slice(1,3),16)+','+parseInt(hex.slice(3,5),16)+','+parseInt(hex.slice(5,7),16);
  }

  let mols = [];
  function initMols(){
    mols = [];
    const count = Math.max(14, Math.floor(W*H/15000));
    for(let i=0;i<count;i++) spawnMol();
  }
  function spawnMol(){
    const type = MOL_TYPES[Math.floor(Math.random()*MOL_TYPES.length)];
    const maxR = Math.max(...type.atoms.map(a=>Math.sqrt(a.dx*a.dx+a.dy*a.dy)+a.r)) + 4;
    const spd  = 0.25 + Math.random()*0.55;
    const ang  = Math.random()*Math.PI*2;
    mols.push({
      type, x: maxR+Math.random()*(W-maxR*2), y: maxR+Math.random()*(H-maxR*2),
      vx: Math.cos(ang)*spd, vy: Math.sin(ang)*spd,
      rot: Math.random()*Math.PI*2, rotV: (Math.random()-0.5)*0.012,
      alpha: 0.18+Math.random()*0.22, radius: maxR, flash: 0
    });
  }

  function drawMolecule(m){
    const { x, y, rot, alpha, type, flash } = m;
    const a = Math.min(1, alpha + flash);
    mc.save(); mc.translate(x,y); mc.rotate(rot);
    if(type.ring){
      for(let i=0;i<type.atoms.length;i++){
        const a1=type.atoms[i], a2=type.atoms[(i+1)%type.atoms.length];
        mc.beginPath(); mc.moveTo(a1.dx,a1.dy); mc.lineTo(a2.dx,a2.dy);
        mc.strokeStyle=`rgba(232,168,69,${a*0.45})`; mc.lineWidth=1.5; mc.stroke();
      }
    } else {
      const ctr=type.atoms[0];
      for(let i=1;i<type.atoms.length;i++){
        const at=type.atoms[i];
        mc.beginPath(); mc.moveTo(ctr.dx,ctr.dy); mc.lineTo(at.dx,at.dy);
        mc.strokeStyle=`rgba(109,191,112,${a*0.38})`; mc.lineWidth=1.5; mc.stroke();
      }
    }
    for(const at of type.atoms){
      const rgb=hexToRgb(at.c);
      mc.save();
      const gr=mc.createRadialGradient(at.dx,at.dy,0,at.dx,at.dy,at.r*2.8);
      gr.addColorStop(0,`rgba(${rgb},${a*0.28})`);
      gr.addColorStop(0.5,`rgba(${rgb},${a*0.09})`);
      gr.addColorStop(1,`rgba(${rgb},0)`);
      mc.fillStyle=gr; mc.beginPath(); mc.arc(at.dx,at.dy,at.r*2.8,0,Math.PI*2); mc.fill(); mc.restore();
      mc.save(); mc.beginPath(); mc.arc(at.dx,at.dy,at.r,0,Math.PI*2);
      mc.fillStyle=at.c; mc.globalAlpha=a; mc.shadowColor=at.c;
      mc.shadowBlur=flash>0.05?18:7; mc.fill(); mc.restore();
      if(at.lbl && at.r>=5){
        mc.save(); mc.globalAlpha=a*0.9;
        mc.fillStyle='rgba(5,10,5,0.9)';
        mc.font=`bold ${Math.round(at.r*1.1)}px DM Mono,monospace`;
        mc.textAlign='center'; mc.textBaseline='middle';
        mc.fillText(at.lbl,at.dx,at.dy); mc.restore();
      }
    }
    mc.restore();
  }

  function updateMols(){
    for(let i=0;i<mols.length;i++){
      const m=mols[i];
      m.x+=m.vx; m.y+=m.vy; m.rot+=m.rotV; m.flash=Math.max(0,m.flash-0.03);
      if(m.x-m.radius<0){m.x=m.radius;m.vx=Math.abs(m.vx);m.flash=0.35;}
      if(m.x+m.radius>W){m.x=W-m.radius;m.vx=-Math.abs(m.vx);m.flash=0.35;}
      if(m.y-m.radius<0){m.y=m.radius;m.vy=Math.abs(m.vy);m.flash=0.35;}
      if(m.y+m.radius>H){m.y=H-m.radius;m.vy=-Math.abs(m.vy);m.flash=0.35;}
      for(let j=i+1;j<mols.length;j++){
        const n=mols[j], dx=n.x-m.x, dy=n.y-m.y;
        const dist=Math.sqrt(dx*dx+dy*dy), minD=m.radius+n.radius;
        if(dist<minD&&dist>0.1){
          const nx=dx/dist, ny=dy/dist, ov=(minD-dist)*0.5;
          m.x-=nx*ov; m.y-=ny*ov; n.x+=nx*ov; n.y+=ny*ov;
          const dvx=m.vx-n.vx, dvy=m.vy-n.vy, dot=dvx*nx+dvy*ny;
          if(dot>0){ const imp=dot*0.95; m.vx-=imp*nx; m.vy-=imp*ny; n.vx+=imp*nx; n.vy+=imp*ny; }
          m.rotV+=( Math.random()-0.5)*0.04; n.rotV+=(Math.random()-0.5)*0.04;
          m.rotV=Math.max(-0.04,Math.min(0.04,m.rotV)); n.rotV=Math.max(-0.04,Math.min(0.04,n.rotV));
          m.flash=0.5; n.flash=0.5;
        }
      }
      const spd=Math.sqrt(m.vx*m.vx+m.vy*m.vy);
      if(spd>1.4){const f=1.4/spd;m.vx*=f;m.vy*=f;}
      if(spd<0.12&&spd>0){const f=0.12/spd;m.vx*=f;m.vy*=f;}
    }
  }

  // ── Animation loop ──────────────────────────────────────
  let lt = 0;
  function animate(ts){
    if (!_rafRunning) return; // pause when login screen is hidden
    requestAnimationFrame(animate);
    const dt = Math.min(ts - lt, 40); lt = ts;
    if(!isDrag){ autoY += 0.00065*dt; dragY += vY; dragX += vX; vY *= 0.93; vX *= 0.93; }
    drawDNA(ts);
    updateMols();
    mc.clearRect(0,0,W,H);
    for(const m of mols) drawMolecule(m);
  }

  // ── Drag to spin (login screen only) ───────────────────
  function isLoginVisible() {
    if (!loginScreen) return false;
    return getComputedStyle(loginScreen).display !== 'none';
  }

  function down(e){
    if (!isLoginVisible()) return;
    isDrag=true; vY=0; vX=0;
    lx=e.clientX??e.touches?.[0]?.clientX??0;
    ly=e.clientY??e.touches?.[0]?.clientY??0;
  }
  function move(e){
    if(!isDrag) return;
    const cx=e.clientX??e.touches?.[0]?.clientX??lx;
    const cy=e.clientY??e.touches?.[0]?.clientY??ly;
    vY=(cx-lx)*0.007; vX=(cy-ly)*0.004;
    dragY+=vY; dragX+=vX;
    dragX=Math.max(-Math.PI*.4, Math.min(Math.PI*.4, dragX));
    lx=cx; ly=cy;
  }
  function up(){ isDrag=false; }

  document.addEventListener('mousedown',  down);
  document.addEventListener('touchstart', down, { passive:true });
  window.addEventListener('mousemove',    move);
  window.addEventListener('touchmove',    move, { passive:true });
  window.addEventListener('mouseup',      up);
  window.addEventListener('touchend',     up);

  // ── Init: size first, then start loop ──────────────────
  // Wait for DOM to be fully painted before sizing (avoids 0×0 canvas on fast loads)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); requestAnimationFrame(animate); });
  } else {
    resize();
    requestAnimationFrame(animate);
  }

})();
