// dsh-vibe client bundle.
//
// Registration contract: the dsh web bootstrap executes this file, and the
// exported factory must call `window.__ModuleLoader__.load({ id, factory })`.
// The factory receives a `require` that resolves the platform seed modules
// (react, @deepseek-ai/cordis, ...) and returns the plugin object — the same
// shape a Cordis plugin has on the host: `{ name, inject, apply }`.
//
// All CSS is injected once at module load (the pattern shipped client
// bundles use), guarded against duplicates. Never remove it via
// ctx.effect() — that API runs its callback immediately and treats the
// return value as cleanup.
window.__ModuleLoader__.load({
  id: 'dsh-vibe',
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });

    var react = require('react');

    var SETTINGS_NAMESPACE = 'dsh-vibe';
    var DEFAULT_SETTINGS = {
      showFloatingButton: true,
      preset: 'adaptive',
      baseColor: '#4dc9ff',
    };
    var PRESETS = {
      adaptive: { label: 'Adaptive', baseColor: '#4dc9ff' },
      ocean: {
        label: 'Ocean',
        baseColor: '#38bdf8',
        primary: '#38bdf8',
        secondary: '#2563eb',
        tertiary: '#8b5cf6',
      },
      ember: {
        label: 'Ember',
        baseColor: '#fb7185',
        primary: '#fb7185',
        secondary: '#f59e0b',
        tertiary: '#ef4444',
      },
      custom: { label: 'Custom' },
    };

    var CSS = [
      // ── permanent background: aurora glows + drifting starfield ────────────
      '.dsh-vibe-bg.dsh-vibe-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }',
      '.dsh-vibe-aurora { position: absolute; width: 58vmax; height: 58vmax; border-radius: 50%; filter: blur(84px); opacity: 0.42; will-change: transform; }',
      '.dsh-vibe-aurora-a { left: -16vmax; top: -16vmax; background: radial-gradient(circle, var(--dsh-vibe-primary, var(--dsw-alias-brand-primary)), transparent 70%); animation: dsh-vibe-drift-a 26s ease-in-out infinite alternate; }',
      '.dsh-vibe-aurora-b { right: -18vmax; bottom: -14vmax; background: radial-gradient(circle, var(--dsh-vibe-secondary, var(--dsw-alias-state-success-primary)), transparent 70%); animation: dsh-vibe-drift-b 33s ease-in-out infinite alternate; }',
      '.dsh-vibe-aurora-c { left: 32%; top: 58%; width: 46vmax; height: 46vmax; background: radial-gradient(circle, var(--dsh-vibe-tertiary, var(--dsw-alias-state-warn-primary)), transparent 70%); animation: dsh-vibe-drift-c 40s ease-in-out infinite alternate; }',
      '@keyframes dsh-vibe-drift-a { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(12vmax, 8vmax, 0) scale(1.28); } }',
      '@keyframes dsh-vibe-drift-b { from { transform: translate3d(0, 0, 0) scale(1.12); } to { transform: translate3d(-10vmax, -9vmax, 0) scale(0.88); } }',
      '@keyframes dsh-vibe-drift-c { from { transform: translate3d(0, 0, 0) scale(0.95); } to { transform: translate3d(-9vmax, 6vmax, 0) scale(1.22); } }',
      '.dsh-vibe-stars { position: absolute; inset: 0; background-image: radial-gradient(circle, var(--dsw-alias-label-secondary) 1px, transparent 1.4px), radial-gradient(circle, var(--dsw-alias-label-primary) 1px, transparent 1.3px); background-size: 360px 360px, 230px 230px; background-position: 0 0, 0 0; opacity: 0.5; animation: dsh-vibe-stars-move 70s linear infinite; }',
      '@keyframes dsh-vibe-stars-move { from { background-position: 0 0, 0 0; } to { background-position: 720px 720px, 460px 460px; } }',

      // ── thinking HUD: sci-fi effects while the model is running ───────────
      '.dsh-vibe-hud.dsh-vibe-hud { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }',
      '.dsh-vibe-corner { position: absolute; width: 64px; height: 64px; border: 0 solid rgb(var(--dsh-vibe-accent-rgb, 77, 201, 255)); opacity: 0.9; filter: drop-shadow(0 0 6px rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.8)); animation: dsh-vibe-corner-pulse 2.4s ease-in-out infinite; }',
      '.dsh-vibe-corner-tl { top: 14px; left: 14px; border-top-width: 2px; border-left-width: 2px; }',
      '.dsh-vibe-corner-tr { top: 14px; right: 14px; border-top-width: 2px; border-right-width: 2px; }',
      '.dsh-vibe-corner-bl { bottom: 14px; left: 14px; border-bottom-width: 2px; border-left-width: 2px; }',
      '.dsh-vibe-corner-br { bottom: 14px; right: 14px; border-bottom-width: 2px; border-right-width: 2px; }',
      '@keyframes dsh-vibe-corner-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }',
      '.dsh-vibe-scan { position: absolute; left: 0; right: 0; top: 0; height: 160px; background: linear-gradient(180deg, rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0) 0%, rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.12) 70%, rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.55) 98%, rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.9) 100%); animation: dsh-vibe-scan 4.5s linear infinite; }',
      '@keyframes dsh-vibe-scan { 0% { transform: translateY(-180px); } 100% { transform: translateY(105vh); } }',
      '.dsh-vibe-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.85); border-top-color: transparent; opacity: 0.3; filter: drop-shadow(0 0 8px rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.5)); }',
      '.dsh-vibe-ring-a { width: 46vmin; height: 46vmin; right: -12vmin; top: -10vmin; animation: dsh-vibe-spin 7s linear infinite; }',
      '.dsh-vibe-ring-b { width: 30vmin; height: 30vmin; left: -8vmin; bottom: -6vmin; border-color: rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.5); border-left-color: transparent; animation: dsh-vibe-spin-rev 11s linear infinite; }',
      '@keyframes dsh-vibe-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '@keyframes dsh-vibe-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }',
      '.dsh-vibe-grid { position: absolute; left: -25%; right: -25%; bottom: 0; height: 38vh; transform: perspective(480px) rotateX(58deg); transform-origin: 50% 100%; background-image: repeating-linear-gradient(90deg, rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.4) 0 1px, transparent 1px 64px), repeating-linear-gradient(0deg, rgba(var(--dsh-vibe-accent-rgb, 77, 201, 255), 0.35) 0 1px, transparent 1px 64px); animation: dsh-vibe-grid-move 1.6s linear infinite; -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 55%); mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 55%); }',
      '@keyframes dsh-vibe-grid-move { from { background-position: 0 0, 0 0; } to { background-position: 0 64px, 0 64px; } }',

      // ── quick settings and native settings card ───────────────────────────
      ':has(> .dsh-vibe-quick) { flex-direction: column; align-items: flex-start; gap: 2px; }',
      '.dsh-vibe-quick { flex: none; align-items: center; width: 36px; height: 36px; display: flex; position: relative; font-family: var(--dsw-font-family); color: var(--dsw-alias-label-primary); }',
      '.dsh-vibe-quick-button { border: 0; background: transparent; color: var(--dsw-alias-label-primary); border-radius: 50%; width: 36px; height: 36px; padding: 0; display: grid; place-items: center; cursor: pointer; }',
      '.dsh-vibe-quick-button:hover, .dsh-vibe-quick-button[aria-expanded=true] { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-vibe-quick-button:focus-visible, .dsh-vibe-preset:focus-visible, .dsh-vibe-color:focus-visible, .dsh-vibe-hex:focus-visible, .dsh-vibe-panel-close:focus-visible, .dsh-vibe-reset:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }',
      '.dsh-vibe-quick-panel { position: fixed; z-index: 30; box-sizing: border-box; width: min(300px, calc(100vw - 24px)); overflow-y: auto; padding: 14px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 14px; background: var(--dsw-specific-menu); box-shadow: var(--dsw-shadow-lv3); }',
      '.dsh-vibe-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }',
      '.dsh-vibe-panel-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; }',
      '.dsh-vibe-panel-close { border: 0; border-radius: 7px; padding: 3px 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: 12px/18px var(--dsw-font-family); }',
      '.dsh-vibe-panel-close:hover { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-vibe-field { min-width: 0; display: grid; gap: 7px; margin: 12px 0 0; padding: 0; border: 0; }',
      '.dsh-vibe-label { padding: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }',
      '.dsh-vibe-presets { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }',
      '.dsh-vibe-preset { border: 1px solid var(--dsw-alias-border-l2); border-radius: 9px; padding: 7px 5px; background: transparent; color: var(--dsw-alias-label-primary); cursor: pointer; font: 12px/18px var(--dsw-font-family); }',
      '.dsh-vibe-preset:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-vibe-preset[aria-pressed=true] { border-color: var(--dsw-alias-brand-primary); background: var(--dsw-alias-bg-layer-2); }',
      '.dsh-vibe-color-row { display: grid; grid-template-columns: 38px minmax(0, 1fr); gap: 8px; }',
      '.dsh-vibe-color { width: 38px; height: 34px; padding: 2px; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; background: transparent; cursor: pointer; }',
      '.dsh-vibe-hex { box-sizing: border-box; width: 100%; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; padding: 6px 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); font: 13px/20px var(--ds-font-family-code, monospace); }',
      '.dsh-vibe-hex:focus { border-color: var(--dsw-alias-brand-primary); outline: none; }',
      '.dsh-vibe-hex:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }',
      '.dsh-vibe-hex-error { margin-top: 2px; color: var(--dsw-alias-state-error-primary); font-size: 11px; line-height: 16px; }',
      '.dsh-vibe-settings-status { margin: 0 0 8px; color: var(--dsw-alias-state-warn-label); font-size: 12px; line-height: 18px; }',
      '.dsh-vibe-reset { margin-top: 12px; border: 0; border-radius: 8px; padding: 6px 9px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: 12px/18px var(--dsw-font-family); }',
      '.dsh-vibe-reset:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-vibe-settings-card { box-sizing: border-box; max-width: 720px; margin: 0; padding: 0; list-style: none; color: var(--dsw-alias-label-primary); font-family: var(--dsw-font-family); }',
      '.dsh-vibe-settings-head { margin-bottom: 4px; font-size: 16px; line-height: 24px; font-weight: 600; }',
      '.dsh-vibe-settings-copy { margin: 0 0 14px; color: var(--dsw-alias-label-tertiary); font-size: 13px; line-height: 20px; }',
      '.dsh-vibe-toggle { display: flex; align-items: center; gap: 9px; margin-top: 14px; color: var(--dsw-alias-label-secondary); font-size: 13px; line-height: 20px; }',
      '.dsh-vibe-toggle input { width: 16px; height: 16px; accent-color: var(--dsw-alias-brand-primary); }',
      '.dsh-vibe-settings-card button:disabled, .dsh-vibe-settings-card input:disabled, .dsh-vibe-quick-panel button:disabled, .dsh-vibe-quick-panel input:disabled { opacity: 0.5; cursor: default; }',

      // Stop continuous movement for people who request reduced motion.
      '@media (prefers-reduced-motion: reduce) { .dsh-vibe-aurora, .dsh-vibe-stars, .dsh-vibe-corner, .dsh-vibe-ring, .dsh-vibe-grid { animation: none !important; } .dsh-vibe-scan { display: none; } }',
    ].join('\n');

    if (
      typeof document !== 'undefined' &&
      document.querySelector('style[data-plugin=' + JSON.stringify('dsh-vibe') + ']') === null
    ) {
      var tag = document.createElement('style');
      tag.dataset.plugin = 'dsh-vibe';
      tag.textContent = CSS;
      document.head.appendChild(tag);
    }

    function normalizeSettings(value) {
      var preset =
        value !== undefined && PRESETS[value.preset] !== undefined ? value.preset : 'adaptive';
      var baseColor =
        value !== undefined && /^#[0-9a-f]{6}$/i.test(value.baseColor)
          ? value.baseColor.toLowerCase()
          : (PRESETS[preset].baseColor ?? DEFAULT_SETTINGS.baseColor);
      return {
        showFloatingButton:
          value === undefined || typeof value.showFloatingButton !== 'boolean'
            ? DEFAULT_SETTINGS.showFloatingButton
            : value.showFloatingButton,
        preset: preset,
        baseColor: baseColor,
      };
    }

    function useSettings(scope) {
      var snapshot = react.useSyncExternalStore(
        function (listener) {
          return scope.subscribe(listener);
        },
        function () {
          return scope.getSnapshot();
        },
        function () {
          return scope.getSnapshot();
        },
      );
      return {
        settings: normalizeSettings(snapshot.value),
        available: snapshot.status === 'ready',
        writable: snapshot.status === 'ready' && snapshot.writable,
      };
    }

    function hexToRgb(hex) {
      return [
        parseInt(hex.slice(1, 3), 16),
        parseInt(hex.slice(3, 5), 16),
        parseInt(hex.slice(5, 7), 16),
      ].join(', ');
    }

    function customPalette(hex) {
      var red = parseInt(hex.slice(1, 3), 16) / 255;
      var green = parseInt(hex.slice(3, 5), 16) / 255;
      var blue = parseInt(hex.slice(5, 7), 16) / 255;
      var maximum = Math.max(red, green, blue);
      var minimum = Math.min(red, green, blue);
      var delta = maximum - minimum;
      var lightness = (maximum + minimum) / 2;
      var saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
      var hue = 0;
      if (delta !== 0) {
        if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
        else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
        else hue = 60 * ((red - green) / delta + 4);
      }
      if (hue < 0) hue += 360;
      var vividness = Math.max(55, Math.round(saturation * 100));
      var glowLightness = Math.max(42, Math.min(68, Math.round(lightness * 100)));
      return {
        primary: hex,
        secondary:
          'hsl(' + Math.round((hue + 48) % 360) + ' ' + vividness + '% ' + glowLightness + '%)',
        tertiary:
          'hsl(' + Math.round((hue + 312) % 360) + ' ' + vividness + '% ' + glowLightness + '%)',
      };
    }

    function themeStyle(settings) {
      // Adaptive is the original plugin: Harness-token auroras and cyan HUD.
      // baseColor remains stored for Custom, but never changes Adaptive.
      if (settings.preset === 'adaptive') return {};
      var preset = PRESETS[settings.preset];
      var palette = settings.preset === 'custom' ? customPalette(settings.baseColor) : preset;
      var accent = settings.preset === 'custom' ? settings.baseColor : preset.baseColor;
      return {
        '--dsh-vibe-primary': palette.primary,
        '--dsh-vibe-secondary': palette.secondary,
        '--dsh-vibe-tertiary': palette.tertiary,
        '--dsh-vibe-accent-rgb': hexToRgb(accent),
      };
    }

    function runWrites(action, operations) {
      var settlements = operations.map(function (operation) {
        try {
          return Promise.resolve(operation());
        } catch (error) {
          return Promise.reject(error);
        }
      });
      Promise.allSettled(settlements).then(function (results) {
        results.forEach(function (result) {
          if (result.status === 'rejected') {
            console.error('[dsh-vibe] Failed to save ' + action + '.', result.reason);
          }
        });
      });
    }

    function store(scope, field, value) {
      if (!scope.getSnapshot().writable) return;
      runWrites(field, [
        function () {
          return scope.set(field, value);
        },
      ]);
    }

    function selectPreset(scope, id) {
      if (!scope.getSnapshot().writable) return;
      if (id === 'custom') {
        runWrites('theme preset', [
          function () {
            return scope.set('preset', id);
          },
        ]);
        return;
      }
      // Invoke both writes before yielding. SettingsScope serializes them in
      // this order, so a later user action queues after this complete action.
      runWrites('theme preset', [
        function () {
          return scope.set('preset', id);
        },
        function () {
          return scope.set('baseColor', PRESETS[id].baseColor);
        },
      ]);
    }

    function selectCustomColor(scope, color) {
      if (!scope.getSnapshot().writable) return;
      runWrites('custom color', [
        function () {
          return scope.set('baseColor', color);
        },
        function () {
          return scope.set('preset', 'custom');
        },
      ]);
    }

    function resetSettings(scope) {
      if (!scope.getSnapshot().writable) return;
      runWrites('defaults', [
        function () {
          return scope.unset('showFloatingButton');
        },
        function () {
          return scope.unset('preset');
        },
        function () {
          return scope.unset('baseColor');
        },
      ]);
    }

    function ThemeControls(props) {
      var settings = props.settings;
      var scope = props.scope;
      var disabled = !props.writable;
      var draftState = react.useState(settings.baseColor);
      var draft = draftState[0];
      var setDraft = draftState[1];
      var valid = /^#[0-9a-f]{6}$/i.test(draft);

      react.useEffect(
        function () {
          setDraft(settings.baseColor);
        },
        [settings.baseColor],
      );

      function commitHex() {
        if (!valid) {
          return;
        }
        selectCustomColor(scope, draft.toLowerCase());
      }

      var errorId = 'dsh-vibe-' + props.controlId + '-hex-error';
      var status = !props.available
        ? 'Settings are not available yet; changes cannot be saved.'
        : !props.writable
          ? 'Settings are read-only; changes cannot be saved.'
          : null;

      return react.createElement(
        react.Fragment,
        null,
        status !== null
          ? react.createElement(
              'p',
              { className: 'dsh-vibe-settings-status', role: 'status' },
              status,
            )
          : null,
        react.createElement(
          'fieldset',
          { className: 'dsh-vibe-field' },
          react.createElement('legend', { className: 'dsh-vibe-label' }, 'Theme'),
          react.createElement(
            'div',
            { className: 'dsh-vibe-presets' },
            Object.keys(PRESETS).map(function (id) {
              return react.createElement(
                'button',
                {
                  key: id,
                  type: 'button',
                  className: 'dsh-vibe-preset',
                  'aria-pressed': settings.preset === id,
                  disabled: disabled,
                  onClick: function () {
                    selectPreset(scope, id);
                  },
                },
                PRESETS[id].label,
              );
            }),
          ),
        ),
        react.createElement(
          'fieldset',
          { className: 'dsh-vibe-field' },
          react.createElement('legend', { className: 'dsh-vibe-label' }, 'Base color'),
          react.createElement(
            'span',
            { className: 'dsh-vibe-color-row' },
            react.createElement('input', {
              className: 'dsh-vibe-color',
              type: 'color',
              value: settings.baseColor,
              disabled: disabled,
              'aria-label': 'Base color picker',
              onChange: function (event) {
                selectCustomColor(scope, event.target.value.toLowerCase());
              },
            }),
            react.createElement('input', {
              className: 'dsh-vibe-hex',
              type: 'text',
              value: draft,
              disabled: disabled,
              maxLength: 7,
              spellCheck: false,
              'aria-label': 'Base color hex value',
              'aria-invalid': !valid,
              'aria-describedby': !valid ? errorId : undefined,
              onChange: function (event) {
                setDraft(event.target.value);
              },
              onBlur: commitHex,
              onKeyDown: function (event) {
                if (event.key === 'Enter') {
                  commitHex();
                  event.currentTarget.blur();
                }
              },
            }),
          ),
          !valid
            ? react.createElement(
                'span',
                { id: errorId, className: 'dsh-vibe-hex-error', role: 'alert' },
                'Use a six-digit hex color, such as #4dc9ff.',
              )
            : null,
        ),
        react.createElement(
          'button',
          {
            type: 'button',
            className: 'dsh-vibe-reset',
            disabled: disabled,
            onClick: function () {
              resetSettings(scope);
            },
          },
          'Reset to defaults',
        ),
      );
    }

    function QuickSettings(props) {
      var state = react.useState(false);
      var open = state[0];
      var setOpen = state[1];
      var anchorState = react.useState({ left: 12, bottom: 56, maxHeight: 240 });
      var anchor = anchorState[0];
      var setAnchor = anchorState[1];
      var buttonRef = react.useRef(null);
      var rootRef = react.useRef(null);

      function closeAndFocus() {
        setOpen(false);
        if (buttonRef.current !== null) buttonRef.current.focus();
      }

      react.useEffect(
        function () {
          if (!open || typeof window === 'undefined' || typeof document === 'undefined') {
            return undefined;
          }
          function update() {
            if (buttonRef.current === null) return;
            var rect = buttonRef.current.getBoundingClientRect();
            setAnchor({
              left: Math.max(12, Math.min(rect.left, window.innerWidth - 312)),
              bottom: Math.max(12, window.innerHeight - rect.top + 8),
              maxHeight: Math.max(1, rect.top - 20),
            });
          }
          function dismissOutside(event) {
            if (rootRef.current !== null && !rootRef.current.contains(event.target)) {
              setOpen(false);
            }
          }
          function dismissWithEscape(event) {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            setOpen(false);
            if (buttonRef.current !== null) buttonRef.current.focus();
          }
          update();
          window.addEventListener('resize', update);
          document.addEventListener('pointerdown', dismissOutside);
          document.addEventListener('keydown', dismissWithEscape);
          return function () {
            window.removeEventListener('resize', update);
            document.removeEventListener('pointerdown', dismissOutside);
            document.removeEventListener('keydown', dismissWithEscape);
          };
        },
        [open],
      );

      if (!props.settings.showFloatingButton) return null;
      return react.createElement(
        'div',
        { ref: rootRef, className: 'dsh-vibe-quick' },
        react.createElement(
          'button',
          {
            ref: buttonRef,
            type: 'button',
            className: 'dsh-vibe-quick-button',
            title: 'Vibe settings',
            'aria-label': 'Vibe settings',
            'aria-haspopup': 'dialog',
            'aria-expanded': open,
            'aria-controls': 'dsh-vibe-quick-panel',
            onClick: function () {
              setOpen(!open);
            },
          },
          react.createElement(
            'svg',
            {
              width: 18,
              height: 18,
              viewBox: '0 0 18 18',
              fill: 'none',
              'aria-hidden': 'true',
            },
            react.createElement('path', {
              d: 'M9 1.8a7.2 7.2 0 1 0 0 14.4c1.15 0 1.55-.7 1.12-1.5-.42-.8.12-1.75 1.03-1.75h1.2A3.85 3.85 0 0 0 16.2 9.1 7.3 7.3 0 0 0 9 1.8Z',
              stroke: 'currentColor',
              strokeWidth: 1.4,
              strokeLinejoin: 'round',
            }),
            react.createElement('circle', { cx: 5.3, cy: 8.6, r: 1, fill: 'currentColor' }),
            react.createElement('circle', { cx: 7.1, cy: 5.2, r: 1, fill: 'currentColor' }),
            react.createElement('circle', { cx: 10.8, cy: 5, r: 1, fill: 'currentColor' }),
          ),
        ),
        open
          ? react.createElement(
              'div',
              {
                id: 'dsh-vibe-quick-panel',
                className: 'dsh-vibe-quick-panel',
                role: 'dialog',
                'aria-labelledby': 'dsh-vibe-quick-title',
                style: {
                  left: anchor.left + 'px',
                  bottom: anchor.bottom + 'px',
                  maxHeight: anchor.maxHeight + 'px',
                },
              },
              react.createElement(
                'div',
                { className: 'dsh-vibe-panel-head' },
                react.createElement(
                  'h2',
                  { id: 'dsh-vibe-quick-title', className: 'dsh-vibe-panel-title' },
                  'Vibe settings',
                ),
                react.createElement(
                  'button',
                  { type: 'button', className: 'dsh-vibe-panel-close', onClick: closeAndFocus },
                  'Close',
                ),
              ),
              react.createElement(ThemeControls, { ...props, controlId: 'quick' }),
            )
          : null,
      );
    }

    // Always-on background layer.
    function BackgroundLayer(props) {
      return react.createElement(
        'div',
        { className: 'dsh-vibe-bg', style: props.style },
        react.createElement('div', { className: 'dsh-vibe-aurora dsh-vibe-aurora-a' }),
        react.createElement('div', { className: 'dsh-vibe-aurora dsh-vibe-aurora-b' }),
        react.createElement('div', { className: 'dsh-vibe-aurora dsh-vibe-aurora-c' }),
        react.createElement('div', { className: 'dsh-vibe-stars' }),
      );
    }

    // Renders the HUD only while the current session reports `running: true`
    // (the model is thinking). The `useSessions` selector hook is a standard
    // prop of the shell.overlay slot and follows the SessionListState shape
    // the shipped session tree consumes (list.current, list.byId[id].running).
    function ThinkingHud(props) {
      if (typeof props.useSessions !== 'function') return null;
      var running = props.useSessions(function (s) {
        var current = s.current;
        if (current === undefined || s.byId === undefined) return false;
        var item = s.byId[current];
        return item !== undefined && item.running === true;
      });
      if (!running) return null;
      return react.createElement(
        'div',
        { className: 'dsh-vibe-hud', style: props.style },
        react.createElement('div', { className: 'dsh-vibe-corner dsh-vibe-corner-tl' }),
        react.createElement('div', { className: 'dsh-vibe-corner dsh-vibe-corner-tr' }),
        react.createElement('div', { className: 'dsh-vibe-corner dsh-vibe-corner-bl' }),
        react.createElement('div', { className: 'dsh-vibe-corner dsh-vibe-corner-br' }),
        react.createElement('div', { className: 'dsh-vibe-scan' }),
        react.createElement('div', { className: 'dsh-vibe-ring dsh-vibe-ring-a' }),
        react.createElement('div', { className: 'dsh-vibe-ring dsh-vibe-ring-b' }),
        react.createElement('div', { className: 'dsh-vibe-grid' }),
      );
    }

    // One overlay entry renders both layers: background always, HUD on demand.
    function VibeRoot(props) {
      var view = useSettings(props.scope);
      var style = themeStyle(view.settings);
      return react.createElement(
        react.Fragment,
        null,
        react.createElement(BackgroundLayer, { style: style }),
        react.createElement(ThinkingHud, { useSessions: props.useSessions, style: style }),
      );
    }

    function VibeLauncher(props) {
      var view = useSettings(props.scope);
      return react.createElement(QuickSettings, {
        scope: props.scope,
        settings: view.settings,
        available: view.available,
        writable: view.writable,
      });
    }

    function SettingsCard(props) {
      var view = useSettings(props.scope);
      return react.createElement(
        'li',
        { className: 'dsh-vibe-settings-card', 'aria-label': 'dsh-vibe settings' },
        react.createElement('div', { className: 'dsh-vibe-settings-head' }, 'dsh-vibe'),
        react.createElement(
          'p',
          { className: 'dsh-vibe-settings-copy' },
          'Choose an atmosphere and tune its base color.',
        ),
        react.createElement(ThemeControls, {
          scope: props.scope,
          settings: view.settings,
          available: view.available,
          writable: view.writable,
          controlId: 'card',
        }),
        react.createElement(
          'label',
          { className: 'dsh-vibe-toggle' },
          react.createElement('input', {
            type: 'checkbox',
            checked: view.settings.showFloatingButton,
            disabled: !view.writable,
            onChange: function (event) {
              store(props.scope, 'showFloatingButton', event.target.checked);
            },
          }),
          react.createElement('span', null, 'Show floating Vibe button'),
        ),
      );
    }

    function apply(ctx) {
      var scope = ctx.settingsScope.bind({ namespace: SETTINGS_NAMESPACE });
      ctx.slots.inject('shell.overlay', function () {
        return ctx.slots.register(
          { name: 'shell.overlay', id: 'dsh-vibe', order: -100 },
          function (props) {
            return react.createElement(VibeRoot, { ...props, scope: scope });
          },
        );
      });
      ctx.slots.inject('sidebar.footer.action', function () {
        return ctx.slots.register(
          { name: 'sidebar.footer.action', id: 'dsh-vibe' },
          function (props) {
            return react.createElement(VibeLauncher, { ...props, scope: scope });
          },
        );
      });
      ctx.slots.inject('settings.plugin.item', function () {
        return ctx.slots.register(
          { name: 'settings.plugin.item', key: SETTINGS_NAMESPACE },
          function () {
            return react.createElement(SettingsCard, { scope: scope });
          },
        );
      });
    }

    exports.name = 'dsh-vibe';
    exports.inject = ['slots', 'settingsScope'];
    exports.apply = apply;
    return module.exports;
  },
});
