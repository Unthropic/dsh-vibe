import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { URL } from 'node:url';

import hostPlugin from '../lib/index.js';

let importSequence = 0;

function visit(node, output = []) {
  if (Array.isArray(node)) {
    for (const child of node) visit(child, output);
    return output;
  }
  if (node === null || typeof node !== 'object') return output;
  output.push(node);
  visit(node.props?.children ?? [], output);
  return output;
}

function collectClasses(node) {
  return visit(node)
    .map((entry) => entry.props?.className)
    .filter(Boolean)
    .flatMap((className) => className.split(/\s+/));
}

function nodeText(node) {
  if (Array.isArray(node)) return node.map(nodeText).join('');
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node !== 'object') return String(node);
  return nodeText(node.props?.children ?? []);
}

function findNode(tree, predicate) {
  return visit(tree).find(predicate);
}

function checkboxByLabel(tree, label) {
  const labelNode = findNode(
    tree,
    (node) => node.type === 'label' && nodeText(node).includes(label),
  );
  assert.ok(labelNode, `missing checkbox label: ${label}`);
  const checkbox = findNode(
    labelNode,
    (node) => node.type === 'input' && node.props?.type === 'checkbox',
  );
  assert.ok(checkbox, `missing checkbox for label: ${label}`);
  return checkbox;
}

function settleAsyncWrites() {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

function createReactMock() {
  const states = [];
  let stateCursor = 0;
  return {
    Fragment: Symbol('Fragment'),
    beginRender() {
      stateCursor = 0;
    },
    createElement(type, props, ...children) {
      const mergedProps = { ...(props ?? {}), children };
      return typeof type === 'function' ? type(mergedProps) : { type, props: mergedProps };
    },
    useEffect(effect) {
      effect();
    },
    useRef(value) {
      return { current: value };
    },
    useState(initialValue) {
      const index = stateCursor;
      stateCursor += 1;
      if (!(index in states)) {
        states[index] = typeof initialValue === 'function' ? initialValue() : initialValue;
      }
      return [
        states[index],
        (next) => {
          states[index] = typeof next === 'function' ? next(states[index]) : next;
        },
      ];
    },
    useSyncExternalStore(_subscribe, getSnapshot) {
      return getSnapshot();
    },
  };
}

function createSettingsScope(value, overrides = {}) {
  let snapshot = {
    status: 'ready',
    value,
    base: undefined,
    user: undefined,
    revision: 0,
    writable: true,
    mode: 'host',
    ...overrides,
  };
  const calls = [];
  return {
    calls,
    scope: {
      getSnapshot() {
        return snapshot;
      },
      subscribe() {
        return () => {};
      },
      async set(field, nextValue) {
        calls.push({ method: 'set', field, value: nextValue });
      },
      async unset(field) {
        calls.push({ method: 'unset', field });
      },
    },
    update(nextValue, nextOverrides = {}) {
      snapshot = { ...snapshot, value: nextValue, ...nextOverrides };
    },
  };
}

async function loadClientPlugin({ styleAlreadyPresent = false } = {}) {
  let definition;
  const existingStyle = {
    type: 'style',
    dataset: { plugin: 'dsh-vibe' },
    textContent: 'existing dsh-vibe styles',
  };
  const styles = styleAlreadyPresent ? [existingStyle] : [];
  const audioInstances = [];
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;

  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        definition = value;
      },
    },
    addEventListener() {},
    removeEventListener() {},
    innerHeight: 900,
    innerWidth: 1440,
    Audio: class MockAudio {
      constructor(src) {
        this.src = src;
        this.loop = false;
        this.preload = '';
        this.volume = 1;
        this.currentTime = 0;
        this.paused = true;
        this.playCalls = 0;
        this.pauseCalls = 0;
        audioInstances.push(this);
      }
      play() {
        this.playCalls += 1;
        this.paused = false;
        return Promise.resolve();
      }
      pause() {
        this.pauseCalls += 1;
        this.paused = true;
      }
    },
  };
  globalThis.document = {
    querySelector(selector) {
      if (selector !== 'style[data-plugin="dsh-vibe"]') return null;
      return styles.find((tag) => tag.dataset.plugin === 'dsh-vibe') ?? null;
    },
    createElement(type) {
      return { type, dataset: {}, textContent: '' };
    },
    head: {
      appendChild(tag) {
        styles.push(tag);
      },
    },
  };

  try {
    importSequence += 1;
    await import(`../lib/client.js?test=${importSequence}`);
    assert.ok(definition);
    const react = createReactMock();
    const require = (id) => {
      assert.equal(id, 'react');
      return react;
    };
    const plugin = definition.factory(require);
    return {
      definition,
      plugin,
      react,
      styles,
      audioInstances,
      audioController: globalThis.window.__dshVibeManbo,
    };
  } finally {
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousDocument === undefined) delete globalThis.document;
    else globalThis.document = previousDocument;
  }
}

