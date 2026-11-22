// Moonlit Gallery — keyboard and mouse input.
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    mouse: { x: 0, y: 0, inside: false },
    clicked: null, // {x, y} of the latest click, consumed by the game loop
    pressed: new Set(), // keys pressed since last consume (edge-triggered)
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
    ShiftLeft: 'sneak', ShiftRight: 'sneak',
  };

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    const name = KEYMAP[e.code];
    if (name) keys.add(name);
    if (!e.repeat) state.pressed.add(e.code);
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (name) keys.delete(name);
  });
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    state.mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
    state.mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    state.mouse.inside = true;
  });
  canvas.addEventListener('mouseleave', () => { state.mouse.inside = false; });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    state.clicked = {
      x: (e.clientX - r.left) * (canvas.width / r.width),
      y: (e.clientY - r.top) * (canvas.height / r.height),
    };
  });

  // Movement vector from held keys, normalised.
  state.moveVector = function () {
    let x = 0, y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  };
  state.sneaking = function () { return keys.has('sneak'); };
  // Edge-triggered key: true once per physical press.
  state.wasPressed = function (code) {
    if (state.pressed.has(code)) { state.pressed.delete(code); return true; }
    return false;
  };
  state.consumeClick = function () {
    const c = state.clicked;
    state.clicked = null;
    return c;
  };
  state.clearPressed = function () { state.pressed.clear(); };
  return state;
}
