const path = require('path');
const fmod = require('fmodex/api');
const col = require('./colorama');
const clock = require('./clock');
const menu = require('./menu');
const constants = require('./constants');

const music_path = path.join(__dirname, 'media', 'game.mp3');
const die_path = path.join(__dirname, 'media', 'die.ogg');
const eat_path = path.join(__dirname, 'media', 'eat.ogg');

exports.Game = class Game {
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
    this.game_overed = false;
    this.score = 0;

    this.snake = [
      [4, 1],
      [3, 1],
      [2, 1],
      [1, 1]
    ];
    this.last_dir = 0;
    this.dir = 0;
    this.timer = new clock.IfTimer(constants.start_speed);

    this.apple_char = String.fromCharCode(0x2022);
    this.apple_pos = [0, 0];
    this.spawn_apple();

    this.music = new this.FMOD.Sound();
    this.die_sound = new this.FMOD.Sound();
    this.eat_sound = new this.FMOD.Sound();
    this.channel = new this.FMOD.Channel();
    this.die_channel = new this.FMOD.Channel();
    this.eat_channel = new this.FMOD.Channel();
    this.system.createSound(music_path, fmod.FMOD_DEFAULT, null, this.music);
    this.system.createSound(die_path, fmod.FMOD_DEFAULT, null, this.die_sound);
    this.system.createSound(eat_path, fmod.FMOD_DEFAULT, null, this.eat_sound);
    this.music.setMode(fmod.FMOD_LOOP_NORMAL);
    this.die_sound.setMode(fmod.FMOD_LOOP_OFF);
    this.eat_sound.setMode(fmod.FMOD_LOOP_OFF);
    this.system.playSound(this.music, null, false, this.channel);
    this.channel.setVolume(0.75);

    this.update_bind = this.update.bind(this);
    this.has_init = false;
    this.clock = new clock.FPS;
  }

  game_over() {
    if (this.game_overed)
      return;
    this.game_overed = true;
    this.music && this.music.release();
    this.music = null;
    this.update_bind = function() {}
    if (this.die_sound) {
      this.system.playSound(this.die_sound, null, false, this.die_channel);
      this.die_channel.setVolume(3.0);
    }
    setTimeout(function() {
      this.destroy();
      this.push_scene(menu.Menu);
    }.bind(this), 1620 + 1000);
  }

  includes_array(array, includer) {
    for (var i = 0; i < array.length; i++) {
      if (array[i][0] == includer[0] && array[i][1] == includer[1])
        return true;
    }
    return false;
  }

  spawn_apple() {
    var pos = [Math.floor(Math.random() * (this.size[0] - 3)), Math.floor(Math.random() * (this.size[1] - 3))];
    while (this.includes_array(this.snake, pos)) {
      pos = [Math.floor(Math.random() * (this.size[0] - 3)), Math.floor(Math.random() * (this.size[1] - 3))];
    }
    this.apple_pos = pos;
  }

  destroy() {
    this.music && this.music.release();
    this.die_sound && this.die_sound.release();
    this.eat_sound && this.eat_sound.release();
    this.music = null;
    this.die_sound = null;
    this.eat_sound = null;
  }

  init_console() {
    var result = col.Pos(0, 0) + col.Clear;
    for (var i = 1; i < this.size[1]; i++) {
      result += col.Pos(0, i);
      result += col.BgBlue + ' ';
      result += col.BgBlack + ' '.repeat(this.size[0] - 2);
      result += col.BgBlue + ' ';
    }
    result += col.Pos(0, 0) + col.BgBlue + ' '.repeat(this.size[0]);
    result += col.Pos(0, this.size[1]) + col.BgBlue + ' '.repeat(this.size[0]) + col.Pos(0, 0);
    process.stdout.write(result);
  }

  on_input(data) {
    const code = data.charCodeAt(0);
    const code1 = data.charCodeAt(1);
    const code2 = data.charCodeAt(2);
    if (code == 0x1B && code1 == 0x5B) {
      switch (code2) {
        // right -> down -> left -> up
        case 0x43:
          if (this.last_dir == 1 || this.last_dir == 3)
            this.dir = 0;
          break;
        case 0x42:
          if (this.last_dir == 0 || this.last_dir == 2)
            this.dir = 1;
          break;
        case 0x44:
          if (this.last_dir == 1 || this.last_dir == 3)
            this.dir = 2;
          break;
        case 0x41:
          if (this.last_dir == 0 || this.last_dir == 2)
            this.dir = 3;
          break;
      }
      return;
    }
    if (data == '\u0003') {
      process.stdin.pause();
      this.destroy();
      this.system.close();
      this.system.release();
      process.exit(0);
      return;
    } else if (code == 0x1B && !code1) {
      this.update_bind = function() {}
      this.destroy();
      this.push_scene(menu.Menu);
      return;
    }
  }

  update() {
    const delta = this.clock.tick();
    this.timer.tick(delta);
    if (!this.has_init) {
      this.init_console();
      this.has_init = true;
    }
    var result = '';

    if (this.timer.triggered) {
      this.timer.triggered--;
      this.last_dir = this.dir;
      const start_pop = this.snake.pop(-1);
      result += col.PPos(start_pop[0], start_pop[1]) + col.BgBlack + ' ';
      switch (this.dir) {
        case 0:
          this.snake.unshift([this.snake[0][0] + 1, this.snake[0][1]]);
          if (this.snake[0][0] > this.size[0] - 3)
            this.game_over();
          break;
        case 1:
          this.snake.unshift([this.snake[0][0], this.snake[0][1] + 1]);
          if (this.snake[0][1] > this.size[1] - 3)
            this.game_over();
          break;
        case 2:
          this.snake.unshift([this.snake[0][0] - 1, this.snake[0][1]]);
          if (this.snake[0][0] < 0)
            this.game_over();
          break;
        case 3:
          this.snake.unshift([this.snake[0][0], this.snake[0][1] - 1]);
          if (this.snake[0][1] < 0)
            this.game_over();
          break;
      }
      for (var i = 1; i < this.snake.length; i++) {
        if (this.snake[i][0] == this.snake[0][0] && this.snake[i][1] == this.snake[0][1])
          this.game_over();
      }
      if (this.snake[0][0] == this.apple_pos[0] && this.snake[0][1] == this.apple_pos[1]) {
        this.score++;
        this.timer.timeout = Math.max(
          this.timer.timeout - (constants.change_speed * this.timer.timeout),
          constants.max_speed
        );
        this.snake.push(start_pop);
        this.spawn_apple();
        if (this.eat_sound) {
          this.system.playSound(this.eat_sound, null, false, this.eat_channel);
          this.eat_channel.setVolume(4.0);
        }
        const music_speed = (this.timer.timeout - constants.max_speed / constants.start_speed) *
          (constants.max_music_speed - 1) + 1;
        this.music && this.channel.setFrequency(music_speed * 44100);
      }
      result += col.PPos(this.snake[1][0], this.snake[1][1]) + col.BgGreen + ' ';
      result += col.PPos(this.snake[0][0], this.snake[0][1]) + col.BgRed + ' ';
    }

    result += col.PPos(this.apple_pos[0], this.apple_pos[1]) + col.BgBlack + col.FgRed + this.apple_char;

    const score_text = 'Score: ' + this.score;
    result += col.Pos(this.size[0] - score_text.length + 1, 0) + col.BgBlue + col.FgGreen + score_text;
    if (this.show_fps) {
      result += col.Pos(0, 0) + 'FPS: ' + this.clock.get_fps_int() + '   ';
    }
    result += col.Pos(0, 0);
    process.stdout.write(result);
    setImmediate(this.update_bind);
  }
}