function applyClientPlugin(plugin, scope) {
  const registrations = [];
  const boundNamespaces = [];
  const ctx = {
    settingsScope: {
      bind(spec) {
        boundNamespaces.push(spec.namespace);
        return scope;
      },
    },
    slots: {
      inject(_name, callback) {
        callback();
      },
      register(options, component) {
        registrations.push({ options, component });
        return () => {};
      },
    },
  };
  plugin.apply(ctx);
  return { boundNamespaces, registrations };
}

function registrationFor(registrations, name) {
  const registration = registrations.find((entry) => entry.options.name === name);
  assert.ok(registration, `missing ${name} registration`);
  return registration;
}

test('host plugin registers true-theme defaults and accepts only the legacy preset enum', () => {
  let injection;
  let registration;
  const ctx = {
    inject(services, callback) {
      injection = services;
      callback({
        settings: {
          register(namespace, schema) {
            registration = { namespace, schema };
          },
        },
      });
    },
  };

  assert.equal(hostPlugin.name, 'dsh-vibe');
  assert.equal(hostPlugin.apply(ctx), undefined);
  assert.deepEqual(injection, ['settings']);
  assert.equal(registration.namespace, 'dsh-vibe');
  const defaults = registration.schema({});
  assert.deepEqual(defaults, {
    showFloatingButton: true,
    showThinkingEffects: true,
    theme: 'aurora',
    followHarnessColors: true,
    playSound: true,
    soundVolume: 0.25,
    baseColor: '#4dc9ff',
  });
  assert.equal(Object.hasOwn(defaults, 'preset'), false);
  assert.deepEqual(
    registration.schema({
      showFloatingButton: false,
      showThinkingEffects: false,
      theme: 'synthwave',
      followHarnessColors: false,
      baseColor: '#A1b2C3',
    }),
    {
      showFloatingButton: false,
      showThinkingEffects: false,
      theme: 'synthwave',
      followHarnessColors: false,
      playSound: true,
      soundVolume: 0.25,
      baseColor: '#A1b2C3',
    },
  );
  assert.equal(registration.schema({ preset: 'custom' }).preset, 'custom');
  assert.equal(registration.schema({ theme: 'manbo' }).theme, 'manbo');
  assert.throws(() => registration.schema({ theme: 'adaptive' }));
  assert.throws(() => registration.schema({ preset: 'unknown' }));
  assert.throws(() => registration.schema({ showThinkingEffects: 'false' }));
  assert.throws(() => registration.schema({ followHarnessColors: 'yes' }));
  assert.throws(() => registration.schema({ baseColor: 'blue' }));
  assert.throws(() => registration.schema({ baseColor: '#12345g' }));
  assert.throws(() => registration.schema({ playManboSound: 'yes' }));
  assert.equal(registration.schema({ playManboSound: false }).playManboSound, false);
  assert.throws(() => registration.schema({ playSound: 'yes' }));
  assert.equal(registration.schema({ playSound: false }).playSound, false);
  assert.equal(registration.schema({ soundVolume: 0.6 }).soundVolume, 0.6);
});

test('bundled manbo data URIs are byte-identical to their source assets', () => {
  const clientSource = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8');
  const payloads = [...clientSource.matchAll(/data:image\/webp;base64,([A-Za-z0-9+/=]+)/g)].map(
    (match) => match[1],
  );
  const assetNames = ['brain-off.webp', 'joy.webp', 'loading.webp'];

  assert.equal(payloads.length, assetNames.length);
  for (const [index, assetName] of assetNames.entries()) {
    const asset = readFileSync(new URL(`../assets/manbo/${assetName}`, import.meta.url));
    assert.deepEqual(Buffer.from(payloads[index], 'base64'), asset, assetName);
  }

  const audioPayloads = [
    ...clientSource.matchAll(/data:audio\/mpeg;base64,([A-Za-z0-9+/=]+)/g),
  ].map((match) => match[1]);
  const soundAsset = readFileSync(new URL('../assets/manbo/thinking-loop.mp3', import.meta.url));
  assert.equal(audioPayloads.length, 1);
  assert.deepEqual(Buffer.from(audioPayloads[0], 'base64'), soundAsset, 'thinking-loop.mp3');
});

