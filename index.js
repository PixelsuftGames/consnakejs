const fmodex = require('fmodex');
const fmod = require('fmodex/api');
const menu = require('./menu');

const fmod_dll = fmodex.load_fmodex_library((process.platform == 'win32' ? '' : 'lib') + 'fmod');
const FMOD = fmodex.init_fmodpp();
FMOD.CheckErr = function(error_code) {
  if (error_code != fmod.FMOD_OK)
    console.log('error:', fmod.FMOD_ErrorString(error_code));
  return error_code;
}
const system = new FMOD.System();
system.init(32, fmod.FMOD_INIT_NORMAL, null);

var show_fps = !process.argv.includes('--hide-fps');
var size = [80, 25];
if (process.argv.length > 2 && process.argv.slice(-1)[0].includes('x')) {
  const spl = process.argv.slice(-1)[0].split('x');
  size[0] = parseInt(spl[0], 10);
  size[1] = parseInt(spl[1], 10);
}

function on_input(data) {
  input_listeners[0] && input_listeners[0](data);
}
var input_listeners = [undefined];
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');
process.stdin.on('data', on_input);

function push_scene(scene) {
  current_scene = new scene(
    push_scene,
    input_listeners,
    FMOD,
    system,
    show_fps,
    size
  );
  return current_scene;
}
let current_scene;
push_scene(menu.Menu);
