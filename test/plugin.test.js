import assert from 'node:assert/strict';
import test from 'node:test';

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

function settleAsyncWrites() {
  return new Promise((resolve) => globalThis.setTimeout(resolve, 0));
}

function createReactMock() {
  return {
    Fragment: Symbol('Fragment'),
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
      let value = typeof initialValue === 'function' ? initialValue() : initialValue;
      return [
        value,
        (next) => {
          value = typeof next === 'function' ? next(value) : next;
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
    return { definition, plugin, styles };
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
    theme: 'aurora',
    followHarnessColors: true,
    baseColor: '#4dc9ff',
  });
  assert.equal(Object.hasOwn(defaults, 'preset'), false);
  assert.deepEqual(
    registration.schema({
      showFloatingButton: false,
      theme: 'synthwave',
      followHarnessColors: false,
      baseColor: '#A1b2C3',
    }),
    {
      showFloatingButton: false,
      theme: 'synthwave',
      followHarnessColors: false,
      baseColor: '#A1b2C3',
    },
  );
  assert.equal(registration.schema({ preset: 'custom' }).preset, 'custom');
  assert.throws(() => registration.schema({ theme: 'adaptive' }));
  assert.throws(() => registration.schema({ preset: 'unknown' }));
  assert.throws(() => registration.schema({ followHarnessColors: 'yes' }));
  assert.throws(() => registration.schema({ baseColor: 'blue' }));
  assert.throws(() => registration.schema({ baseColor: '#12345g' }));
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
  const renderWithState = (state) =>
    overlay.component({ useSessions: (selector) => selector(state) });

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

  const background = findNode(idle, (node) =>
    node.props?.className?.split(' ').includes('dsh-vibe-bg'),
  );
  assert.equal(background.props['data-vibe-theme'], 'aurora');
  assert.deepEqual(background.props.style, {});
  assert.equal(background.props.style['--dsh-vibe-primary'], undefined);
  assert.equal(background.props.style['--dsh-vibe-secondary'], undefined);
  assert.equal(background.props.style['--dsh-vibe-tertiary'], undefined);
});

test('each theme renders its own background and running HUD structure', async () => {
  const { plugin } = await loadClientPlugin();
  const expectations = {
    aurora: { background: 'dsh-vibe-stars', hud: 'dsh-vibe-grid' },
    ocean: { background: 'dsh-vibe-caustics', hud: 'dsh-vibe-sonar' },
    ember: { background: 'dsh-vibe-ember-heat', hud: 'dsh-vibe-energy-frame' },
    synthwave: { background: 'dsh-vibe-synth-sun', hud: 'dsh-vibe-retro-frame' },
  };
  const structures = new Set();

  for (const [theme, expected] of Object.entries(expectations)) {
    const settings = createSettingsScope(
      {
        showFloatingButton: true,
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

  assert.equal(structures.size, 4);
});

test('launcher visibility and settings card controls follow the durable settings scope', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(undefined);
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const launcher = registrationFor(registrations, 'sidebar.footer.action');
  const card = registrationFor(registrations, 'settings.plugin.item');

  const launcherTree = launcher.component({});
  assert.ok(collectClasses(launcherTree).includes('dsh-vibe-quick'));
  const launcherButton = findNode(
    launcherTree,
    (node) => node.type === 'button' && node.props?.['aria-label'] === 'Vibe settings',
  );
  assert.ok(launcherButton);
  assert.equal(launcherButton.props['aria-expanded'], false);

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
  assert.equal(toggles.length, 2);
  assert.equal(toggles[0].props.checked, true);
  assert.equal(toggles[1].props.checked, true);

  settings.update(
    {
      showFloatingButton: false,
      theme: 'aurora',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
    },
    { user: { showFloatingButton: false } },
  );
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

  const toggles = visit(cardTree).filter(
    (node) => node.type === 'input' && node.props?.type === 'checkbox',
  );
  toggles[0].props.onChange({ target: { checked: true } });
  toggles[1].props.onChange({ target: { checked: false } });

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
    { method: 'set', field: 'showFloatingButton', value: false },
    { method: 'unset', field: 'showFloatingButton' },
    { method: 'unset', field: 'theme' },
    { method: 'unset', field: 'baseColor' },
    { method: 'unset', field: 'followHarnessColors' },
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

test('legacy preset migration follows the raw user layer, not schema-default theme values', async () => {
  const { plugin } = await loadClientPlugin();
  const resolvedLegacyValue = {
    showFloatingButton: true,
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
  const legacyToggles = visit(legacyCard).filter(
    (node) => node.type === 'input' && node.props?.type === 'checkbox',
  );
  assert.equal(legacySelect.props.value, 'ocean');
  assert.equal(legacyToggles[0].props.checked, false);

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
