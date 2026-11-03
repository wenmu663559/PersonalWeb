import { test } from "node:test";
import assert from "node:assert/strict";
import { launch, rebound, CONFIG } from "../src/physics";
test("short taps cannot launch; full and overcharge are capped", () => {
  assert.equal(launch(0.09), null);
  assert.deepEqual(launch(1.5), launch(4));
  assert.ok(launch(0.2)!.x < launch(1)!.x);
});
test("spikes use orientation and clamp even extreme impact", () => {
  const v = rebound(999, 999, 1, -1);
  assert.ok(v.x > 0 && v.y < 0);
  assert.ok(Math.abs(Math.hypot(v.x, v.y) - CONFIG.spikeMax) < 0.001);
  assert.equal(rebound(0, 0, -1, 0).x, -CONFIG.spikeMin);
});
