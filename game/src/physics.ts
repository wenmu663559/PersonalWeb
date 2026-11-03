export const CONFIG = {
  chargeMin: 0.1,
  chargeFull: 1.5,
  chargeMax: 1.8,
  angle: 45,
  speedMin: 5,
  speedMax: 16,
  gravity: 1.1,
  radius: 24,
  spikeRadius: 28 * 2 / 3,
  spikeMin: 15,
  spikeMax: 19,
  spikeCooldown: 350,
  worldWidth: 6100,
};
export const power = (seconds: number) =>
  Math.max(0, Math.min(1, seconds / CONFIG.chargeFull));
export function launch(seconds: number) {
  if (seconds < CONFIG.chargeMin) return null;
  const p = power(seconds),
    s =
      CONFIG.speedMin +
      (CONFIG.speedMax - CONFIG.speedMin) * p * p * (3 - 2 * p),
    a = (CONFIG.angle * Math.PI) / 180;
  return { x: Math.cos(a) * s, y: -Math.sin(a) * s };
}
export function rebound(vx: number, vy: number, nx: number, ny: number) {
  const len = Math.hypot(nx, ny) || 1,
    s = Math.min(
      CONFIG.spikeMax,
      Math.max(CONFIG.spikeMin, Math.hypot(vx, vy) * 0.65 + 9),
    );
  return { x: (nx / len) * s, y: (ny / len) * s };
}