test('client plugin avoids duplicate styles and registers all three native surfaces', async () => {
  const first = await loadClientPlugin();
  assert.equal(first.definition.id, 'dsh-vibe');
  assert.equal(first.plugin.name, 'dsh-vibe');
  assert.deepEqual(first.plugin.inject, ['slots', 'settingsScope']);
  assert.equal(first.styles.length, 1);
  assert.match(first.styles[0].textContent, /pointer-events: none/);
  assert.match(first.styles[0].textContent, /prefers-reduced-motion: reduce/);
  assert.match(first.styles[0].textContent, /:has\(> \.dsh-vibe-quick\)/);

  const duplicate = await loadClientPlugin({ styleAlreadyPresent: true });
  assert.equal(duplicate.styles.length, 1);
  assert.equal(duplicate.styles[0].textContent, 'existing dsh-vibe styles');

  const settings = createSettingsScope(undefined);
  const applied = applyClientPlugin(first.plugin, settings.scope);
  assert.deepEqual(applied.boundNamespaces, ['dsh-vibe']);
  assert.deepEqual(
    applied.registrations.map((entry) => entry.options),
    [
      { name: 'shell.overlay', id: 'dsh-vibe', order: -100 },
      { name: 'sidebar.footer.action', id: 'dsh-vibe' },
      { name: 'settings.plugin.item', key: 'dsh-vibe' },
    ],
  );
});

test('default overlay remains unchanged and the HUD follows current-session running state', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(undefined);
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  let sessionReads = 0;
  const renderWithState = (state) =>
    overlay.component({
      useSessions(selector) {
        sessionReads += 1;
        return selector(state);
      },
    });

  const idle = renderWithState({
    current: 'session-1',
    byId: { 'session-1': { running: false } },
  });
  const running = renderWithState({
    current: 'session-1',
    byId: { 'session-1': { running: true } },
  });
  const noSession = renderWithState({ current: undefined, byId: {} });

  assert.ok(collectClasses(idle).includes('dsh-vibe-bg'));
  assert.ok(!collectClasses(idle).includes('dsh-vibe-hud'));
  assert.ok(collectClasses(running).includes('dsh-vibe-bg'));
  assert.ok(collectClasses(running).includes('dsh-vibe-hud'));
  assert.ok(!collectClasses(noSession).includes('dsh-vibe-hud'));
  assert.equal(sessionReads, 3);

  const background = findNode(idle, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(background.props['data-vibe-theme'], 'aurora');
  assert.deepEqual(background.props.style, {});
  assert.equal(background.props.style['--dsh-vibe-primary'], undefined);
  assert.equal(background.props.style['--dsh-vibe-secondary'], undefined);
  assert.equal(background.props.style['--dsh-vibe-tertiary'], undefined);
});

test('disabling thinking effects keeps the background and skips session reads', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'ember',
      followHarnessColors: false,
      baseColor: '#ff6b35',
    },
    { user: { showThinkingEffects: true, theme: 'ember' } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  let sessionReads = 0;
  const slots = {
    useSessions(selector) {
      sessionReads += 1;
      return selector({ current: 'session-1', byId: { 'session-1': { running: true } } });
    },
  };
  const enabledTree = overlay.component(slots);

  assert.ok(collectClasses(enabledTree).includes('dsh-vibe-bg'));
  assert.ok(collectClasses(enabledTree).includes('dsh-vibe-ember-heat'));
  assert.ok(collectClasses(enabledTree).includes('dsh-vibe-hud'));
  assert.equal(sessionReads, 1);

  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: false,
      theme: 'ember',
      followHarnessColors: false,
      baseColor: '#ff6b35',
    },
    { user: { showThinkingEffects: false, theme: 'ember' } },
  );
  const disabledTree = overlay.component(slots);

  assert.ok(collectClasses(disabledTree).includes('dsh-vibe-bg'));
  assert.ok(collectClasses(disabledTree).includes('dsh-vibe-ember-heat'));
  assert.ok(!collectClasses(disabledTree).includes('dsh-vibe-hud'));
  assert.equal(sessionReads, 1);
});

