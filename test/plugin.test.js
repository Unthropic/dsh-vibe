import assert from 'node:assert/strict';
import test from 'node:test';

import hostPlugin from '../lib/index.js';

function collectClasses(node, output = []) {
  if (node === null || typeof node !== 'object') return output;
  if (node.props?.className) output.push(node.props.className);
  for (const child of node.props?.children ?? []) collectClasses(child, output);
  return output;
}

function createReactMock() {
  return {
    Fragment: Symbol('Fragment'),
    createElement(type, props, ...children) {
      const mergedProps = { ...(props ?? {}), children };
      return typeof type === 'function' ? type(mergedProps) : { type, props: mergedProps };
    },
  };
}

async function loadClientPlugin() {
  let definition;
  const styles = [];
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;

  globalThis.window = {
    __ModuleLoader__: {
      load(value) {
        definition = value;
      },
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
    await import(`../lib/client.js?test=${Date.now()}`);
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

test('host plugin exposes the expected inert Cordis face', () => {
  assert.equal(hostPlugin.name, 'dsh-vibe');
  assert.equal(hostPlugin.apply(), undefined);
});

test('client plugin registers the overlay and follows current-session running state', async () => {
  const { definition, plugin, styles } = await loadClientPlugin();

  assert.equal(definition.id, 'dsh-vibe');
  assert.equal(plugin.name, 'dsh-vibe');
  assert.deepEqual(plugin.inject, ['slots']);
  assert.equal(styles.length, 1);
  assert.match(styles[0].textContent, /pointer-events: none/);
  assert.match(styles[0].textContent, /prefers-reduced-motion: reduce/);

  let registration;
  const ctx = {
    slots: {
      inject(name, callback) {
        assert.equal(name, 'shell.overlay');
        callback();
      },
      register(options, component) {
        registration = { options, component };
        return () => {};
      },
    },
  };
  plugin.apply(ctx);

  assert.deepEqual(registration.options, {
    name: 'shell.overlay',
    id: 'dsh-vibe',
    order: -100,
  });

  const renderWithState = (state) =>
    registration.component({ useSessions: (selector) => selector(state) });
  const idleClasses = collectClasses(
    renderWithState({ current: 'session-1', byId: { 'session-1': { running: false } } }),
  );
  const runningClasses = collectClasses(
    renderWithState({ current: 'session-1', byId: { 'session-1': { running: true } } }),
  );
  const noSessionClasses = collectClasses(renderWithState({ current: undefined, byId: {} }));

  assert.ok(idleClasses.includes('dsh-vibe-bg'));
  assert.ok(!idleClasses.includes('dsh-vibe-hud'));
  assert.ok(runningClasses.includes('dsh-vibe-bg'));
  assert.ok(runningClasses.includes('dsh-vibe-hud'));
  assert.ok(!noSessionClasses.includes('dsh-vibe-hud'));
});
