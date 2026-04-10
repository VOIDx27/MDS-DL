// ============================================================
// Synthwave Grid Background Effect (Retro Anime Cyberpunk)
// ============================================================

export function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let time = 0;
  let animationId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const horizon = canvas.height * 0.45;
    const fov = 350;
    
    // Draw horizon glow
    ctx.beginPath();
    ctx.rect(0, horizon - 20, canvas.width, 40);
    const horizonGrad = ctx.createLinearGradient(0, horizon - 20, 0, horizon + 20);
    horizonGrad.addColorStop(0, 'rgba(0, 240, 255, 0)');
    horizonGrad.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
    horizonGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');
    ctx.fillStyle = horizonGrad;
    ctx.fill();

    // Draw Synthwave Sun
    const centerX = canvas.width / 2;
    ctx.beginPath();
    ctx.arc(centerX, horizon, Math.min(canvas.width * 0.15, 200), Math.PI, 0); 
    const sunGrad = ctx.createLinearGradient(0, horizon - 200, 0, horizon);
    sunGrad.addColorStop(0, 'rgba(255, 0, 127, 0.8)'); // Hot Pink top
    sunGrad.addColorStop(1, 'rgba(255, 170, 0, 0.1)'); // Amber bottom
    ctx.fillStyle = sunGrad;
    ctx.fill();

    // Draw horizontal grid lines moving towards us
    const speed = 1.5;
    time = (time + speed) % 20;

    for (let z = 1; z < 80; z += 2) {
      let adjustedZ = z - (time / 20);
      if (adjustedZ <= 0.1) continue;

      const y = horizon + (fov / adjustedZ) * 2;
      if (y > canvas.height) break;
      
      const opacity = Math.min(1, Math.max(0, 1 - (adjustedZ / 50)));
      ctx.strokeStyle = `rgba(255, 0, 127, ${opacity * 0.6})`; // Hot pink horizontals
      ctx.lineWidth = 1 + (1 / adjustedZ) * 2; // thicker as they get closer
      
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw vertical spreading lines
    for (let x = -50; x <= 50; x += 4) {
      let dx = x * 35; // spread offset
      ctx.beginPath();
      // start at horizon, tightly packed
      ctx.moveTo(centerX + (dx * 0.05), horizon); 
      // end at bottom, spread out due to perspective
      ctx.lineTo(centerX + (dx * 4), canvas.height); 
      
      const grad = ctx.createLinearGradient(0, horizon, 0, canvas.height);
      grad.addColorStop(0, 'rgba(0, 240, 255, 0)');
      grad.addColorStop(0.2, 'rgba(0, 240, 255, 0.1)');
      grad.addColorStop(1, 'rgba(0, 240, 255, 0.8)'); // Cyan verticals
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  function animate() {
    draw();
    animationId = requestAnimationFrame(animate);
  }

  window.addEventListener('resize', resize);
  resize();
  animate();
}