test('each theme renders its own background and running HUD structure', async () => {
  const { plugin } = await loadClientPlugin();
  const expectations = {
    aurora: { background: 'dsh-vibe-stars', hud: 'dsh-vibe-grid' },
    ocean: { background: 'dsh-vibe-caustics', hud: 'dsh-vibe-sonar' },
    ember: { background: 'dsh-vibe-ember-heat', hud: 'dsh-vibe-energy-frame' },
    synthwave: { background: 'dsh-vibe-synth-sun', hud: 'dsh-vibe-retro-frame' },
    manbo: { background: 'dsh-vibe-manbo-sky', hud: 'dsh-vibe-manbo-chant' },
  };
  const structures = new Set();

  for (const [theme, expected] of Object.entries(expectations)) {
    const settings = createSettingsScope(
      {
        showFloatingButton: true,
        showThinkingEffects: true,
        theme,
        followHarnessColors: false,
        baseColor: '#123456',
      },
      { user: { theme, followHarnessColors: false, baseColor: '#123456' } },
    );
    const { registrations } = applyClientPlugin(plugin, settings.scope);
    const tree = registrationFor(registrations, 'shell.overlay').component({
      useSessions: (selector) =>
        selector({ current: 'session-1', byId: { 'session-1': { running: true } } }),
    });
    const background = findNode(tree, (node) =>
      node.props?.className?.split(' ').includes('dsh-vibe-bg'),
    );
    const hud = findNode(tree, (node) =>
      node.props?.className?.split(' ').includes('dsh-vibe-hud'),
    );
    const classes = collectClasses(tree);

    assert.equal(background.props['data-vibe-theme'], theme);
    assert.ok(classes.includes(expected.background));
    assert.ok(classes.includes(expected.hud));
    assert.ok(hud.props.className.includes(`dsh-vibe-hud-${theme}`));
    structures.add(`${background.props.className}|${hud.props.className}|${expected.background}`);
  }

  assert.equal(structures.size, 5);
});

test('launcher visibility and settings card controls follow the durable settings scope', async () => {
  const { plugin, react } = await loadClientPlugin();
  const settings = createSettingsScope(undefined);
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const launcher = registrationFor(registrations, 'sidebar.footer.action');
  const card = registrationFor(registrations, 'settings.plugin.item');

  react.beginRender();
  const launcherTree = launcher.component({});
  assert.ok(collectClasses(launcherTree).includes('dsh-vibe-quick'));
  const launcherButton = findNode(
    launcherTree,
    (node) => node.type === 'button' && node.props?.['aria-label'] === 'Vibe settings',
  );
  assert.ok(launcherButton);
  assert.equal(launcherButton.props['aria-expanded'], false);

  launcherButton.props.onClick();
  react.beginRender();
  const openLauncherTree = launcher.component({});
  const quickPanel = findNode(
    openLauncherTree,
    (node) => node.props?.role === 'dialog' && node.props?.id === 'dsh-vibe-quick-panel',
  );
  assert.ok(quickPanel);
  assert.equal(checkboxByLabel(quickPanel, 'Show thinking effects').props.checked, true);
  assert.ok(
    !nodeText(quickPanel).includes(
      'Keeps the background; hides the animated HUD while the model is working.',
    ),
  );
  assert.deepEqual(
    visit(quickPanel)
      .filter((node) => node.props?.className === 'dsh-vibe-helper')
      .map(nodeText),
    ['Editing Base color turns this off.'],
  );

  const cardTree = card.component({});
  assert.equal(cardTree.type, 'li');
  assert.ok(collectClasses(cardTree).includes('dsh-vibe-settings-card'));
  assert.ok(nodeText(cardTree).includes('Choose a visual system and adjust its color separately.'));
  assert.ok(nodeText(cardTree).includes('Editing Base color turns this off.'));
  for (const label of ['Aurora', 'Ocean', 'Ember', 'Synthwave', 'Reset to defaults']) {
    assert.ok(nodeText(cardTree).includes(label));
  }
  const themeSelect = findNode(
    cardTree,
    (node) => node.type === 'select' && node.props?.['aria-label'] === 'Vibe theme',
  );
  assert.equal(themeSelect.props.value, 'aurora');
  assert.deepEqual(
    visit(themeSelect)
      .filter((node) => node.type === 'option')
      .map((node) => ({ value: node.props.value, label: nodeText(node) })),
    [
      { value: 'aurora', label: 'Aurora' },
      { value: 'ocean', label: 'Ocean' },
      { value: 'ember', label: 'Ember' },
      { value: 'synthwave', label: 'Synthwave' },
      { value: 'manbo', label: 'Manbo (曼波)' },
    ],
  );
  assert.ok(findNode(cardTree, (node) => node.type === 'input' && node.props?.type === 'color'));
  assert.equal(visit(cardTree).filter((node) => node.type === 'fieldset').length, 2);
  assert.ok(
    findNode(
      cardTree,
      (node) => node.type === 'input' && node.props?.['aria-label'] === 'Base color hex value',
    ),
  );
  const toggles = visit(cardTree).filter(
    (node) => node.type === 'input' && node.props?.type === 'checkbox',
  );
  assert.equal(toggles.length, 3);
  assert.equal(checkboxByLabel(cardTree, 'Follow Harness colors').props.checked, true);
  assert.equal(checkboxByLabel(cardTree, 'Show thinking effects').props.checked, true);
  assert.equal(checkboxByLabel(cardTree, 'Show floating Vibe button').props.checked, true);
  assert.equal(
    findNode(cardTree, (node) => node.type === 'label' && nodeText(node).includes('Play sound')),
    undefined,
  );

  settings.update(
    {
      showFloatingButton: false,
      showThinkingEffects: true,
      theme: 'aurora',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
    },
    { user: { showFloatingButton: false } },
  );
  react.beginRender();
  assert.equal(launcher.component({}), null);
});

