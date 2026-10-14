import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const rendererDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'renderer');
const source = (name: string) => readFileSync(path.join(rendererDir, name), 'utf8');

// why: CanvasCore is a classic script global, so tests see it through a loose shape.
type Core = Record<string, any>;

function loadCore(): Core {
  const stub = { setAttribute() {}, appendChild() {}, style: {} };
  const context = vm.createContext({
    document: { createElementNS: () => ({ ...stub, attrs: {}, setAttribute() {} }), getElementById: () => stub },
  });
  vm.runInContext(source('canvas.js'), context);
  return (context as { CanvasCore: Core }).CanvasCore;
}

test('canvas core: canvas.js exposes the shared helpers and a camera factory', () => {
  const core = loadCore();
  for (const name of ['showErrors', 'el', 'copyText', 'create']) {
    assert.equal(typeof core[name], 'function', name);
  }
});

test('canvas core: a created canvas owns the camera, zoom, fit and input', () => {
  const svg = { clientWidth: 800, clientHeight: 600, addEventListener() {} };
  const stage = { style: {}, classList: { add() {}, remove() {} } };
  const world = { setAttribute() {} };
  const pct = { textContent: '' };
  const canvas = loadCore().create({ svg, world, stage, pct, reduceMotion: true });
  for (const name of ['applyCam', 'animateTo', 'fitTarget', 'zoomAt', 'centerZoom', 'bindInput', 'stop']) {
    assert.equal(typeof canvas[name], 'function', name);
  }
  canvas.zoomAt(2, 0, 0);
  assert.equal(canvas.cam.k, 2);
  canvas.centerZoom(1 / 2);
  assert.equal(canvas.cam.k, 1);
  canvas.applyCam();
  assert.equal(pct.textContent, '100%');
  assert.equal(canvas.moved, false);
});

test('canvas core: the clipboard write, zoomAt and showErrors live only in canvas.js', () => {
  const files = readdirSync(rendererDir).filter((name) => name.endsWith('.js'));
  for (const needle of ['navigator.clipboard', 'function zoomAt', 'function showErrors']) {
    const holders = files.filter((name) => source(name).includes(needle));
    assert.deepEqual(holders, ['canvas.js'], needle);
  }
});

test('canvas core: the journey-map drawing file reaches the core through CanvasCore', () => {
  assert.match(source('draw.js'), /globalThis\.CanvasCore/);
});

test('canvas core: the radial drawing file reaches the core through CanvasCore and the layout through RadialLayout', () => {
  assert.match(source('radial-draw.js'), /globalThis\.CanvasCore/);
  assert.match(source('radial-draw.js'), /globalThis\.RadialLayout/);
});

test('wayfinder: the radial drawing file never writes markup', () => {
  const drawing = source('radial-draw.js');
  for (const needle of ['innerHTML', 'outerHTML', 'insertAdjacentHTML', 'document.write']) {
    assert.equal(drawing.includes(needle), false, needle);
  }
});

test('wayfinder: the radial page loads nothing from the network but Google Fonts', () => {
  const page = source('radial.html');
  const hosts = [...page.matchAll(/\b(?:src|href)=["']https?:\/\/([^/"']+)/g)].map((match) => match[1]);
  assert.ok(hosts.length > 0);
  for (const host of hosts) assert.ok(['fonts.googleapis.com', 'fonts.gstatic.com'].includes(host), host);
  assert.match(page, /<!-- wayfinder:renderer -->/);
  assert.match(page, /@@DATA@@/);
  assert.match(page, /@@RENDERER@@/);
});
