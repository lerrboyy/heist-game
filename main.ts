// Moonlit Gallery: The Jade Idol Job — the hand-in program.
//
// This file gathers the finished game and its screenshots into the output
// folder the grader points at, then asks the vendored make.fun library to
// write the dossier that describes the entry. It does no game logic of its
// own; the game lives entirely under game/ and runs from static files.
import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const here = new URL('.', import.meta.url).pathname;
const repoRoot = resolve(here);
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');

const gameDir = join(repoRoot, 'game');
const shotsDir = join(repoRoot, 'screenshots');

function mustExist(path, label) {
  if (!existsSync(path)) {
    throw new Error(`Moonlit Gallery hand-in: missing ${label} at ${path}`);
  }
}

function listFiles(dir, prefix = '') {
  const found = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const rel = prefix ? `${prefix}/${name}` : name;
    if (statSync(p).isDirectory()) found.push(...listFiles(p, rel));
    else found.push(rel);
  }
  return found;
}

function main() {
  mustExist(gameDir, 'game folder');
  mustExist(join(gameDir, 'index.html'), 'game/index.html');
  mustExist(shotsDir, 'screenshots folder');

  mkdirSync(outDir, { recursive: true });

  // Copy the playable game and the screenshots beside it, unchanged.
  cpSync(gameDir, join(outDir, 'game'), { recursive: true });
  cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

  const gameFiles = listFiles(join(outDir, 'game'));
  const shotFiles = listFiles(join(outDir, 'screenshots'));
  console.log(`Moonlit Gallery: copied ${gameFiles.length} game files and ${shotFiles.length} screenshots into ${outDir}`);
  for (const f of shotFiles) {
    const size = statSync(join(outDir, 'screenshots', f)).size;
    console.log(`  screenshot ${f}: ${size} bytes`);
    if (size > 262144) throw new Error(`Screenshot ${f} is ${size} bytes, over the 256 KiB limit`);
  }
  if (shotFiles.length < 3 || shotFiles.length > 4) {
    throw new Error(`Expected 3 or 4 screenshots, found ${shotFiles.length}`);
  }

  // Ask the vendored library to measure the entry and write the dossier.
  const dossier = buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 50331648,
  });
  writeFileSync(join(outDir, 'dossier.json'), dossier);
  console.log(`Moonlit Gallery: dossier.json written (${dossier.length} bytes)`);
}

main();