test('theme, color, Harness-follow, reset, and launcher controls use independent fields', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(undefined);
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const cardTree = registrationFor(registrations, 'settings.plugin.item').component({});

  const themeSelect = findNode(
    cardTree,
    (node) => node.type === 'select' && node.props?.['aria-label'] === 'Vibe theme',
  );
  themeSelect.props.onChange({ target: { value: 'synthwave' } });
  await settleAsyncWrites();
  assert.deepEqual(settings.calls, [
    { method: 'set', field: 'theme', value: 'synthwave' },
    { method: 'unset', field: 'preset' },
  ]);

  const colorPicker = findNode(
    cardTree,
    (node) => node.type === 'input' && node.props?.type === 'color',
  );
  colorPicker.props.onChange({ target: { value: '#ABCDEF' } });

  checkboxByLabel(cardTree, 'Follow Harness colors').props.onChange({
    target: { checked: true },
  });
  checkboxByLabel(cardTree, 'Show thinking effects').props.onChange({
    target: { checked: false },
  });
  checkboxByLabel(cardTree, 'Show floating Vibe button').props.onChange({
    target: { checked: false },
  });

  const reset = findNode(
    cardTree,
    (node) => node.type === 'button' && nodeText(node) === 'Reset to defaults',
  );
  reset.props.onClick();
  await settleAsyncWrites();

  assert.deepEqual(settings.calls, [
    { method: 'set', field: 'theme', value: 'synthwave' },
    { method: 'unset', field: 'preset' },
    { method: 'set', field: 'baseColor', value: '#abcdef' },
    { method: 'set', field: 'followHarnessColors', value: false },
    { method: 'set', field: 'followHarnessColors', value: true },
    { method: 'set', field: 'showThinkingEffects', value: false },
    { method: 'set', field: 'showFloatingButton', value: false },
    { method: 'unset', field: 'showFloatingButton' },
    { method: 'unset', field: 'showThinkingEffects' },
    { method: 'unset', field: 'theme' },
    { method: 'unset', field: 'baseColor' },
    { method: 'unset', field: 'followHarnessColors' },
    { method: 'unset', field: 'playSound' },
    { method: 'unset', field: 'soundVolume' },
    { method: 'unset', field: 'playManboSound' },
    { method: 'unset', field: 'preset' },
  ]);
});

test('first theme change materializes legacy color choices before clearing the preset', async () => {
  const { plugin } = await loadClientPlugin();
  // This is the real Host shape after the new schema defaults an old document:
  // value contains new defaults, while the raw user layer owns only `preset`.
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'aurora',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
      preset: 'ember',
    },
    { user: { preset: 'ember' } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const cardTree = registrationFor(registrations, 'settings.plugin.item').component({});
  const themeSelect = findNode(
    cardTree,
    (node) => node.type === 'select' && node.props?.['aria-label'] === 'Vibe theme',
  );

  assert.equal(themeSelect.props.value, 'ember');
  const baseColor = findNode(
    cardTree,
    (node) => node.type === 'input' && node.props?.type === 'color',
  );
  assert.equal(baseColor.props.value, '#fb7185');

  themeSelect.props.onChange({ target: { value: 'ocean' } });

  // These calls must be initiated synchronously and in this order. Otherwise
  // clearing `preset` briefly exposes schema defaults and changes the color.
  assert.deepEqual(settings.calls, [
    { method: 'set', field: 'followHarnessColors', value: false },
    { method: 'set', field: 'baseColor', value: '#fb7185' },
    { method: 'set', field: 'theme', value: 'ocean' },
    { method: 'unset', field: 'preset' },
  ]);
});

