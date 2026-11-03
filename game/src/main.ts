import Phaser from "phaser";
import { ImpactLaugh } from "./laugh";
import frogUrl from "./frog-sideeye.png?url";
import "./style.css";
import { CONFIG as C, launch, power, rebound } from "./physics";
const $ = (id: string) => document.getElementById(id)!;
let scene: World;
let muted = true;
try {
  muted = localStorage.getItem("frog-muted") !== "false";
} catch {}
export const laugh = new ImpactLaugh();
laugh.setEnabled(!muted);
function sound(f = 400) {
  if (muted) return;
  try {
    const a = new AudioContext(),
      o = a.createOscillator(),
      g = a.createGain();
    o.connect(g);
    g.connect(a.destination);
    o.frequency.setValueAtTime(f, a.currentTime);
    o.frequency.exponentialRampToValueAtTime(f * 0.5, a.currentTime + 0.13);
    g.gain.setValueAtTime(0.06, a.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + 0.15);
    o.start();
    o.stop(a.currentTime + 0.17);
    o.onended = () => {
      void a.close();
    };
  } catch {}
}
function best() {
  try {
    const value = JSON.parse(localStorage.getItem("frog-endless-best") || "null");
    return value &&
      typeof value.distance === "number" &&
      Number.isFinite(value.distance) &&
      value.distance >= 0
      ? value
      : null;
  } catch {
    return null;
  }
}
type Spike = { body: MatterJS.BodyType; nx: number; ny: number; last: number };
class World extends Phaser.Scene {
  frog!: Phaser.Physics.Matter.Image;
  art!: Phaser.GameObjects.Container;
  farthest = 0;
  nextChunk = 0;
  chunks: {end: number; bodies: MatterJS.BodyType[]; art: Phaser.GameObjects.GameObject[]}[] = [];
  grounded = false;
  stable = 0;
  wobble = 0;
  pendingRebound: { x: number; y: number } | null = null;
  held = false;
  charge = 0;
  running = false;
  paused = false;
  won = false;
  elapsed = 0;
  jumps = 0;
  hits = 0;
  falls = 0;
  combo = 0;
  maxCombo = 0;
  lastHit = 0;
  checkpoint = { x: 110, y: 420 };
  spikes: Spike[] = [];
  land: MatterJS.BodyType[] = [];
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  bubble!: Phaser.GameObjects.Text;
  flag!: Phaser.GameObjects.Text;
  constructor() {
    super("world");
  }
  preload() { this.load.image("milk-frog", frogUrl); }
  create() {
    scene = this;
    this.cameras.main.setBounds(0, 0, Number.MAX_SAFE_INTEGER, 640);
    this.cameras.main.setBackgroundColor(0xe7efd8);
    this.extendWorld();
    const g = this.add.graphics();
    g.fillStyle(0xffffff);
    g.fillCircle(25, 25, 24);
    g.generateTexture("body", 50, 50);
    g.destroy();
    this.frog = this.matter.add
      .image(110, 420, "body")
      .setCircle(C.radius)
      .setFriction(0, 0.004, 0)
      .setBounce(0.05)
      .setAlpha(0);
    this.frog.setFixedRotation();
    this.art = this.add.container(110, 420, [
      this.add.image(0, -16, "milk-frog").setDisplaySize(56, 96).setFlipX(true)
    ]);
    this.bubble = this.add
      .text(0, 0, "", { fontSize: "19px", color: "#a84967", fontStyle: "bold" })
      .setDepth(20);
    this.flag = this.add.text(0, 0, "", { fontSize: "12px", color: "#486f48" });
    this.cameras.main.startFollow(this.frog, true, 0.08, 0.08, -180, 0);
    this.keys = this.input.keyboard!.addKeys("SPACE,R,ESC") as typeof this.keys;
    this.input.keyboard!.addCapture(["SPACE"]);
    this.keys.SPACE.on("down", () => this.begin());
    this.keys.SPACE.on("up", () => this.release());
    this.keys.R.on("down", () => this.reset());
    this.keys.ESC.on("down", () => this.pause());
    this.input.on("pointerdown", () => this.begin());
    this.input.on("pointerup", () => this.release());
    this.input.on("pointerupoutside", () => this.cancel());
    this.game.canvas.addEventListener("pointercancel", () => this.cancel());
    this.game.canvas.addEventListener("touchcancel", () => this.cancel());
    window.addEventListener("blur", () => {
      if (this.running && !this.paused) this.pause();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.running && !this.paused) this.pause();
    });
    this.matter.world.on(
      "collisionstart",
      (event: { pairs: MatterJS.ICollisionPair[] }) => {
        for (const p of event.pairs) {
          if (p.bodyA !== this.frog.body && p.bodyB !== this.frog.body)
            continue;
          const other = p.bodyA === this.frog.body ? p.bodyB : p.bodyA,
            s = this.spikes.find((s) => s.body === other);
          if (
            s &&
            this.running &&
            !this.paused &&
            this.time.now - s.last > C.spikeCooldown
          ) {
            s.last = this.time.now;
            const v = this.frog.body as MatterJS.BodyType,
              hit = rebound(v.velocity.x, v.velocity.y, s.nx, s.ny);
            // Collisionstart fires before Matter's velocity solver. Apply after
            // the world step in Scene.update so the solver cannot erase launch.
            this.pendingRebound = hit;
            this.cancel();
            this.stable = 0;
            this.hits++;
            this.combo =
              this.time.now - this.lastHit < 1800 ? this.combo + 1 : 1;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.lastHit = this.time.now;
            this.bubble.setText(
              this.combo > 1 ? `${this.combo} 连弹！` : "哎哟！起飞！",
            );
            this.cameras.main.shake(110, 0.003);
            for (let i = 0; i < 8; i++) {
              const spark = this.add.circle(
                this.frog.x,
                this.frog.y,
                3 + (i % 2),
                i % 2 ? 0xf7d56a : 0xec91aa,
              );
              const angle = (i * Math.PI) / 4;
              this.tweens.add({
                targets: spark,
                x: spark.x + Math.cos(angle) * 48,
                y: spark.y + Math.sin(angle) * 48,
                alpha: 0,
                scale: 0.1,
                duration: 300,
                onComplete: () => spark.destroy(),
              });
            }
            void laugh.hit();
          }
        }
      },
    );
    this.matter.world.pause();
    if (new URLSearchParams(location.search).has("debug"))
      (window as any).__frog = () => ({
        x: this.frog.x,
        y: this.frog.y,
        grounded: this.grounded,
        held: this.held,
        charge: this.charge,
        running: this.running,
        paused: this.paused,
        won: this.won,
        hits: this.hits,
        maxCombo: this.maxCombo,
        rotation: this.frog.rotation,
        vx: (this.frog.body as MatterJS.BodyType).velocity.x,
        vy: (this.frog.body as MatterJS.BodyType).velocity.y,
        jumps: this.jumps,
        falls: this.falls,
        checkpoint: this.checkpoint.x,
        spikes: this.spikes.length, distance: this.farthest, nextChunk: this.nextChunk, chunks: this.chunks.length,
      });
  }
  extendWorld() {
    // Reconcile a bounded window in BOTH directions, rather than a forward-only cursor.
    const center = Math.max(0, this.frog?.x || 0);
    const first = Math.max(0, Math.floor((center - 2400) / 780));
    const last = Math.ceil((center + 2400) / 780) - 1;
    const existing = new Set(this.chunks.map(chunk => chunk.end / 780 - 1));
    for (let index = first; index <= last; index++) {
      if (existing.has(index)) continue;
      const x = index * 780, y = 480;
      this.nextChunk = Math.max(this.nextChunk, index + 1);
      const bodies: MatterJS.BodyType[] = [];
      const art: Phaser.GameObjects.GameObject[] = [];
      const ground = this.matter.add.rectangle(x + 360, y + 150, 720, 300, {isStatic: true, label: "ground", friction: 0, frictionStatic: 0});
      bodies.push(ground); this.land.push(ground);
      art.push(this.add.rectangle(x + 360, y + 150, 720, 300, 0x8ca879), this.add.rectangle(x + 360, y + 7, 720, 14, 0x526f50));
      art.push(this.add.ellipse(x + 240, 100, 160, 35, 0xf7f7e7), this.add.circle(x + 400, 470, 140, 0xc3d8ac).setDepth(-1));
      art.push(this.add.text(x + 25, y + 30, `${Math.round(x / 10)} m`, {fontSize: '16px', color: '#e7efd8'}));
      if (index === 0) {
        art.push(this.add.rectangle(65, y-60, 5, 120, 0x53644b));
        art.push(this.add.triangle(92,y-105,0,0,60,14,0,32,0xe986a0));
        art.push(this.add.text(37,y-150,'起点',{fontSize:'18px',color:'#43543a'}));
      }
      // Touching pairs and clusters, separated by uneven safe landing spaces.
      const patterns = [
        [95,127, 305,337,369, 610],
        [140,172,204,236, 430, 590,622],
        [85, 250,282, 475,507,539],
        [120,152,184, 365,397, 575,607,639],
        [90,122, 315, 490,522,554,586],
      ];
      const offsets = index === 0 ? [350,382, 560,592,624] : patterns[(index * 7 + Math.floor(index / 5)) % patterns.length];
      for (const offset of offsets) {
        const sx = x + offset;
        const spike = this.matter.add.polygon(sx, y - C.spikeRadius, 3, C.spikeRadius, {isStatic:true, isSensor:true, label:'spike', angle:-Math.PI/2-Math.PI/3});
        this.matter.body.translate(spike, {x:0, y:y-spike.bounds.max.y});
        bodies.push(spike); this.spikes.push({body:spike,nx:-1,ny:-0.32,last:-10000});
        art.push(this.add.polygon(0,0,spike.vertices!.map(v=>new Phaser.Geom.Point(v.x,v.y)),0xe986a0).setOrigin(0).setStrokeStyle(2,0xa74f70));
        art.push(this.add.rectangle(sx,y+2,32,5,0x805c63));
      }
      this.chunks.push({end:x+780,bodies,art});
    }
    const keep: typeof this.chunks = [];
    for (const chunk of this.chunks) {
      const index = chunk.end / 780 - 1;
      if (index >= first && index <= last) { keep.push(chunk); continue; }
      for (const body of chunk.bodies) this.matter.world.remove(body);
      this.land = this.land.filter(b=>!chunk.bodies.includes(b));
      this.spikes = this.spikes.filter(s=>!chunk.bodies.includes(s.body));
      chunk.art.forEach(o=>o.destroy());
    }
    this.chunks = keep.sort((a,b)=>a.end-b.end);
    this.spikes.sort((a,b)=>a.body.position.x-b.body.position.x);
  }

  saveDistance() {
    const distance = Math.floor(this.farthest / 10);
    if (distance > (best()?.distance || 0)) {
      try { localStorage.setItem('frog-endless-best', JSON.stringify({distance})); } catch {}
    }
  }
  begin() {
    laugh.unlock();
    if (this.running && !this.paused && this.grounded && !this.held) {
      this.held = true;
      this.charge = 0;
    }
  }
  cancel() {
    this.held = false;
    this.charge = 0;
  }
  release() {
    if (!this.held) return;
    const v = launch(this.charge);
    this.cancel();
    if (v && this.grounded && !this.paused) {
      this.frog.setVelocity(v.x, v.y);
      this.wobble = -0.18;
      this.grounded = false;
      this.stable = 0;
      this.jumps++;
      sound(330);
    }
  }
  reset() {
    laugh.stop();
    laugh.unlock();
    this.saveDistance();
    for (const chunk of this.chunks) {chunk.bodies.forEach(b=>this.matter.world.remove(b)); chunk.art.forEach(o=>o.destroy());}
    this.chunks=[]; this.land=[]; this.spikes=[]; this.nextChunk=0; this.farthest=0;
    this.running = true;
    this.won = false;
    this.paused = false;
    this.elapsed = 0;
    this.jumps = this.hits = this.falls = this.combo = this.maxCombo = 0;
    this.checkpoint = { x: 110, y: 420 };
    this.spikes.forEach((s) => (s.last = -10000));
    this.respawn(false);
    this.extendWorld();
    $("overlay").hidden = true;
    $("pause").textContent = "暂停 Esc";
    this.matter.world.resume();
  }
  respawn(count = true) {
    if (count) { this.falls++; this.saveDistance(); }
    this.cancel();
    this.pendingRebound = null;
    this.frog
      .setPosition(this.checkpoint.x, this.checkpoint.y)
      .setVelocity(0, 0)
      .setAngularVelocity(0)
      .setRotation(0);
    // Recreate a recycled destination before the next Matter step.
    this.extendWorld();
    this.stable = 0;
    this.grounded = false;
  }
  pause() {
    if (!this.running || this.won) return;
    this.paused = !this.paused;
    if (this.paused) laugh.stop();
    this.cancel();
    this.paused ? this.matter.world.pause() : this.matter.world.resume();
    $("pause").textContent = this.paused ? "继续 Esc" : "暂停 Esc";
    $("hint").textContent = this.paused
      ? "已暂停，点击继续"
      : "落稳 → 按住 → 松开";
  }
  update(_: number, delta: number) {
    if (!this.frog) return;
    this.art
      .setPosition(this.frog.x, this.frog.y)
      .setRotation(0);
    this.art.setScale(
      1 + power(this.charge) * 0.25 + this.wobble,
      1 - power(this.charge) * 0.3 - this.wobble,
    );
    this.bubble
      .setPosition(this.frog.x - 50, this.frog.y - 85)
      .setAlpha(this.time.now - this.lastHit < 1000 ? 1 : 0);
    if (!this.running || this.paused) return;
    if (this.pendingRebound) {
      this.frog.setVelocity(this.pendingRebound.x, this.pendingRebound.y);
      this.frog.setAngularVelocity(0);
      this.pendingRebound = null;
      this.wobble = -0.22;
    }
    this.wobble *= Math.pow(0.83, delta / 16.667);
    this.elapsed += Math.min(delta, 50) / 1000;
    const b = this.frog.body as MatterJS.BodyType;
    const floor = this.land.some(
      (p) =>
        this.frog.x >= p.bounds.min.x &&
        this.frog.x <= p.bounds.max.x &&
        Math.abs(this.frog.y + C.radius - p.bounds.min.y) < 1.5,
    );
    if (floor && Math.abs(b.velocity.y) < 1) {
      this.frog.setVelocity(0, 0);
      this.stable += delta;
    }
    else this.stable = 0;
    const settled = this.stable > 100;
    if (settled && !this.grounded) this.wobble = 0.16;
    this.grounded = settled;
    if (this.held) {
      if (!floor) this.cancel();
      else this.charge = Math.min(C.chargeMax, this.charge + delta / 1000);
    }
    this.farthest = Math.max(this.farthest, this.frog.x - 110);
    if (this.grounded && this.frog.x > this.checkpoint.x + 600) this.checkpoint = {x: this.frog.x, y: this.frog.y - 30};
    this.extendWorld();
    this.saveDistance();
    if (this.frog.y > 800 || this.frog.x < 10) {
      // A knockback must not teleport the player forward to a later checkpoint.
      const safe = this.land.filter(p=>p.bounds.max.x < this.frog.x).sort((a,b)=>b.bounds.max.x-a.bounds.max.x)[0];
      this.checkpoint = safe ? {x:safe.bounds.max.x-65,y:safe.bounds.min.y-40} : {x:110,y:420};
      this.respawn();
    }
    const pct = Math.round(power(this.charge) * 100);
    $("power").style.width = pct + "%";
    $("percent").textContent = pct + "%";
    $("hint").textContent = this.held
      ? "松开跳跃！"
      : this.grounded
        ? "落稳了，按住蓄力"
        : "飞行中，等待落稳";
    $("stats").textContent =
      `${this.elapsed.toFixed(1)}s · ${Math.floor(this.farthest / 10)} m · 最远 ${best()?.distance || 0} m · 跳 ${this.jumps} · 连弹 ${this.maxCombo} · 弹 ${this.hits} · 落水 ${this.falls}`;

  }
}
function showBest() {
  const b = best();
  $("best").textContent = b
    ? `本机最远 ${b.distance} 米`
    : "第一次冒险，从这里开始。";
}
showBest();
export const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#dcebd5",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: {
    default: "matter",
    matter: { gravity: { y: C.gravity, x: 0 }, enableSleeping: false },
  },
  scene: World,
  render: { antialias: true },
  audio: { noAudio: true },
});
$("play").onclick = () => scene?.reset();
$("pause").onclick = () => scene?.pause();
$("restart").onclick = () => scene?.reset();
$("sound").onclick = () => {
  muted = !muted;
  laugh.setEnabled(!muted);
  laugh.unlock();
  $("sound").textContent = muted ? "声音：关" : "声音：开";
  try {
    localStorage.setItem("frog-muted", String(muted));
  } catch {}
  sound();
};
$("sound").textContent = muted ? "声音：关" : "声音：开";
