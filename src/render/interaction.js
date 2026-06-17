import { normalizeQuat, quatFromAxisAngle, quatMultiply } from './math3d.js';

export function makeDragRotator(canvas, getQ, setQ, onChange = () => {}, getSpeed = () => 1) {
  if (!canvas) return;
  let dragging = false;
  let px = 0;
  let py = 0;
  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    px = event.clientX;
    py = event.clientY;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    const dx = event.clientX - px;
    const dy = event.clientY - py;
    px = event.clientX;
    py = event.clientY;
    const speed = normalizeDragSpeed(getSpeed());
    const qx = quatFromAxisAngle([1, 0, 0], dy * 0.012 * speed);
    const qy = quatFromAxisAngle([0, 1, 0], dx * 0.012 * speed);
    setQ(normalizeQuat(quatMultiply(qy, quatMultiply(qx, getQ()))));
    onChange();
  });
  const end = event => {
    dragging = false;
    try { canvas.releasePointerCapture?.(event.pointerId); } catch (_) {}
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', end);
}

function normalizeDragSpeed(value) {
  const speed = Number(value);
  if (!Number.isFinite(speed)) return 1;
  return Math.min(1, Math.max(0.18, speed));
}