test('saved custom settings apply namespaced color variables to background and HUD', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'aurora',
      followHarnessColors: false,
      baseColor: '#123456',
    },
    { user: { theme: 'aurora', followHarnessColors: false, baseColor: '#123456' } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  const tree = overlay.component({
    useSessions: (selector) =>
      selector({ current: 'session-1', byId: { 'session-1': { running: true } } }),
  });
  const background = findNode(tree, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  const hud = findNode(tree, (node) => node.props?.className?.split(' ').includes('dsh-vibe-hud'));

  assert.deepEqual(background.props.style, {
    '--dsh-vibe-primary': '#123456',
    '--dsh-vibe-secondary': 'hsl(258 65% 42%)',
    '--dsh-vibe-tertiary': 'hsl(162 65% 42%)',
    '--dsh-vibe-accent': '#123456',
  });
  assert.deepEqual(hud.props.style, background.props.style);
});

test('manbo defaults to its rave palette without following Harness colors until the user owns those fields', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
    },
    { user: { theme: 'manbo' } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  const render = () =>
    overlay.component({
      useSessions: (selector) =>
        selector({ current: 'session-1', byId: { 'session-1': { running: true } } }),
    });

  const tree = render();
  const background = findNode(tree, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(background.props['data-vibe-theme'], 'manbo');
  assert.deepEqual(background.props.style, {
    '--dsh-vibe-primary': '#ff6ec7',
    '--dsh-vibe-secondary': 'hsl(11 100% 68%)',
    '--dsh-vibe-tertiary': 'hsl(275 100% 68%)',
    '--dsh-vibe-accent': '#ff6ec7',
  });
  assert.ok(collectClasses(tree).includes('dsh-vibe-manbo-sky'));
  assert.ok(collectClasses(tree).includes('dsh-vibe-manbo-meme'));
  assert.ok(collectClasses(tree).includes('dsh-vibe-manbo-chant'));

  const card = registrationFor(registrations, 'settings.plugin.item').component({});
  assert.equal(checkboxByLabel(card, 'Follow Harness colors').props.checked, false);
  const colorPicker = findNode(
    card,
    (node) => node.type === 'input' && node.props?.type === 'color',
  );
  assert.equal(colorPicker.props.value, '#ff6ec7');

  // Once the user owns a color and the follow toggle, those values win.
  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: false,
      baseColor: '#abcdef',
    },
    { user: { theme: 'manbo', followHarnessColors: false, baseColor: '#abcdef' } },
  );
  const ownTree = render();
  const ownBackground = findNode(ownTree, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(ownBackground.props.style['--dsh-vibe-primary'], '#abcdef');
  assert.equal(ownBackground.props.style['--dsh-vibe-secondary'], 'hsl(258 68% 68%)');
  assert.equal(ownBackground.props.style['--dsh-vibe-tertiary'], 'hsl(162 68% 68%)');

  // ...and an owned follow choice can deliberately re-follow Harness tokens.
  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: true,
      baseColor: '#abcdef',
    },
    { user: { theme: 'manbo', followHarnessColors: true, baseColor: '#abcdef' } },
  );
  const followTree = render();
  const followBackground = findNode(followTree, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(
    followBackground.props.style['--dsh-vibe-primary'],
    'var(--dsw-alias-brand-primary, #4dc9ff)',
  );
});

test('switching themes never persists manbo defaults or disturbs other themes', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(undefined);
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const cardTree = registrationFor(registrations, 'settings.plugin.item').component({});
  const themeSelect = findNode(
    cardTree,
    (node) => node.type === 'select' && node.props?.['aria-label'] === 'Vibe theme',
  );

  themeSelect.props.onChange({ target: { value: 'manbo' } });
  await settleAsyncWrites();
  themeSelect.props.onChange({ target: { value: 'aurora' } });
  await settleAsyncWrites();

  assert.deepEqual(settings.calls, [
    { method: 'set', field: 'theme', value: 'manbo' },
    { method: 'unset', field: 'preset' },
    { method: 'set', field: 'theme', value: 'aurora' },
    { method: 'unset', field: 'preset' },
  ]);
});

