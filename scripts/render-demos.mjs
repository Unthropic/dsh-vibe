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
const frameCount = 20;
const delay = 150;
const themes = [
  { id: 'manbo', baseColor: '#ff6ec7', followHarnessColors: false },
  { id: 'aurora', baseColor: '#4dc9ff', followHarnessColors: true },
  { id: 'ocean', baseColor: '#38bdf8', followHarnessColors: false },
  { id: 'ember', baseColor: '#ff6b35', followHarnessColors: false },
  { id: 'synthwave', baseColor: '#ff4fd8', followHarnessColors: false },
];
const prompt =
  process.env.DSH_DEMO_PROMPT ??
  'Write 250 very short numbered tips for making tasteful animated web backgrounds. Do not use tools.';

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

async function assertTheme(theme, hudVisible) {
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const backgrounds = [...document.querySelectorAll('.dsh-vibe-bg')];
      const huds = [...document.querySelectorAll('.dsh-vibe-hud')];
      const state = {
        backgroundThemes: backgrounds.map((element) => element.dataset.vibeTheme),
        hudThemes: huds.map((element) => element.dataset.vibeTheme),
        panelOpen: Boolean(document.querySelector('#dsh-vibe-quick-panel')),
        sidebarExpanded: Boolean(document.querySelector('button[aria-label="Collapse sidebar"]')),
      };
      const valid =
        backgrounds.length === 1 &&
        backgrounds[0].dataset.vibeTheme === ${JSON.stringify(theme)} &&
        huds.length === ${hudVisible ? 1 : 0} &&
        (${hudVisible ? `huds[0].dataset.vibeTheme === ${JSON.stringify(theme)}` : 'true'}) &&
        !state.panelOpen &&
        !state.sidebarExpanded;
      if (!valid) throw new Error('Demo view does not match the requested theme: ' + JSON.stringify(state));
      return true;
    })()`),
  );
}

async function openSettings() {
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      if (document.querySelector('#dsh-vibe-quick-panel')) return true;
      const button = document.querySelector('button[aria-label="Vibe settings"]');
      if (!button) throw new Error('The Vibe settings button is unavailable');
      button.click();
      return true;
    })()`),
  );
  await runBrowser('wait', 'select[aria-label="Vibe theme"]');
}

async function closeSettings() {
  await runBrowser('press', 'Escape');
  await runBrowser('wait', '300');
}

async function setCheckbox(label, checked) {
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const control = [...document.querySelectorAll('.dsh-vibe-toggle')].find(
        (element) => element.textContent.trim() === ${JSON.stringify(label)},
      )?.querySelector('input[type="checkbox"]');
      if (!control) throw new Error('Missing Vibe setting: ' + ${JSON.stringify(label)});
      if (control.checked !== ${JSON.stringify(checked)}) control.click();
      return true;
    })()`),
  );
  await runBrowser('wait', '300');
}

async function snapshotOriginalSettings() {
  await openSettings();
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      function checked(label) {
        const control = [...document.querySelectorAll('.dsh-vibe-toggle')].find(
          (element) => element.textContent.trim() === label,
        )?.querySelector('input[type="checkbox"]');
        if (!control) throw new Error('Missing Vibe setting: ' + label);
        return control.checked;
      }
      window.__dshVibeDemoOriginal = {
        theme: document.querySelector('select[aria-label="Vibe theme"]').value,
        baseColor: document.querySelector('input[aria-label="Base color hex value"]').value,
        followHarnessColors: checked('Follow Harness colors'),
        showThinkingEffects: checked('Show thinking effects'),
      };
      return true;
    })()`),
  );
}

async function setTheme(theme) {
  await openSettings();
  await runBrowser('select', 'select[aria-label="Vibe theme"]', theme.id);
  await runBrowser('wait', '300');
  await runBrowser('fill', 'input[aria-label="Base color hex value"]', theme.baseColor);
  await runBrowser('press', 'Enter');
  await runBrowser('wait', '300');
  await setCheckbox('Follow Harness colors', theme.followHarnessColors);
  await closeSettings();
}

