(() => {
  const canvas = document.querySelector('.network-bg');
  if (!canvas || !canvas.getContext) return;

  const ctx = canvas.getContext('2d');
  const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const CYAN = '94, 234, 255';
  const LINE_ALPHA = 0.55;
  const NODE_CORE_ALPHA = 0.75;
  const HUB_RATIO = 0.16;

  let width = 0;
  let height = 0;
  let dpr = Math.min(window.devicePixelRatio || 1, 2);
  let nodes = [];
  let maxDist = 170;
  let rafId = null;
  let lastTime = 0;
  let running = false;

  function isMobile() {
    return window.innerWidth < 700;
  }

  function nodeCount() {
    const area = window.innerWidth * window.innerHeight;
    if (isMobile()) {
      return Math.max(14, Math.min(24, Math.round(area / 24000)));
    }
    return Math.max(24, Math.min(58, Math.round(area / 24000)));
  }

  function makeNode() {
    const isHub = Math.random() < HUB_RATIO;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      r: isHub ? 2.2 + Math.random() * 1.1 : 1 + Math.random() * 0.7,
      isHub,
      glowPhase: Math.random() * Math.PI * 2,
      glowSpeed: 0.5 + Math.random() * 0.9,
    };
  }

  function buildNodes() {
    const count = nodeCount();
    nodes = new Array(count).fill(null).map(makeNode);
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    maxDist = isMobile() ? 125 : 170;
    buildNodes();
  }

  function step(node, dt) {
    node.x += node.vx * dt;
    node.y += node.vy * dt;
    const margin = 40;
    if (node.x < -margin) node.x = width + margin;
    if (node.x > width + margin) node.x = -margin;
    if (node.y < -margin) node.y = height + margin;
    if (node.y > height + margin) node.y = -margin;
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = LINE_ALPHA * (1 - dist / maxDist);
          ctx.strokeStyle = `rgba(${CYAN}, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    const t = timestamp / 1000;
    for (const node of nodes) {
      const pulse = Math.sin(t * node.glowSpeed + node.glowPhase) * 0.5 + 0.5;
      const glowAlpha = node.isHub ? 0.2 + pulse * 0.35 : 0.12 + pulse * 0.22;
      const glowR = node.isHub ? 16 + pulse * 6 : 9;

      const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR);
      gradient.addColorStop(0, `rgba(${CYAN}, ${glowAlpha.toFixed(3)})`);
      gradient.addColorStop(1, `rgba(${CYAN}, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(node.x, node.y, glowR, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(${CYAN}, ${NODE_CORE_ALPHA})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function frame(timestamp) {
    const dt = lastTime ? Math.min((timestamp - lastTime) / 16.6667, 4) : 1;
    lastTime = timestamp;
    for (const node of nodes) step(node, dt);
    draw(timestamp);
    if (running) rafId = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastTime = 0;
    rafId = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
  }

  function applyMotionPreference() {
    if (reduceMotionQuery.matches) {
      stop();
      draw(0);
    } else if (document.visibilityState === 'visible') {
      start();
    }
  }

  resize();
  applyMotionPreference();

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      applyMotionPreference();
    }, 200);
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stop();
    } else {
      applyMotionPreference();
    }
  });

  if (reduceMotionQuery.addEventListener) {
    reduceMotionQuery.addEventListener('change', applyMotionPreference);
  }
})();
