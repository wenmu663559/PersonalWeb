import laughUrl from './naiwa-laugh.mp3?url';

// One looping source: new hits reschedule its stop, never overlap or restart it.
export class ImpactLaugh {
  private context?: AudioContext;
  private buffer?: Promise<AudioBuffer>;
  private source?: AudioBufferSourceNode;
  private generation = 0;
  private enabled = false;
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }
  unlock() {
    if (!this.enabled) return;
    this.context ??= new AudioContext();
    void this.context.resume().catch(() => {});
    this.buffer ??= fetch(laughUrl)
      .then(r => { if (!r.ok) throw new Error('Laugh audio unavailable'); return r.arrayBuffer(); })
      .then(bytes => this.context!.decodeAudioData(bytes));
    void this.buffer.catch(() => { this.buffer = undefined; });
  }
  async hit() {
    if (!this.enabled) return;
    this.unlock();
    const generation = this.generation;
    try {
      const buffer = await this.buffer;
      if (!buffer || !this.enabled || generation !== this.generation || !this.context) return;
      if (!this.source) {
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        const gain = this.context.createGain();
        gain.gain.value = 0.65;
        source.connect(gain).connect(this.context.destination);
        source.onended = () => {
          if (this.source === source) this.source = undefined;
          source.disconnect(); gain.disconnect();
        };
        this.source = source;
        source.start();
      }
      this.source.stop(this.context.currentTime + 3);
    } catch { /* An unavailable sound must never interrupt gameplay. */ }
  }
  stop() {
    this.generation++;
    this.source?.stop();
    this.source = undefined;
  }
  get playing() { return !!this.source; }
}