async function restoreOriginalSettings() {
  await openSettings();
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const original = window.__dshVibeDemoOriginal;
      if (!original) return false;
      const select = document.querySelector('select[aria-label="Vibe theme"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, original.theme);
      select.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    })()`),
  );
  await runBrowser('wait', '300');
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const original = window.__dshVibeDemoOriginal;
      const input = document.querySelector('input[aria-label="Base color hex value"]');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, original.baseColor);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.focus();
      return true;
    })()`),
  );
  await runBrowser('wait', '100');
  await runBrowser('press', 'Enter');
  await runBrowser('wait', '300');
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const original = window.__dshVibeDemoOriginal;
      function restore(label, checked) {
        const control = [...document.querySelectorAll('.dsh-vibe-toggle')].find(
          (element) => element.textContent.trim() === label,
        )?.querySelector('input[type="checkbox"]');
        if (!control) throw new Error('Missing Vibe setting: ' + label);
        if (control.checked !== checked) control.click();
      }
      restore('Follow Harness colors', original.followHarnessColors);
      restore('Show thinking effects', original.showThinkingEffects);
      return true;
    })()`),
  );
  await runBrowser('wait', '500');
  await closeSettings();
}

async function preparePrivateDemoView() {
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const button = [...document.querySelectorAll('button[aria-label="New session"]')].find(
        (element) => element.getClientRects().length > 0,
      );
      if (button) button.click();
      return Boolean(button);
    })()`),
  );
  await runBrowser('wait', '1000');
  await runBrowser(
    'eval',
    '-b',
    encodedScript(`(() => {
      const collapse = document.querySelector('button[aria-label="Collapse sidebar"]');
      const expand = document.querySelector('button[aria-label="Expand sidebar"]');
      if (collapse) collapse.click();
      else if (!expand) throw new Error('Could not confirm that the Harness sidebar is collapsed');
      return true;
    })()`),
  );
  await runBrowser('wait', '500');
}

async function startRealThinkingTurn() {
  await runBrowser('fill', 'textarea', prompt);
  await runBrowser('click', 'button[aria-label="Send message"]');
  await runBrowser('wait', '.dsh-vibe-hud');
  await assertHud(true);
}

async function captureFrames(name, start, count, hudVisible) {
  const directory = join(temporary, name);
  await mkdir(directory, { recursive: true });
  await assertTheme(name, hudVisible);
  for (let index = start; index < start + count; index += 1) {
    const frame = join(directory, `frame-${String(index).padStart(3, '0')}.jpg`);
    await runBrowser(
      'screenshot',
      frame,
      '--screenshot-format',
      'jpeg',
      '--screenshot-quality',
      '92',
    );
  }
  await assertTheme(name, hudVisible);
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
      colours: 128,
      delay: frames.map(() => delay),
      dither: 0.7,
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
  await mkdir(join(root, 'assets', 'themes'), { recursive: true });
  let settingsWereCaptured = false;
  try {
    await runBrowser('set', 'viewport', String(captureWidth), String(captureHeight));
    await runBrowser('set', 'media', 'dark');
    await runBrowser('open', url);
    await runBrowser('wait', process.env.DSH_DEMO_SETTLE_MS ?? '10000');
    await assertRealPlugin();
    await assertHud(false);
    await preparePrivateDemoView();
    await snapshotOriginalSettings();
    settingsWereCaptured = true;
    await setCheckbox('Show thinking effects', true);
    await closeSettings();

    for (const theme of themes) {
      await setTheme(theme);
      try {
        await assertHud(true);
      } catch {
        await startRealThinkingTurn();
      }
      await assertTheme(theme.id, true);
      let captured = false;
      for (let attempt = 0; attempt < 3 && !captured; attempt += 1) {
        try {
          await captureFrames(theme.id, 0, frameCount, true);
          captured = true;
        } catch (error) {
          if (attempt === 2) throw error;
          await setTheme(theme);
          try {
            await assertHud(true);
          } catch {
            await startRealThinkingTurn();
          }
        }
      }
    }

    for (const theme of themes) {
      await encodeGif(
        join(temporary, theme.id),
        join(root, 'assets', 'themes', `${theme.id}.gif`),
        frameCount,
      );
    }
  } finally {
    try {
      if (settingsWereCaptured) await restoreOriginalSettings();
    } finally {
      await runBrowser('close').catch(() => {});
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
