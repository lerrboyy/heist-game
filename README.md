# Moonlit Gallery: The Jade Idol Job

[![bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/lerrboyy/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/lerrboyy/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A top-down museum heist game, built for the make.fun bounty
[“Make the best heist game”](https://make.fun/bounty/best-heist-game-20261122-0559).

You are **Wren**, a cat burglar in a plum cloak, slipping into a grand gallery
at night. The **Jade Idol** glows on its central plinth, ringed by a laser
grid. Three smaller treasures wait on side plinths: a gold scarab, a pearl
necklace, a jade vase. Three night watchmen patrol with wide amber vision
cones, two brass Argus cameras sweep the floor, and moonbeams from the
skylight leave you exposed. Take the Idol, then escape up the skylight rope.

## How to play

- Slip past the watchmen — their amber cones stop at plinths, columns,
  benches and palms, so what the cone cannot reach is hidden.
- A guard who glimpses you at the edge of its cone grows suspicious (`?`)
  and comes to look. A guard who sees you clearly (`!`) chases you. If one
  touches you, you lose a nerve pip and wake up back at the service door.
- Cameras sweep pale arcs across the floor. Time your crossing, or hide
  behind a plinth while the arc passes.
- The **ALARM** meter rises while any guard or camera can see you, and falls
  while you are hidden. At half full the lights dim and the guards walk
  faster. At full the room locks down and every watchman hunts you.
- The laser ring around the Idol has two gaps that open and close on a slow
  timer. Sneak through a gap — or trip the grid and raise the alarm.
- Standing in a moonbeam makes you easy to spot from far away. Sneaking
  (Shift) makes you slower, quieter and harder to see.
- Toss a brass coin (click) to ring on the marble and pull the nearest guard
  over to look. You carry three coins.
- Press **E** beside a plinth to take its treasure. The skylight rope only
  lowers once the Idol is in your hand. Reach it to win. Lose all three
  nerve pips and the gallery keeps its Idol.

## Controls

| Key | Action |
| --- | --- |
| WASD / arrow keys | Move |
| Shift | Sneak (slower, quieter, harder to spot) |
| Mouse + click | Aim and toss a brass coin |
| E | Take a treasure |
| R | Restart the job |
| H | Show / hide the GALLERY GUIDE panel |
| M | Mute |
| Esc / P | Pause |
| Enter | Start |

## Running it

No build step, no network requests — every file is local. Serve the `game/`
folder with any static server and open `index.html`:

```sh
cd game && python3 -m http.server 8000
# open http://localhost:8000/
```

Screenshot scenes (fixed, seeded renders of the game itself):

- `index.html?shot=start` — title screen
- `index.html?shot=play` — mid-play, the richest frame
- `index.html?shot=alarm` — lockdown chase
- `index.html?shot=escape` — the clean getaway

## Files

- `game/index.html` — the page that opens the game
- `game/src/config.js` — tuning numbers
- `game/src/gallery.js` — the room: walls, plinths, palms, lasers, moonbeams
- `game/src/thief.js` — Wren: movement, sneaking, coins, taking treasure
- `game/src/watchmen.js` — the guards: patrol, suspicion, chase, catching
- `game/src/cameras.js` — the Argus lenses
- `game/src/alarm.js` — the alarm meter, lockdown, nerve pips, win/lose
- `game/src/render.js` — all the drawing
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — tiny synthesised sounds (Web Audio, no files)
- `game/src/shots.js` — the fixed screenshot scenes
- `game/src/main.js` — boot and game loop
- `main.ts` — hands the game in to make.fun
- `vendor/makefun-game.ts` — the make.fun library, copied unchanged from the kit

## Licence

See `LICENSE`.
