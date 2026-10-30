/**
 * Optional browser smoke test (Chrome DevTools Protocol, no extra dependencies).
 *
 * Verifies against a real running production build:
 *   - the game page loads without console errors
 *   - Play starts a run and the score climbs
 *   - the canvas actually renders frames
 *   - keyboard input works
 *   - pause freezes the score and resume continues
 *   - a finished run is written to localStorage
 *   - the mobile layout has no horizontal overflow
 *
 * Usage:
 *   1. npm run build && npm start -- -p 3123
 *   2. node scripts/smoke-test.mjs
 *
 * Set CHROME_PATH if Chrome is not in a default location.
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

const BASE = process.env.SMOKE_URL ?? 'http://localhost:3123';
const DEBUG_PORT = 9333;
const TIMEOUT_MS = 130_000;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const failures = [];
const consoleErrors = [];

function log(message) {
  console.log(message);
}

function check(name, condition, details = '') {
  if (condition) {
    log(`  PASS  ${name}`);
  } else {
    failures.push(`${name}${details ? ` — ${details}` : ''}`);
    log(`  FAIL  ${name}${details ? ` — ${details}` : ''}`);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(fn, { timeout = 10_000, interval = 100 } = {}) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < timeout) {
    try {
      const value = await fn();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await sleep(interval);
  }
  throw new Error(`Timed out after ${timeout}ms${lastError ? `: ${lastError.message}` : ''}`);
}

function findChrome() {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to the Chrome binary.');
  return found;
}

async function launchChrome(profileDir) {
  const chrome = spawn(
    findChrome(),
    [
      '--headless=new',
      `--remote-debugging-port=${DEBUG_PORT}`,
      `--user-data-dir=${profileDir}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--window-size=1280,900',
      'about:blank',
    ],
    { stdio: 'ignore' },
  );
  chrome.on('error', (error) => console.error('Chrome failed to start:', error.message));

  const target = await waitFor(
    async () => {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      const targets = await response.json();
      return targets.find((t) => t.type === 'page');
    },
    { timeout: 20_000, interval: 250 },
  );

  return { chrome, wsUrl: target.webSocketDebuggerUrl };
}

async function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      clearTimeout(timer);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
      return;
    }
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails;
      consoleErrors.push(details.exception?.description ?? details.text);
    }
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(
        message.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
      );
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      consoleErrors.push(message.params.entry.text);
    }
  });

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      nextId += 1;
      const id = nextId;
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`CDP timeout: ${method}`));
      }, 20_000);
      pending.set(id, { resolve, reject, timer });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const result = await send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true,
      userGesture: true,
    });
    if (result.exceptionDetails) {
      throw new Error(result.exceptionDetails.exception?.description ?? result.exceptionDetails.text);
    }
    return result.result.value;
  };

  return { socket, send, evaluate };
}

async function run() {
  const profileDir = await mkdtemp(path.join(tmpdir(), 'glowbound-smoke-'));
  const { chrome, wsUrl } = await launchChrome(profileDir);
  let socket;

  try {
    const page = await connect(wsUrl);
    socket = page.socket;
    const { send, evaluate } = page;

    await send('Runtime.enable');
    await send('Log.enable');
    await send('Page.enable');
    await send('Page.navigate', { url: `${BASE}/games/glowbound` });
    await waitFor(() => evaluate('document.readyState === "complete"'), { timeout: 20_000 });
    await waitFor(() => evaluate('!!document.querySelector("canvas")'));

    log('\nDesktop run');
    const playButton = await waitFor(() =>
      evaluate(`(() => {
        const button = [...document.querySelectorAll('button')].find((b) => /play now/i.test(b.textContent || ''));
        if (!button) return false;
        button.click();
        return true;
      })()`),
    );
    check('Play button starts a run', Boolean(playButton));

    await waitFor(() => evaluate('!!document.querySelector(\'[data-testid="hud-score"]\')'), {
      timeout: 5_000,
    });
    check('HUD appears after starting', true);

    await sleep(1_200);
    const firstScore = Number(
      (await evaluate('document.querySelector(\'[data-testid="hud-score"]\').textContent')).replace(/,/g, ''),
    );
    check('Score increases while playing', firstScore > 0, `score=${firstScore}`);

    const canvasPainted = await evaluate(`(() => {
      const canvas = document.querySelector('canvas');
      const ctx = canvas.getContext('2d');
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const seen = new Set();
      for (let i = 0; i < data.length; i += 4 * 977) {
        seen.add(data[i] + ',' + data[i + 1] + ',' + data[i + 2]);
      }
      return seen.size;
    })()`);
    check('Canvas renders varied pixels', canvasPainted > 8, `${canvasPainted} sampled colours`);

    // Hold ArrowRight: the orb should move without throwing.
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
    await sleep(600);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'ArrowRight', code: 'ArrowRight', windowsVirtualKeyCode: 39, nativeVirtualKeyCode: 39 });
    check('Keyboard input does not error', consoleErrors.length === 0, consoleErrors.join(' | '));

    // Pause / resume.
    await evaluate(`document.querySelector('button[aria-label="Pause game"]').click()`);
    await waitFor(() => evaluate('document.body.innerText.includes("PAUSED")'));
    const pausedAt = await evaluate(`document.body.innerText.match(/Score\\s+([\\d,]+)/)[1]`);
    await sleep(900);
    const stillPaused = await evaluate(`document.body.innerText.match(/Score\\s+([\\d,]+)/)[1]`);
    check('Pause freezes the score', pausedAt === stillPaused, `${pausedAt} -> ${stillPaused}`);

    await evaluate(`[...document.querySelectorAll('button')].find((b) => /^Resume$/.test(b.textContent.trim())).click()`);
    await waitFor(() => evaluate('!document.body.innerText.includes("PAUSED")'));
    check('Resume returns to the arena', true);

    // Let the unattended run end: hazards eventually land three hits.
    log('  ...waiting for the run to end (up to 120s)');
    await waitFor(() => evaluate('!!document.querySelector(\'[data-testid="game-over"]\')'), {
      timeout: 120_000,
      interval: 500,
    });
    check('Game over screen appears', true);

    const stored = await evaluate(`localStorage.getItem('glowbound.progress.v1')`);
    const progress = stored ? JSON.parse(stored) : null;
    const finalScore = Number(
      (await evaluate(`document.querySelector('[data-testid="game-over"]').innerText.match(/([\\d,]+)/)[1]`)).replace(/[,]/g, ''),
    );
    check('Run is saved to localStorage', Boolean(progress) && progress.gamesPlayed >= 1, stored ?? 'no value');
    check(
      'Personal best matches the finished run',
      Boolean(progress) && progress.bestClassic >= finalScore && finalScore > 0,
      `best=${progress?.bestClassic} score=${finalScore}`,
    );

    // Restart from the results screen.
    await evaluate(`[...document.querySelectorAll('button')].find((b) => /play again/i.test(b.textContent)).click()`);
    await waitFor(() => evaluate('!!document.querySelector(\'[data-testid="hud-score"]\')'));
    check('Play again restarts immediately', true);

    log('\nMobile layout');
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await send('Page.navigate', { url: `${BASE}/games/glowbound` });
    await waitFor(() => evaluate('document.readyState === "complete"'), { timeout: 20_000 });
    await sleep(500);

    const layout = await evaluate(`(() => {
      const canvas = document.querySelector('canvas');
      const rect = canvas.getBoundingClientRect();
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        canvasWidth: rect.width,
        canvasHeight: rect.height,
        backingWidth: canvas.width,
        playVisible: [...document.querySelectorAll('button')].some((b) => /play now/i.test(b.textContent || '')),
      };
    })()`);
    check('No horizontal overflow on mobile', layout.scrollWidth <= layout.innerWidth + 1, JSON.stringify(layout));
    check('Canvas fills the arena on mobile', layout.canvasWidth > 300 && layout.canvasHeight > 390, JSON.stringify(layout));
    check('Start screen is usable on mobile', layout.playVisible);

    // Simulate a touch drag across the arena after starting.
    await evaluate(`[...document.querySelectorAll('button')].find((b) => /play now/i.test(b.textContent || '')).click()`);
    await sleep(400);
    const canvasBox = await evaluate(`(() => {
      const rect = document.querySelector('canvas').getBoundingClientRect();
      return { x: rect.x, y: rect.y, w: rect.width, h: rect.height };
    })()`);
    const startX = Math.round(canvasBox.x + canvasBox.w * 0.5);
    const startY = Math.round(canvasBox.y + canvasBox.h * 0.7);
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: startX, y: startY }] });
    for (let step = 1; step <= 6; step += 1) {
      await send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: startX + step * 12, y: startY - step * 10 }],
      });
      await sleep(40);
    }
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(500);
    check('Touch drag runs without errors', consoleErrors.length === 0, consoleErrors.join(' | '));

    check('No console errors during the whole session', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));
  } finally {
    try {
      socket?.close();
    } catch {
      // ignore
    }
    chrome.kill();
    await sleep(500);
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  }

  log('');
  if (failures.length > 0) {
    console.error(`Smoke test failed (${failures.length} check${failures.length === 1 ? '' : 's'}):`);
    for (const failure of failures) console.error(` - ${failure}`);
    process.exitCode = 1;
  } else {
    log('Smoke test passed: gameplay, pause, persistence, mobile layout.');
  }
}

const guard = setTimeout(() => {
  console.error(`Smoke test exceeded ${TIMEOUT_MS}ms`);
  process.exit(1);
}, TIMEOUT_MS);

run().finally(() => clearTimeout(guard));