test('manbo settings show generic sound controls and migrate the legacy raw setting', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
    },
    { user: { theme: 'manbo' } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const renderCard = () => registrationFor(registrations, 'settings.plugin.item').component({});

  const defaultTree = renderCard();
  assert.equal(checkboxByLabel(defaultTree, 'Play sound').props.checked, true);
  const defaultVolume = findNode(
    defaultTree,
    (node) => node.type === 'input' && node.props?.['aria-label'] === 'Sound volume',
  );
  assert.ok(defaultVolume);
  assert.equal(defaultVolume.props.type, 'range');
  assert.equal(defaultVolume.props.value, 25);
  assert.equal(defaultVolume.props.disabled, false);
  assert.equal(defaultVolume.props['aria-valuetext'], '25%');
  assert.ok(!nodeText(defaultTree).includes('Bouncy'));
  assert.ok(!nodeText(defaultTree).includes('tiny Web Audio synth'));
  assert.deepEqual(
    visit(defaultTree)
      .filter((node) => node.props?.className === 'dsh-vibe-helper')
      .map(nodeText),
    ['Editing Base color turns this off.'],
  );
  assert.equal(
    findNode(defaultTree, (node) => node.type === 'textarea'),
    undefined,
  );
  assert.equal(
    visit(defaultTree).filter((node) => node.type === 'label' && nodeText(node).includes('Manbo'))
      .length,
    0,
  );

  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
      playManboSound: false,
    },
    {
      user: {
        theme: 'manbo',
        playManboSound: false,
      },
    },
  );
  const ownedTree = renderCard();
  assert.equal(checkboxByLabel(ownedTree, 'Play sound').props.checked, false);
  assert.equal(
    findNode(
      ownedTree,
      (node) => node.type === 'input' && node.props?.['aria-label'] === 'Sound volume',
    ).props.disabled,
    true,
  );
});

test('theme sound settings persist generically only while a sound theme is selected', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
      playSound: true,
      soundVolume: 0.25,
    },
    { user: { theme: 'manbo' } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const renderCard = () => registrationFor(registrations, 'settings.plugin.item').component({});

  const cardTree = renderCard();
  const soundCheckbox = checkboxByLabel(cardTree, 'Play sound');
  assert.ok(soundCheckbox);
  assert.equal(
    findNode(cardTree, (node) => node.type === 'textarea'),
    undefined,
  );

  soundCheckbox.props.onChange({ target: { checked: false } });
  await settleAsyncWrites();
  const volume = findNode(
    cardTree,
    (node) => node.type === 'input' && node.props?.['aria-label'] === 'Sound volume',
  );
  volume.props.onChange({ target: { value: '67' } });
  await settleAsyncWrites();
  assert.deepEqual(settings.calls, [
    { method: 'set', field: 'playSound', value: false },
    { method: 'unset', field: 'playManboSound' },
    { method: 'set', field: 'soundVolume', value: 0.67 },
  ]);

  // The extras disappear for other themes.
  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'aurora',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
      playSound: true,
      soundVolume: 0.25,
    },
    { user: { theme: 'aurora' } },
  );
  const auroraTree = renderCard();
  assert.equal(
    findNode(auroraTree, (node) => node.type === 'textarea'),
    undefined,
  );
  assert.equal(
    findNode(auroraTree, (node) => node.type === 'label' && nodeText(node).includes('Play sound')),
    undefined,
  );
  assert.equal(
    findNode(
      auroraTree,
      (node) => node.type === 'input' && node.props?.['aria-label'] === 'Sound volume',
    ),
    undefined,
  );
});

test('bundled Manbo audio is lazy, loops while thinking, updates volume live, and resets on stop', async () => {
  const { plugin, audioInstances, audioController } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'aurora',
      followHarnessColors: true,
      playSound: true,
      soundVolume: 0.25,
      baseColor: '#4dc9ff',
    },
    { user: { theme: 'aurora', playSound: true, soundVolume: 0.25 } },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  const render = (running) =>
    overlay.component({
      useSessions: (selector) =>
        selector({ current: 'session-1', byId: { 'session-1': { running } } }),
    });

  render(true);
  assert.equal(audioInstances.length, 0, 'other themes must not create the player');

  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: false,
      playSound: true,
      soundVolume: 0.25,
      baseColor: '#ff6ec7',
    },
    { user: { theme: 'manbo', playSound: true, soundVolume: 0.25 } },
  );
  render(false);
  assert.equal(audioInstances.length, 0, 'idle Manbo must keep the player lazy');

  render(true);
  assert.equal(audioInstances.length, 1);
  const audio = audioInstances[0];
  assert.match(audio.src, /^data:audio\/mpeg;base64,/);
  assert.equal(audio.loop, true);
  assert.equal(audio.preload, 'auto');
  assert.equal(audio.volume, 0.25);
  assert.equal(audio.playCalls, 1);
  assert.equal(audio.paused, false);
  assert.equal(audioController.playing(), true);

  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: false,
      playSound: true,
      soundVolume: 0.62,
      baseColor: '#ff6ec7',
    },
    { user: { theme: 'manbo', playSound: true, soundVolume: 0.62 } },
  );
  render(true);
  assert.equal(audioInstances.length, 1);
  assert.equal(audio.volume, 0.62);
  assert.equal(audio.playCalls, 1, 'changing volume must not restart the clip');

  audio.currentTime = 4;
  settings.update(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: false,
      playSound: false,
      soundVolume: 0.62,
      baseColor: '#ff6ec7',
    },
    { user: { theme: 'manbo', playSound: false, soundVolume: 0.62 } },
  );
  render(true);
  assert.equal(audio.paused, true);
  assert.equal(audio.currentTime, 0);
  assert.equal(audioController.playing(), false);
});

