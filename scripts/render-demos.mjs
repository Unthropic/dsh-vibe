// Capture the real plugin inside a running DeepSeek Harness web UI and encode
// the resulting screenshots as the README demos.
//
// Usage:
//   DSH_DEMO_URL=http://127.0.0.1:3081/ npm run demos:render
import { spawn } from 'node:child_process';
import { Buffer } from 'node:buffer';
import { mkdir, readFile, rm, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const temporary = join(root, '.demo-tmp');
const browserSuffix = {
  'darwin-arm64': 'darwin-arm64',
  'darwin-x64': 'darwin-x64',
  'linux-arm64': 'linux-arm64',
  'linux-x64': 'linux-x64',
  'win32-x64': 'win32-x64.exe',
}[`${process.platform}-${process.arch}`];
if (browserSuffix === undefined) {
  throw new Error(`Unsupported demo-capture platform: ${process.platform}-${process.arch}`);
}
const browser = join(
  root,
  'node_modules',
  'agent-browser',
  'bin',
  `agent-browser-${browserSuffix}`,
);
const session = `dsh-vibe-demo-${process.pid}`;
const url = process.env.DSH_DEMO_URL ?? 'http://127.0.0.1:3081/';
const captureWidth = 1280;
const captureHeight = 720;
const outputWidth = 720;
const outputHeight = 405;
const backgroundFrameCount = 24;
const thinkingFrameCount = 20;
const delay = 150;
const prompt =
  process.env.DSH_DEMO_PROMPT ??
  'Explain animated CSS auroras in exactly 30 short numbered points. Do not use tools.';

async function runBrowser(...args) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(browser, ['--session', session, ...args], {
      stdio: ['ignore', 'ignore', 'inherit'],
    });
    child.once('error', reject);
    child.once('exit', (code) => {
      if (code === 0) resolvePromise();
      else reject(new Error(`agent-browser ${args[0]} exited with code ${code}`));
    });
  });
}

function encodedScript(script) {
  return Buffer.from(script).toString('base64');
}

async function assertRealPlugin() {
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const state = {
      background: Boolean(document.querySelector('.dsh-vibe-bg')),
      styles: Boolean(document.querySelector('style[data-plugin="dsh-vibe"]')),
      harness: Boolean(document.querySelector('textarea, [contenteditable="true"]'))
      };
      if (!state.background || !state.styles || !state.harness) {
        throw new Error('Not a loaded DeepSeek Harness UI with dsh-vibe enabled: ' + JSON.stringify(state));
      }
      return true;
    })()`),
  );
}

async function assertHud(visible) {
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const visible = Boolean(document.querySelector('.dsh-vibe-hud'));
      if (visible !== ${JSON.stringify(visible)}) {
        throw new Error('Expected the real thinking HUD to be ${visible ? 'visible' : 'hidden'}, but it was ' + (visible ? 'visible' : 'hidden'));
      }
      return true;
    })()`),
  );
}

async function startRealThinkingTurn() {
  await runBrowser('fill', 'textarea', prompt);
  await runBrowser('click', 'button[aria-label="Send message"]');
  await runBrowser('wait', '.dsh-vibe-hud');
  await assertHud(true);
}

async function captureFrames(name, count) {
  const directory = join(temporary, name);
  await mkdir(directory, { recursive: true });
  for (let index = 0; index < count; index += 1) {
    const frame = join(directory, `frame-${String(index).padStart(3, '0')}.jpg`);
    await runBrowser(
      'screenshot',
      frame,
      '--screenshot-format',
      'jpeg',
      '--screenshot-quality',
      '94',
    );
  }
  return directory;
}

async function encodeGif(directory, output, count) {
  const frames = await Promise.all(
    Array.from({ length: count }, (_, index) =>
      readFile(join(directory, `frame-${String(index).padStart(3, '0')}.jpg`)).then((frame) =>
        sharp(frame).resize(outputWidth, outputHeight).png().toBuffer(),
      ),
    ),
  );
  await sharp(frames, { join: { animated: true } })
    .gif({
      colours: 192,
      delay: frames.map(() => delay),
      dither: 0.85,
      effort: 10,
      interFrameMaxError: 8,
      interPaletteMaxError: 8,
      loop: 0,
      reuse: false,
    })
    .toFile(output);

  // Decode all pages now so a broken or truncated GIF fails the render command.
  await sharp(output, { animated: true }).raw().toBuffer();
  const info = await stat(output);
  console.log(
    `[demos] wrote ${output.slice(root.length + 1).replaceAll('\\', '/')} (${Math.round(info.size / 1024)} KiB)`,
  );
}

async function main() {
  await rm(temporary, { recursive: true, force: true });
  await mkdir(temporary, { recursive: true });
  try {
    await runBrowser('open', url);
    await runBrowser('set', 'viewport', String(captureWidth), String(captureHeight));
    await runBrowser('set', 'media', 'light');
    await runBrowser('wait', process.env.DSH_DEMO_SETTLE_MS ?? '10000');
    await assertRealPlugin();
    await assertHud(false);

    const backgroundFrames = await captureFrames('background', backgroundFrameCount);
    await startRealThinkingTurn();
    const thinkingFrames = await captureFrames('thinking', thinkingFrameCount);
    await assertHud(true);
    await Promise.all([
      encodeGif(backgroundFrames, join(root, 'assets', 'background.gif'), backgroundFrameCount),
      encodeGif(thinkingFrames, join(root, 'assets', 'thinking.gif'), thinkingFrameCount),
    ]);
  } finally {
    await runBrowser('close').catch(() => {});
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
