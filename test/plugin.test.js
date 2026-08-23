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
    .filter(Boolean);
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

test('host plugin registers the dsh-vibe settings schema with validated defaults', () => {
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
  assert.deepEqual(registration.schema({}), {
    showFloatingButton: true,
    preset: 'adaptive',
    baseColor: '#4dc9ff',
  });
  assert.deepEqual(
    registration.schema({ showFloatingButton: false, preset: 'ocean', baseColor: '#A1b2C3' }),
    { showFloatingButton: false, preset: 'ocean', baseColor: '#A1b2C3' },
  );
  assert.equal(registration.schema({ preset: 'custom' }).preset, 'custom');
  assert.throws(() => registration.schema({ preset: 'unknown' }));
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

  const background = findNode(idle, (node) => node.props?.className === 'dsh-vibe-bg');
  assert.deepEqual(background.props.style, {});
  assert.equal(background.props.style['--dsh-vibe-primary'], undefined);
  assert.equal(background.props.style['--dsh-vibe-secondary'], undefined);
  assert.equal(background.props.style['--dsh-vibe-tertiary'], undefined);
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
  assert.ok(nodeText(cardTree).includes('Choose an atmosphere and tune its base color.'));
  for (const label of ['Adaptive', 'Ocean', 'Ember', 'Custom', 'Reset to defaults']) {
    assert.ok(nodeText(cardTree).includes(label));
  }
  assert.ok(findNode(cardTree, (node) => node.type === 'input' && node.props?.type === 'color'));
  assert.equal(visit(cardTree).filter((node) => node.type === 'fieldset').length, 2);
  assert.ok(
    findNode(
      cardTree,
      (node) => node.type === 'input' && node.props?.['aria-label'] === 'Base color hex value',
    ),
  );
  const toggle = findNode(
    cardTree,
    (node) => node.type === 'input' && node.props?.type === 'checkbox',
  );
  assert.equal(toggle.props.checked, true);

  settings.update({ showFloatingButton: false, preset: 'adaptive', baseColor: '#4dc9ff' });
  assert.equal(launcher.component({}), null);
});

test('settings controls write color, preset, reset, and launcher visibility choices', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope(undefined);
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const cardTree = registrationFor(registrations, 'settings.plugin.item').component({});

  const colorPicker = findNode(
    cardTree,
    (node) => node.type === 'input' && node.props?.type === 'color',
  );
  colorPicker.props.onChange({ target: { value: '#ABCDEF' } });

  const ocean = findNode(cardTree, (node) => node.type === 'button' && nodeText(node) === 'Ocean');
  ocean.props.onClick();
  // A rapid later choice must be queued after the complete earlier action.
  await settleAsyncWrites();

  const toggle = findNode(
    cardTree,
    (node) => node.type === 'input' && node.props?.type === 'checkbox',
  );
  toggle.props.onChange({ target: { checked: false } });

  const reset = findNode(
    cardTree,
    (node) => node.type === 'button' && nodeText(node) === 'Reset to defaults',
  );
  reset.props.onClick();
  await settleAsyncWrites();

  assert.deepEqual(settings.calls, [
    { method: 'set', field: 'baseColor', value: '#abcdef' },
    { method: 'set', field: 'preset', value: 'custom' },
    { method: 'set', field: 'preset', value: 'ocean' },
    { method: 'set', field: 'baseColor', value: '#38bdf8' },
    { method: 'set', field: 'showFloatingButton', value: false },
    { method: 'unset', field: 'showFloatingButton' },
    { method: 'unset', field: 'preset' },
    { method: 'unset', field: 'baseColor' },
  ]);
});

test('saved custom settings apply namespaced color variables to background and HUD', async () => {
  const { plugin } = await loadClientPlugin();
  const settings = createSettingsScope({
    showFloatingButton: true,
    preset: 'custom',
    baseColor: '#123456',
  });
  const { registrations } = applyClientPlugin(plugin, settings.scope);
  const overlay = registrationFor(registrations, 'shell.overlay');
  const tree = overlay.component({
    useSessions: (selector) =>
      selector({ current: 'session-1', byId: { 'session-1': { running: true } } }),
  });
  const background = findNode(tree, (node) => node.props?.className === 'dsh-vibe-bg');
  const hud = findNode(tree, (node) => node.props?.className === 'dsh-vibe-hud');

  assert.deepEqual(background.props.style, {
    '--dsh-vibe-primary': '#123456',
    '--dsh-vibe-secondary': 'hsl(258 65% 42%)',
    '--dsh-vibe-tertiary': 'hsl(162 65% 42%)',
    '--dsh-vibe-accent-rgb': '18, 52, 86',
  });
  assert.deepEqual(hud.props.style, background.props.style);
});
