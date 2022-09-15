const path = require('path');
const fmod = require('fmodex/api');
const clock = require('./clock');
const col = require('./colorama');
const game = require('./game');

const music_path = path.join(__dirname, 'media', 'menu.mp3');

exports.Menu = class Menu {
  constructor(
    push_scene,
    input_listeners,
    FMOD,
    system,
    show_fps,
    size
  ) {
    this.input_listeners = input_listeners;
    input_listeners[0] = this.on_input.bind(this);
    this.push_scene = push_scene;
    this.FMOD = FMOD;
    this.system = system;
    this.show_fps = show_fps;
    this.size = size;

    this.welcome_text = `00000 0   0   0   0  0  00000
0     00  0  0 0  0 0   0
00000 0 0 0 00000 000   00000
    0 0  00 0   0 0  0  0
00000 0   0 0   0 0   0 00000`.replace(/0/g, col.BgGreen + ' ' + col.Reset).split('\n');
    this.welcome_x = Math.floor(this.size[0] / 2 - 29 / 2);

    this.start_text = 'Press SPACE To Start...';
    this.text_timer = new clock.IfTimer(1);
    this.start_x = Math.floor(this.size[0] / 2 - this.start_text.length / 2);

    this.ball_pos = [0, 0];
    this.ball_ipos = col.Pos(0, 0);
    this.ball_speed_int = 20;
    this.ball_speed = [this.ball_speed_int, this.ball_speed_int];
    this.ball = String.fromCharCode(0x263A);

    this.music = new this.FMOD.Sound();
    this.channel = new this.FMOD.Channel();
    this.system.createSound(music_path, fmod.FMOD_DEFAULT, null, this.music);
    this.music.setMode(fmod.FMOD_LOOP_NORMAL);
    this.system.playSound(this.music, null, false, this.channel);

    process.stdout.write(col.Pos(0, 0) + col.Reset + col.Clear);
    this.update_bind = this.update.bind(this);
    this.clock = new clock.FPS;
    setImmediate(this.update_bind);
  }

  destroy() {
    this.music.release();
  }

  on_input(data) {
    const code = data.charCodeAt(0);
    if (data == '\u0003' || code == 0x1B) {
      process.stdin.pause();
      this.destroy();
      this.system.close();
      this.system.release();
      process.exit(0);
      return;
    } else if (data == ' ') {
      this.destroy();
      this.update_bind = this.push_scene(game.Game).update_bind;
      return;
    }
    // console.log(data.length, data.charCodeAt(0), data.charCodeAt(1), data.charCodeAt(2), data.charCodeAt(3));
  }

  update() {
    const delta = this.clock.tick();
    this.text_timer.tick(delta);

    this.ball_pos[0] += this.ball_speed[0] * delta;
    this.ball_pos[1] += this.ball_speed[1] * delta;
    if (this.ball_pos[0] < 0) {
      this.ball_speed[0] = this.ball_speed_int;
      this.ball_pos[0] = 0;
    } else if (this.ball_pos[0] - 1 > this.size[0]) {
      this.ball_speed[0] = -this.ball_speed_int;
      this.ball_pos[0] = this.size[0];
    }
    if (this.ball_pos[1] < 0) {
      this.ball_speed[1] = this.ball_speed_int;
      this.ball_pos[1] = 0;
    } else if (this.ball_pos[1] - 1 > this.size[1]) {
      this.ball_speed[1] = -this.ball_speed_int;
      this.ball_pos[1] = this.size[1];
    }

    var result = this.ball_ipos + col.Reset + ' ' + col.Pos(this.start_x, 10);
    if (this.text_timer.triggered % 2) {
      result += col.FgBlack + col.BgGreen + this.start_text;
    } else {
      this.text_timer.triggered = 0;
      result += col.Reset + col.FgGreen + this.start_text;
    }
    if (this.show_fps) {
      result += col.Pos(0, 0) + col.Reset + col.FgGreen + 'FPS: ' + this.clock.get_fps_int() + '   ';
    }
    for (var i = 0; i < 5; i++) {
      result += col.Pos(this.welcome_x, i + 1) + this.welcome_text[i];
    }
    this.ball_ipos = col.Pos(Math.floor(this.ball_pos[0]), Math.floor(this.ball_pos[1]));
    result += this.ball_ipos + col.FgBlue + this.ball;
    result += col.Pos(0, 0);

    process.stdout.write(result);
    setImmediate(this.update_bind);
  }
}
