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

    var CYAN = '77, 201, 255';

    var CSS = [
      // ── permanent background: aurora glows + drifting starfield ────────────
      '.dsh-vibe-bg.dsh-vibe-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }',
      '.dsh-vibe-aurora { position: absolute; width: 58vmax; height: 58vmax; border-radius: 50%; filter: blur(84px); opacity: 0.42; will-change: transform; }',
      '.dsh-vibe-aurora-a { left: -16vmax; top: -16vmax; background: radial-gradient(circle, var(--dsw-alias-brand-primary), transparent 70%); animation: dsh-vibe-drift-a 26s ease-in-out infinite alternate; }',
      '.dsh-vibe-aurora-b { right: -18vmax; bottom: -14vmax; background: radial-gradient(circle, var(--dsw-alias-state-success-primary), transparent 70%); animation: dsh-vibe-drift-b 33s ease-in-out infinite alternate; }',
      '.dsh-vibe-aurora-c { left: 32%; top: 58%; width: 46vmax; height: 46vmax; background: radial-gradient(circle, var(--dsw-alias-state-warn-primary), transparent 70%); animation: dsh-vibe-drift-c 40s ease-in-out infinite alternate; }',
      '@keyframes dsh-vibe-drift-a { from { transform: translate3d(0, 0, 0) scale(1); } to { transform: translate3d(12vmax, 8vmax, 0) scale(1.28); } }',
      '@keyframes dsh-vibe-drift-b { from { transform: translate3d(0, 0, 0) scale(1.12); } to { transform: translate3d(-10vmax, -9vmax, 0) scale(0.88); } }',
      '@keyframes dsh-vibe-drift-c { from { transform: translate3d(0, 0, 0) scale(0.95); } to { transform: translate3d(-9vmax, 6vmax, 0) scale(1.22); } }',
      '.dsh-vibe-stars { position: absolute; inset: 0; background-image: radial-gradient(circle, var(--dsw-alias-label-secondary) 1px, transparent 1.4px), radial-gradient(circle, var(--dsw-alias-label-primary) 1px, transparent 1.3px); background-size: 360px 360px, 230px 230px; background-position: 0 0, 0 0; opacity: 0.5; animation: dsh-vibe-stars-move 70s linear infinite; }',
      '@keyframes dsh-vibe-stars-move { from { background-position: 0 0, 0 0; } to { background-position: 720px 720px, 460px 460px; } }',

      // ── thinking HUD: sci-fi effects while the model is running ───────────
      '.dsh-vibe-hud.dsh-vibe-hud { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }',
      '.dsh-vibe-corner { position: absolute; width: 64px; height: 64px; border: 0 solid rgb(' +
        CYAN +
        '); opacity: 0.9; filter: drop-shadow(0 0 6px rgba(' +
        CYAN +
        ', 0.8)); animation: dsh-vibe-corner-pulse 2.4s ease-in-out infinite; }',
      '.dsh-vibe-corner-tl { top: 14px; left: 14px; border-top-width: 2px; border-left-width: 2px; }',
      '.dsh-vibe-corner-tr { top: 14px; right: 14px; border-top-width: 2px; border-right-width: 2px; }',
      '.dsh-vibe-corner-bl { bottom: 14px; left: 14px; border-bottom-width: 2px; border-left-width: 2px; }',
      '.dsh-vibe-corner-br { bottom: 14px; right: 14px; border-bottom-width: 2px; border-right-width: 2px; }',
      '@keyframes dsh-vibe-corner-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }',
      '.dsh-vibe-scan { position: absolute; left: 0; right: 0; top: 0; height: 160px; background: linear-gradient(180deg, rgba(' +
        CYAN +
        ', 0) 0%, rgba(' +
        CYAN +
        ', 0.12) 70%, rgba(' +
        CYAN +
        ', 0.55) 98%, rgba(' +
        CYAN +
        ', 0.9) 100%); animation: dsh-vibe-scan 4.5s linear infinite; }',
      '@keyframes dsh-vibe-scan { 0% { transform: translateY(-180px); } 100% { transform: translateY(105vh); } }',
      '.dsh-vibe-ring { position: absolute; border-radius: 50%; border: 2px solid rgba(' +
        CYAN +
        ', 0.85); border-top-color: transparent; opacity: 0.3; filter: drop-shadow(0 0 8px rgba(' +
        CYAN +
        ', 0.5)); }',
      '.dsh-vibe-ring-a { width: 46vmin; height: 46vmin; right: -12vmin; top: -10vmin; animation: dsh-vibe-spin 7s linear infinite; }',
      '.dsh-vibe-ring-b { width: 30vmin; height: 30vmin; left: -8vmin; bottom: -6vmin; border-color: rgba(' +
        CYAN +
        ', 0.5); border-left-color: transparent; animation: dsh-vibe-spin-rev 11s linear infinite; }',
      '@keyframes dsh-vibe-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '@keyframes dsh-vibe-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }',
      '.dsh-vibe-grid { position: absolute; left: -25%; right: -25%; bottom: 0; height: 38vh; transform: perspective(480px) rotateX(58deg); transform-origin: 50% 100%; background-image: repeating-linear-gradient(90deg, rgba(' +
        CYAN +
        ', 0.4) 0 1px, transparent 1px 64px), repeating-linear-gradient(0deg, rgba(' +
        CYAN +
        ', 0.35) 0 1px, transparent 1px 64px); animation: dsh-vibe-grid-move 1.6s linear infinite; -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 55%); mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 55%); }',
      '@keyframes dsh-vibe-grid-move { from { background-position: 0 0, 0 0; } to { background-position: 0 64px, 0 64px; } }',

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

    // Always-on background layer.
    function BackgroundLayer() {
      return react.createElement(
        'div',
        { className: 'dsh-vibe-bg' },
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
        { className: 'dsh-vibe-hud' },
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
      return react.createElement(
        react.Fragment,
        null,
        react.createElement(BackgroundLayer),
        react.createElement(ThinkingHud, props),
      );
    }

    function apply(ctx) {
      ctx.slots.inject('shell.overlay', function () {
        return ctx.slots.register({ name: 'shell.overlay', id: 'dsh-vibe', order: -100 }, VibeRoot);
      });
    }

    exports.name = 'dsh-vibe';
    exports.inject = ['slots'];
    exports.apply = apply;
    return module.exports;
  },
});
