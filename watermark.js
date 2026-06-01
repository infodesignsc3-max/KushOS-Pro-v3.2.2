// ══════════════════════════════════════════════════════════
// CANNABIS POTTED PLANT WATERMARK — v3.2
// Static render only — no ripple, no animation loop,
// no pixel-level reads. Redraws only on resize (debounced).
// ══════════════════════════════════════════════════════════
(function() {
  const canvas = document.getElementById('leaf-canvas');
  const ctx    = canvas.getContext('2d');
  let W, H;

  // ── Single leaflet blade ──
  function blade(cx, len, wid, alpha, veinAlpha) {
    cx.beginPath();
    cx.moveTo(0, 0);
    cx.bezierCurveTo(-wid * 0.75, -len * 0.18, -wid * 1.0, -len * 0.52, -wid * 0.38, -len * 0.84);
    cx.bezierCurveTo(-wid * 0.14, -len * 0.96, 0, -len, 0, -len);
    cx.bezierCurveTo(0, -len, wid * 0.14, -len * 0.96, wid * 0.38, -len * 0.84);
    cx.bezierCurveTo(wid * 1.0, -len * 0.52, wid * 0.75, -len * 0.18, 0, 0);
    const g = cx.createLinearGradient(0, 0, 0, -len);
    g.addColorStop(0,   `rgba(38,98,32,${alpha * 0.85})`);
    g.addColorStop(0.4, `rgba(62,138,48,${alpha})`);
    g.addColorStop(1,   `rgba(30,78,26,${alpha * 0.72})`);
    cx.fillStyle = g;
    cx.fill();
    cx.beginPath();
    cx.moveTo(0, 0); cx.bezierCurveTo(0, -len * 0.3, 0, -len * 0.7, 0, -len * 0.97);
    cx.strokeStyle = `rgba(18,52,14,${veinAlpha})`;
    cx.lineWidth   = wid * 0.11; cx.lineCap = 'round'; cx.stroke();
    for (let i = 1; i <= 3; i++) {
      const t  = i / 4;
      const vy = -len * t;
      const hw = wid * 0.82 * (1 - Math.pow(Math.abs(t - 0.4) * 1.5, 1.1));
      cx.globalAlpha = 0.38;
      cx.strokeStyle = `rgba(15,46,12,1)`;
      cx.lineWidth   = wid * 0.038;
      cx.beginPath(); cx.moveTo(0, vy); cx.bezierCurveTo(-hw*0.32, vy-len*0.038, -hw*0.78, vy-len*0.02, -hw*0.90, vy); cx.stroke();
      cx.beginPath(); cx.moveTo(0, vy); cx.bezierCurveTo( hw*0.32, vy-len*0.038,  hw*0.78, vy-len*0.02,  hw*0.90, vy); cx.stroke();
      cx.globalAlpha = 1;
    }
  }

  function fanLeaf(cx, x, y, size, rot, alpha) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(rot);
    const S = size;
    [
      { a:  0,  l: 1.00, w: 0.118 },
      { a: -28, l: 0.88, w: 0.106 },
      { a:  28, l: 0.88, w: 0.106 },
      { a: -54, l: 0.74, w: 0.092 },
      { a:  54, l: 0.74, w: 0.092 },
      { a: -78, l: 0.56, w: 0.075 },
      { a:  78, l: 0.56, w: 0.075 },
    ].forEach(b => {
      cx.save();
      cx.rotate((b.a - 90) * Math.PI / 180);
      blade(cx, S * b.l, S * b.w, alpha, alpha * 0.75);
      cx.restore();
    });
    cx.beginPath();
    cx.ellipse(0, 0, S * 0.024, S * 0.030, 0, 0, Math.PI * 2);
    cx.fillStyle = `rgba(72,148,50,${alpha * 0.9})`;
    cx.fill();
    cx.restore();
  }

  function smallFan(cx, x, y, size, rot, alpha) {
    cx.save();
    cx.translate(x, y);
    cx.rotate(rot);
    const S = size;
    [
      { a:  0,  l: 1.00, w: 0.11 },
      { a: -30, l: 0.84, w: 0.096 },
      { a:  30, l: 0.84, w: 0.096 },
      { a: -60, l: 0.64, w: 0.078 },
      { a:  60, l: 0.64, w: 0.078 },
    ].forEach(b => {
      cx.save();
      cx.rotate((b.a - 90) * Math.PI / 180);
      blade(cx, S * b.l, S * b.w, alpha, alpha * 0.70);
      cx.restore();
    });
    cx.restore();
  }

  function apicalBud(cx, x, y, size, alpha) {
    cx.save();
    cx.translate(x, y);
    const S = size;
    [
      { a:  0,  l: 1.00, w: 0.07 },
      { a: -18, l: 0.80, w: 0.06 },
      { a:  18, l: 0.80, w: 0.06 },
      { a: -36, l: 0.60, w: 0.05 },
      { a:  36, l: 0.60, w: 0.05 },
      { a: -52, l: 0.44, w: 0.04 },
      { a:  52, l: 0.44, w: 0.04 },
    ].forEach(b => {
      cx.save();
      cx.rotate((b.a - 90) * Math.PI / 180);
      cx.beginPath();
      cx.moveTo(0, 0);
      cx.bezierCurveTo(-S*b.w*0.8, -S*b.l*0.22, -S*b.w*1.0, -S*b.l*0.60, -S*b.w*0.3, -S*b.l*0.88);
      cx.bezierCurveTo(-S*b.w*0.1, -S*b.l*0.97, 0, -S*b.l, 0, -S*b.l);
      cx.bezierCurveTo(0, -S*b.l, S*b.w*0.1, -S*b.l*0.97, S*b.w*0.3, -S*b.l*0.88);
      cx.bezierCurveTo(S*b.w*1.0, -S*b.l*0.60, S*b.w*0.8, -S*b.l*0.22, 0, 0);
      const g = cx.createLinearGradient(0, 0, 0, -S * b.l);
      g.addColorStop(0,   `rgba(55,130,40,${alpha})`);
      g.addColorStop(0.6, `rgba(100,190,55,${alpha * 0.9})`);
      g.addColorStop(1,   `rgba(130,210,60,${alpha * 0.75})`);
      cx.fillStyle = g;
      cx.fill();
      cx.restore();
    });
    cx.restore();
  }

  function drawPottedPlant() {
    ctx.clearRect(0, 0, W, H);

    const cx   = W / 2;
    const u    = Math.min(W, H) * 0.042;
    const baseY = H / 2 + u * 4.2;

    // POT
    const potW = u * 5.8, potH = u * 4.2, potRimH = u * 0.55;
    const potTop = baseY, potBot = baseY + potH;
    ctx.save();
    const pw2 = potW / 2, pb2 = potW * 0.72 / 2;
    ctx.beginPath();
    ctx.moveTo(cx - pw2 - potRimH * 0.3, potTop + potRimH);
    ctx.lineTo(cx + pw2 + potRimH * 0.3, potTop + potRimH);
    ctx.lineTo(cx + pb2, potBot);
    ctx.quadraticCurveTo(cx, potBot + u * 0.35, cx - pb2, potBot);
    ctx.closePath();
    const potGrad = ctx.createLinearGradient(cx - pw2, 0, cx + pw2, 0);
    potGrad.addColorStop(0,   'rgba(110,68,28,0.22)');
    potGrad.addColorStop(0.3, 'rgba(175,110,48,0.26)');
    potGrad.addColorStop(0.7, 'rgba(185,118,52,0.26)');
    potGrad.addColorStop(1,   'rgba(120,75,30,0.20)');
    ctx.fillStyle = potGrad; ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,20,0.18)'; ctx.lineWidth = u * 0.14; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, potTop + potRimH * 0.5, pw2 + potRimH * 0.3, potRimH * 0.55, 0, 0, Math.PI * 2);
    const rimGrad = ctx.createLinearGradient(cx - pw2, 0, cx + pw2, 0);
    rimGrad.addColorStop(0,   'rgba(125,78,32,0.22)');
    rimGrad.addColorStop(0.5, 'rgba(195,125,56,0.28)');
    rimGrad.addColorStop(1,   'rgba(118,72,28,0.20)');
    ctx.fillStyle = rimGrad; ctx.fill();
    ctx.strokeStyle = 'rgba(90,55,20,0.16)'; ctx.lineWidth = u * 0.10; ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx, potTop + potRimH * 0.55, pw2 * 0.88, potRimH * 0.44, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(42,28,12,0.22)'; ctx.fill();
    ctx.restore();

    // MAIN STEM
    const stemTop = H / 2 - u * 8.8;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.bezierCurveTo(cx + u * 0.5, baseY - u * 3, cx - u * 0.4, baseY - u * 6, cx, stemTop);
    ctx.strokeStyle = 'rgba(50,115,38,0.22)'; ctx.lineWidth = u * 0.58; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();

    // LEAVES
    const n1y = baseY - u * 1.6;
    fanLeaf(ctx, cx - u * 4.6, n1y + u * 0.3, u * 3.0, -0.32, 0.18);
    fanLeaf(ctx, cx + u * 4.6, n1y + u * 0.3, u * 3.0,  0.32, 0.18);
    smallFan(ctx, cx - u * 2.8, n1y - u * 0.2, u * 2.0, -0.18, 0.16);
    smallFan(ctx, cx + u * 2.8, n1y - u * 0.2, u * 2.0,  0.18, 0.16);

    const n2y = baseY - u * 3.6;
    fanLeaf(ctx, cx - u * 5.0, n2y, u * 3.4, -0.38, 0.19);
    fanLeaf(ctx, cx + u * 5.0, n2y, u * 3.4,  0.38, 0.19);
    smallFan(ctx, cx - u * 2.6, n2y - u * 0.4, u * 2.2, -0.22, 0.17);
    smallFan(ctx, cx + u * 2.6, n2y - u * 0.4, u * 2.2,  0.22, 0.17);

    const n3y = baseY - u * 5.6;
    fanLeaf(ctx, cx - u * 5.4, n3y, u * 3.8, -0.42, 0.20);
    fanLeaf(ctx, cx + u * 5.4, n3y, u * 3.8,  0.42, 0.20);
    smallFan(ctx, cx - u * 3.0, n3y - u * 0.5, u * 2.6, -0.25, 0.18);
    smallFan(ctx, cx + u * 3.0, n3y - u * 0.5, u * 2.6,  0.25, 0.18);
    smallFan(ctx, cx - u * 1.4, n3y + u * 0.2, u * 1.8, -0.12, 0.15);
    smallFan(ctx, cx + u * 1.4, n3y + u * 0.2, u * 1.8,  0.12, 0.15);

    const n4y = baseY - u * 7.4;
    fanLeaf(ctx, cx - u * 4.4, n4y, u * 3.2, -0.44, 0.20);
    fanLeaf(ctx, cx + u * 4.4, n4y, u * 3.2,  0.44, 0.20);
    smallFan(ctx, cx - u * 2.2, n4y - u * 0.4, u * 2.4, -0.26, 0.18);
    smallFan(ctx, cx + u * 2.2, n4y - u * 0.4, u * 2.4,  0.26, 0.18);

    const n5y = baseY - u * 9.0;
    fanLeaf(ctx, cx - u * 3.2, n5y, u * 2.8, -0.46, 0.19);
    fanLeaf(ctx, cx + u * 3.2, n5y, u * 2.8,  0.46, 0.19);
    smallFan(ctx, cx - u * 1.6, n5y - u * 0.3, u * 2.0, -0.28, 0.17);
    smallFan(ctx, cx + u * 1.6, n5y - u * 0.3, u * 2.0,  0.28, 0.17);

    const n6y = baseY - u * 10.4;
    fanLeaf(ctx, cx - u * 2.2, n6y, u * 2.2, -0.50, 0.18);
    fanLeaf(ctx, cx + u * 2.2, n6y, u * 2.2,  0.50, 0.18);
    smallFan(ctx, cx - u * 1.0, n6y - u * 0.2, u * 1.6, -0.28, 0.16);
    smallFan(ctx, cx + u * 1.0, n6y - u * 0.2, u * 1.6,  0.28, 0.16);

    apicalBud(ctx, cx, stemTop, u * 2.4, 0.20);

    // Re-draw stem on top
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, baseY);
    ctx.bezierCurveTo(cx + u * 0.5, baseY - u * 3, cx - u * 0.4, baseY - u * 6, cx, stemTop);
    ctx.strokeStyle = 'rgba(60,130,44,0.16)'; ctx.lineWidth = u * 0.32; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }

  let resizeTimer;
  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    drawPottedPlant();
  }

  canvas.style.pointerEvents = 'none';
  canvas.style.willChange    = 'auto'; // no GPU compositing needed — static image

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 120); // debounce — don't thrash on drag
  });

  resize();
})();
