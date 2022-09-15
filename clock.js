const perf_hooks = require('perf_hooks');

exports.FPS = class FPS {
  constructor() {
    this.get_now = perf_hooks.performance.now.bind(this);
    this.delta = 0.0;
    this.last_tick = this.get_now();
  }

  tick() {
    const now = this.get_now();
    this.delta = (now - this.last_tick) / 1000;
    this.last_tick = now;
    return this.delta;
  }

  get_fps() {
    return 1 / this.delta;
  }

  get_fps_int() {
    return Math.floor(1 / this.delta);
  }
}

exports.IfTimer = class IfTimer {
  constructor(timeout) {
    this.timeout = timeout;
    this.counter = 0.0;
    this.triggered = 0;
  }

  tick(delta) {
    this.counter += delta;
    while (this.counter > this.timeout) {
      this.triggered++;
      this.counter -= this.timeout;
    }
  }
}