test('idle and running manbo ignore legacy URLs and render only bundled WebP images', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(
    {
      showFloatingButton: true,
      showThinkingEffects: true,
      theme: 'manbo',
      followHarnessColors: false,
      baseColor: '#ff6ec7',
      playManboSound: true,
      memeImages: ['https://legacy.example/private.png'],
    },
    {
      user: {
        theme: 'manbo',
        followHarnessColors: false,
        baseColor: '#ff6ec7',
        memeImages: ['https://legacy.example/private.png'],
      },
    },
  );
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  const render = (running) =>
    overlay.component({
      useSessions: (selector) =>
        selector({ current: 'session-1', byId: { 'session-1': { running } } }),
    });
  const idle = render(false);
  const running = render(true);
  const idleImages = visit(idle).filter((node) => node.type === 'img');
  const runningImages = visit(running).filter((node) => node.type === 'img');

  assert.equal(idleImages.length, 3);
  assert.ok(collectClasses(idle).includes('dsh-vibe-manbo-meme'));
  assert.ok(!collectClasses(idle).includes('dsh-vibe-manbo-face-stage'));

  const runningClasses = collectClasses(running);
  for (const className of [
    'dsh-vibe-manbo-meme',
    'dsh-vibe-manbo-face-stage',
    'dsh-vibe-manbo-face',
    'dsh-vibe-manbo-react',
    'dsh-vibe-manbo-burst',
    'dsh-vibe-manbo-chant',
  ]) {
    assert.ok(runningClasses.includes(className), className);
  }
  assert.equal(runningImages.length, 8);

  for (const image of [...idleImages, ...runningImages]) {
    assert.match(image.props.src, /^data:image\/webp;base64,/);
    assert.doesNotMatch(image.props.src, /^https?:/i);
    assert.doesNotMatch(image.props.src, /legacy\.example/i);
  }
});

test('legacy preset migration follows the raw user layer, not schema-default theme values', async () => {
  const { plugin } = await loadClientPlugin();
  const resolvedLegacyValue = {
    showFloatingButton: true,
    showThinkingEffects: true,
    theme: 'aurora',
    followHarnessColors: true,
    baseColor: '#38bdf8',
    preset: 'ocean',
  };
  const settings = createSettingsScope(resolvedLegacyValue, {
    user: { preset: 'ocean', baseColor: '#38bdf8' },
  });
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  const card = registrationFor(registrations, 'settings.plugin.item');
  const idleState = { current: 'session-1', byId: { 'session-1': { running: false } } };

  const legacyTree = overlay.component({ useSessions: (selector) => selector(idleState) });
  const legacyBackground = findNode(legacyTree, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(legacyBackground.props['data-vibe-theme'], 'ocean');
  const legacyCard = card.component({});
  const legacySelect = findNode(legacyCard, (node) => node.props?.['aria-label'] === 'Vibe theme');
  assert.equal(legacySelect.props.value, 'ocean');
  assert.equal(checkboxByLabel(legacyCard, 'Follow Harness colors').props.checked, false);

  settings.update(
    { ...resolvedLegacyValue, theme: 'synthwave', followHarnessColors: true },
    { user: { preset: 'ocean', theme: 'synthwave', followHarnessColors: true } },
  );
  const explicitThemeTree = overlay.component({ useSessions: (selector) => selector(idleState) });
  const explicitThemeBackground = findNode(explicitThemeTree, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(explicitThemeBackground.props['data-vibe-theme'], 'synthwave');
});
