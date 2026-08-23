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
      theme: 'aurora',
      followHarnessColors: true,
      baseColor: '#4dc9ff',
    };
    var THEMES = {
      aurora: { label: 'Aurora', baseColor: '#4dc9ff', followHarnessColors: true },
      ocean: { label: 'Ocean', baseColor: '#38bdf8', followHarnessColors: false },
      ember: { label: 'Ember', baseColor: '#ff6b35', followHarnessColors: false },
      synthwave: { label: 'Synthwave', baseColor: '#ff4fd8', followHarnessColors: false },
    };
    var LEGACY_PRESETS = {
      adaptive: { theme: 'aurora', followHarnessColors: true, baseColor: '#4dc9ff' },
      ocean: { theme: 'ocean', followHarnessColors: false, baseColor: '#38bdf8' },
      ember: { theme: 'ember', followHarnessColors: false, baseColor: '#fb7185' },
      custom: { theme: 'aurora', followHarnessColors: false, baseColor: '#4dc9ff' },
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
      '.dsh-vibe-corner { position: absolute; width: 64px; height: 64px; border: 0 solid var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)); opacity: 0.9; filter: drop-shadow(0 0 6px color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 80%, transparent)); animation: dsh-vibe-corner-pulse 2.4s ease-in-out infinite; }',
      '.dsh-vibe-corner-tl { top: 14px; left: 14px; border-top-width: 2px; border-left-width: 2px; }',
      '.dsh-vibe-corner-tr { top: 14px; right: 14px; border-top-width: 2px; border-right-width: 2px; }',
      '.dsh-vibe-corner-bl { bottom: 14px; left: 14px; border-bottom-width: 2px; border-left-width: 2px; }',
      '.dsh-vibe-corner-br { bottom: 14px; right: 14px; border-bottom-width: 2px; border-right-width: 2px; }',
      '@keyframes dsh-vibe-corner-pulse { 0%, 100% { opacity: 0.55; } 50% { opacity: 1; } }',
      '.dsh-vibe-scan { position: absolute; left: 0; right: 0; top: 0; height: 160px; background: linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 12%, transparent) 70%, color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 55%, transparent) 98%, color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 90%, transparent) 100%); animation: dsh-vibe-scan 4.5s linear infinite; }',
      '@keyframes dsh-vibe-scan { 0% { transform: translateY(-180px); } 100% { transform: translateY(105vh); } }',
      '.dsh-vibe-ring { position: absolute; border-radius: 50%; border: 2px solid color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 85%, transparent); border-top-color: transparent; opacity: 0.3; filter: drop-shadow(0 0 8px color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 50%, transparent)); }',
      '.dsh-vibe-ring-a { width: 46vmin; height: 46vmin; right: -12vmin; top: -10vmin; animation: dsh-vibe-spin 7s linear infinite; }',
      '.dsh-vibe-ring-b { width: 30vmin; height: 30vmin; left: -8vmin; bottom: -6vmin; border-color: color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 50%, transparent); border-left-color: transparent; animation: dsh-vibe-spin-rev 11s linear infinite; }',
      '@keyframes dsh-vibe-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }',
      '@keyframes dsh-vibe-spin-rev { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }',
      '.dsh-vibe-grid { position: absolute; left: -25%; right: -25%; bottom: 0; height: 38vh; transform: perspective(480px) rotateX(58deg); transform-origin: 50% 100%; background-image: repeating-linear-gradient(90deg, color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 40%, transparent) 0 1px, transparent 1px 64px), repeating-linear-gradient(0deg, color-mix(in srgb, var(--dsh-vibe-accent, var(--dsw-alias-brand-primary, #4dc9ff)) 35%, transparent) 0 1px, transparent 1px 64px); animation: dsh-vibe-grid-move 1.6s linear infinite; -webkit-mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 55%); mask-image: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.85) 55%); }',
      '@keyframes dsh-vibe-grid-move { from { background-position: 0 0, 0 0; } to { background-position: 0 64px, 0 64px; } }',

      // ── Ocean: moving caustics, bubbles, particles, and sonar ─────────────
      '.dsh-vibe-ocean-depth { position: absolute; inset: 0; background: radial-gradient(ellipse at 50% -10%, color-mix(in srgb, var(--dsh-vibe-primary) 38%, transparent), transparent 55%), linear-gradient(180deg, color-mix(in srgb, var(--dsh-vibe-secondary) 16%, transparent), transparent 70%); }',
      '.dsh-vibe-caustics { position: absolute; inset: -35%; opacity: 0.2; filter: blur(3px); background-image: repeating-radial-gradient(ellipse at 35% 20%, transparent 0 18px, color-mix(in srgb, var(--dsh-vibe-primary) 48%, transparent) 22px 24px, transparent 28px 46px); transform: rotate(-12deg) scale(1.15); animation: dsh-vibe-caustics 18s ease-in-out infinite alternate; }',
      '@keyframes dsh-vibe-caustics { to { transform: translate3d(8%, 6%, 0) rotate(9deg) scale(1.28); } }',
      '.dsh-vibe-ocean-particles { position: absolute; inset: 0; opacity: 0.32; background-image: radial-gradient(circle, var(--dsh-vibe-tertiary) 1px, transparent 1.5px), radial-gradient(circle, var(--dsh-vibe-primary) 1px, transparent 1.5px); background-size: 150px 170px, 230px 260px; animation: dsh-vibe-ocean-particles 34s linear infinite; }',
      '@keyframes dsh-vibe-ocean-particles { to { background-position: 70px -340px, -100px -520px; } }',
      '.dsh-vibe-bubble { position: absolute; bottom: -28px; left: var(--bubble-x); width: var(--bubble-size); height: var(--bubble-size); border: 1px solid color-mix(in srgb, var(--dsh-vibe-primary) 55%, transparent); border-radius: 50%; opacity: 0; box-shadow: inset 2px 2px 4px color-mix(in srgb, white 35%, transparent); animation: dsh-vibe-bubble-rise var(--bubble-speed) linear infinite; animation-delay: var(--bubble-delay); }',
      '@keyframes dsh-vibe-bubble-rise { 15% { opacity: 0.45; } 85% { opacity: 0.2; } to { opacity: 0; transform: translate3d(24px, -110vh, 0); } }',
      '.dsh-vibe-sonar { position: absolute; width: min(55vmin, 460px); aspect-ratio: 1; right: -8vmin; top: 8vh; border: 1px solid color-mix(in srgb, var(--dsh-vibe-accent) 45%, transparent); border-radius: 50%; opacity: 0.58; background: repeating-radial-gradient(circle, transparent 0 16%, color-mix(in srgb, var(--dsh-vibe-accent) 24%, transparent) 16.3% 16.7%, transparent 17% 32%); }',
      '.dsh-vibe-sonar:before { content: ""; position: absolute; inset: 50% 0 0 50%; transform-origin: 0 0; background: conic-gradient(from -18deg, color-mix(in srgb, var(--dsh-vibe-accent) 48%, transparent), transparent 34deg); animation: dsh-vibe-sonar-sweep 5s linear infinite; }',
      '.dsh-vibe-sonar-ping { position: absolute; width: 12px; height: 12px; left: 42%; top: 31%; border-radius: 50%; background: var(--dsh-vibe-accent); box-shadow: 0 0 18px var(--dsh-vibe-accent); animation: dsh-vibe-sonar-ping 2s ease-out infinite; }',
      '@keyframes dsh-vibe-sonar-sweep { to { transform: rotate(360deg); } }',
      '@keyframes dsh-vibe-sonar-ping { to { opacity: 0; transform: scale(3.5); } }',

      // ── Ember: heat bloom, rising sparks, ash, and energy frame ───────────
      '.dsh-vibe-ember-heat { position: absolute; inset: 22% -20% -38%; background: radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--dsh-vibe-primary) 58%, transparent), transparent 62%); filter: blur(34px); animation: dsh-vibe-heat 6s ease-in-out infinite alternate; }',
      '@keyframes dsh-vibe-heat { to { opacity: 0.68; transform: scale3d(1.08, 1.16, 1); } }',
      '.dsh-vibe-ash { position: absolute; inset: 0; opacity: 0.22; background-image: radial-gradient(circle, var(--dsh-vibe-tertiary) 1px, transparent 1.5px), radial-gradient(circle, var(--dsh-vibe-secondary) 1px, transparent 1.6px); background-size: 190px 210px, 270px 290px; animation: dsh-vibe-ash 42s linear infinite; }',
      '@keyframes dsh-vibe-ash { to { background-position: 80px 420px, -120px 580px; } }',
      '.dsh-vibe-spark { position: absolute; bottom: -12px; left: var(--spark-x); width: var(--spark-size); height: calc(var(--spark-size) * 2.6); border-radius: 50%; opacity: 0; background: var(--dsh-vibe-accent); box-shadow: 0 0 8px var(--dsh-vibe-primary); animation: dsh-vibe-spark-rise var(--spark-speed) ease-out infinite; animation-delay: var(--spark-delay); }',
      '@keyframes dsh-vibe-spark-rise { 12% { opacity: 0.9; } to { opacity: 0; transform: translate3d(45px, -78vh, 0) rotate(24deg); } }',
      '.dsh-vibe-energy-frame { position: absolute; inset: 18px; border: 1px solid color-mix(in srgb, var(--dsh-vibe-accent) 42%, transparent); clip-path: polygon(0 0, 18% 0, 18% 2px, 82% 2px, 82% 0, 100% 0, 100% 24%, calc(100% - 2px) 24%, calc(100% - 2px) 76%, 100% 76%, 100% 100%, 76% 100%, 76% calc(100% - 2px), 24% calc(100% - 2px), 24% 100%, 0 100%, 0 76%, 2px 76%, 2px 24%, 0 24%); filter: drop-shadow(0 0 7px var(--dsh-vibe-primary)); animation: dsh-vibe-frame-breathe 2.8s ease-in-out infinite; }',
      '.dsh-vibe-ember-pulse { position: absolute; left: 10%; right: 10%; bottom: 9%; height: 2px; background: linear-gradient(90deg, transparent, var(--dsh-vibe-accent), transparent); box-shadow: 0 0 20px var(--dsh-vibe-primary); animation: dsh-vibe-ember-pulse 1.8s ease-in-out infinite; }',
      '@keyframes dsh-vibe-frame-breathe { 50% { opacity: 0.42; } }',
      '@keyframes dsh-vibe-ember-pulse { 50% { transform: scaleX(0.72); opacity: 0.45; } }',

      // ── Synthwave: sunset, scanlines, horizon grid, and retro HUD ─────────
      '.dsh-vibe-synth-sky { position: absolute; inset: 0; background: linear-gradient(180deg, color-mix(in srgb, var(--dsh-vibe-secondary) 14%, transparent), transparent 52%), radial-gradient(ellipse at 50% 64%, color-mix(in srgb, var(--dsh-vibe-primary) 28%, transparent), transparent 46%); }',
      '.dsh-vibe-synth-sun { position: absolute; left: 50%; top: 44%; width: min(30vmin, 260px); aspect-ratio: 1; border-radius: 50%; transform: translate(-50%, -50%); opacity: 0.5; background: repeating-linear-gradient(180deg, var(--dsh-vibe-tertiary) 0 9px, transparent 9px 13px); filter: drop-shadow(0 0 28px var(--dsh-vibe-primary)); }',
      '.dsh-vibe-scanlines { position: absolute; inset: 0; opacity: 0.14; background: repeating-linear-gradient(180deg, transparent 0 3px, color-mix(in srgb, var(--dsh-vibe-accent) 30%, transparent) 3px 4px); animation: dsh-vibe-scanlines 10s linear infinite; }',
      '@keyframes dsh-vibe-scanlines { to { background-position: 0 80px; } }',
      '.dsh-vibe-horizon-grid { position: absolute; left: -30%; right: -30%; bottom: -9%; height: 48%; transform: perspective(420px) rotateX(61deg); transform-origin: 50% 100%; background-image: repeating-linear-gradient(90deg, color-mix(in srgb, var(--dsh-vibe-primary) 56%, transparent) 0 1px, transparent 1px 68px), repeating-linear-gradient(0deg, color-mix(in srgb, var(--dsh-vibe-secondary) 52%, transparent) 0 1px, transparent 1px 48px); -webkit-mask-image: linear-gradient(180deg, transparent, black 55%); mask-image: linear-gradient(180deg, transparent, black 55%); animation: dsh-vibe-horizon 1.5s linear infinite; }',
      '@keyframes dsh-vibe-horizon { to { background-position: 0 48px, 0 48px; } }',
      '.dsh-vibe-retro-frame { position: absolute; inset: 16px; border: 2px solid color-mix(in srgb, var(--dsh-vibe-accent) 72%, transparent); box-shadow: inset 0 0 18px color-mix(in srgb, var(--dsh-vibe-primary) 22%, transparent), 0 0 10px color-mix(in srgb, var(--dsh-vibe-primary) 45%, transparent); clip-path: polygon(0 0, 14% 0, 16% 3px, 84% 3px, 86% 0, 100% 0, 100% 100%, 86% 100%, 84% calc(100% - 3px), 16% calc(100% - 3px), 14% 100%, 0 100%); animation: dsh-vibe-retro-flicker 3.2s steps(2, end) infinite; }',
      '.dsh-vibe-reticle { position: absolute; left: 50%; top: 50%; width: 86px; height: 86px; border: 1px solid var(--dsh-vibe-accent); border-radius: 50%; transform: translate(-50%, -50%); opacity: 0.58; box-shadow: 0 0 12px var(--dsh-vibe-primary); }',
      '.dsh-vibe-reticle:before, .dsh-vibe-reticle:after { content: ""; position: absolute; background: var(--dsh-vibe-accent); }',
      '.dsh-vibe-reticle:before { left: -18px; right: -18px; top: 50%; height: 1px; }',
      '.dsh-vibe-reticle:after { top: -18px; bottom: -18px; left: 50%; width: 1px; }',
      '@keyframes dsh-vibe-retro-flicker { 48% { opacity: 0.58; } 50% { opacity: 0.9; } }',

      // ── quick settings and native settings card ───────────────────────────
      ':has(> .dsh-vibe-quick) { flex-direction: column; align-items: flex-start; gap: 2px; }',
      '.dsh-vibe-quick { flex: none; align-items: center; width: 36px; height: 36px; display: flex; position: relative; font-family: var(--dsw-font-family); color: var(--dsw-alias-label-primary); }',
      '.dsh-vibe-quick-button { border: 0; background: transparent; color: var(--dsw-alias-label-primary); border-radius: 50%; width: 36px; height: 36px; padding: 0; display: grid; place-items: center; cursor: pointer; }',
      '.dsh-vibe-quick-button:hover, .dsh-vibe-quick-button[aria-expanded=true] { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-vibe-quick-button:focus-visible, .dsh-vibe-theme-select:focus-visible, .dsh-vibe-color:focus-visible, .dsh-vibe-hex:focus-visible, .dsh-vibe-panel-close:focus-visible, .dsh-vibe-reset:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 2px; }',
      '.dsh-vibe-quick-panel { position: fixed; z-index: 30; box-sizing: border-box; width: min(300px, calc(100vw - 24px)); overflow-y: auto; padding: 14px; border: 1px solid var(--dsw-alias-border-inverted); border-radius: 14px; background: var(--dsw-specific-menu); box-shadow: var(--dsw-shadow-lv3); }',
      '.dsh-vibe-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }',
      '.dsh-vibe-panel-title { margin: 0; font-size: 14px; line-height: 20px; font-weight: 600; }',
      '.dsh-vibe-panel-close { border: 0; border-radius: 7px; padding: 3px 7px; background: transparent; color: var(--dsw-alias-label-secondary); cursor: pointer; font: 12px/18px var(--dsw-font-family); }',
      '.dsh-vibe-panel-close:hover { background: var(--dsw-alias-interactive-bg-hover); }',
      '.dsh-vibe-field { min-width: 0; display: grid; gap: 7px; margin: 12px 0 0; padding: 0; border: 0; }',
      '.dsh-vibe-label { padding: 0; color: var(--dsw-alias-label-secondary); font-size: 12px; line-height: 18px; }',
      '.dsh-vibe-theme-select { box-sizing: border-box; width: 100%; border: 1px solid var(--dsw-alias-border-l2); border-radius: 8px; padding: 7px 9px; background: var(--dsw-alias-bg-layer-1); color: var(--dsw-alias-label-primary); cursor: pointer; font: 13px/20px var(--dsw-font-family); }',
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
      '.dsh-vibe-helper { margin: 3px 0 0 25px; color: var(--dsw-alias-label-tertiary); font-size: 11px; line-height: 16px; }',
      '.dsh-vibe-settings-card button:disabled, .dsh-vibe-settings-card input:disabled, .dsh-vibe-quick-panel button:disabled, .dsh-vibe-quick-panel input:disabled { opacity: 0.5; cursor: default; }',

      // Stop continuous movement for people who request reduced motion.
      '@media (prefers-reduced-motion: reduce) { .dsh-vibe-aurora, .dsh-vibe-stars, .dsh-vibe-corner, .dsh-vibe-ring, .dsh-vibe-grid, .dsh-vibe-caustics, .dsh-vibe-ocean-particles, .dsh-vibe-bubble, .dsh-vibe-sonar:before, .dsh-vibe-sonar-ping, .dsh-vibe-ember-heat, .dsh-vibe-ash, .dsh-vibe-spark, .dsh-vibe-energy-frame, .dsh-vibe-ember-pulse, .dsh-vibe-scanlines, .dsh-vibe-horizon-grid, .dsh-vibe-retro-frame { animation: none !important; } .dsh-vibe-scan { display: none; } }',
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

    function normalizeSettings(value, user) {
      var rawUser = typeof user === 'object' && user !== null ? user : undefined;
      var ownsTheme = rawUser !== undefined && Object.hasOwn(rawUser, 'theme');
      // The Host resolves new schema defaults into value even when an older
      // user document only owns `preset`. Inspecting the raw user layer keeps
      // that legacy choice authoritative until the user selects a new theme.
      var legacy = !ownsTheme && rawUser !== undefined ? rawUser.preset : undefined;
      var legacySettings = LEGACY_PRESETS[legacy];
      var theme =
        legacySettings?.theme ??
        (value !== undefined && THEMES[value.theme] !== undefined
          ? value.theme
          : DEFAULT_SETTINGS.theme);
      var ownsBaseColor = rawUser !== undefined && Object.hasOwn(rawUser, 'baseColor');
      var baseColor =
        legacySettings !== undefined && !ownsBaseColor
          ? legacySettings.baseColor
          : value !== undefined && /^#[0-9a-f]{6}$/i.test(value.baseColor)
            ? value.baseColor.toLowerCase()
            : DEFAULT_SETTINGS.baseColor;
      var followHarnessColors =
        legacySettings?.followHarnessColors ??
        (value !== undefined && typeof value.followHarnessColors === 'boolean'
          ? value.followHarnessColors
          : DEFAULT_SETTINGS.followHarnessColors);
      return {
        showFloatingButton:
          value === undefined || typeof value.showFloatingButton !== 'boolean'
            ? DEFAULT_SETTINGS.showFloatingButton
            : value.showFloatingButton,
        theme: theme,
        followHarnessColors: followHarnessColors,
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
        settings: normalizeSettings(snapshot.value, snapshot.user),
        available: snapshot.status === 'ready',
        writable: snapshot.status === 'ready' && snapshot.writable,
      };
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
      // Following Harness keeps Aurora byte-for-byte on its original token and
      // cyan fallbacks. Other visual systems use the same live token roles.
      if (settings.followHarnessColors && settings.theme === 'aurora') return {};
      if (settings.followHarnessColors) {
        return {
          '--dsh-vibe-primary': 'var(--dsw-alias-brand-primary, #4dc9ff)',
          '--dsh-vibe-secondary': 'var(--dsw-alias-state-success-primary, #4ed17e)',
          '--dsh-vibe-tertiary': 'var(--dsw-alias-state-warn-primary, #f59e0b)',
          '--dsh-vibe-accent': 'var(--dsw-alias-brand-primary, #4dc9ff)',
        };
      }
      var palette = customPalette(settings.baseColor);
      return {
        '--dsh-vibe-primary': palette.primary,
        '--dsh-vibe-secondary': palette.secondary,
        '--dsh-vibe-tertiary': palette.tertiary,
        '--dsh-vibe-accent': settings.baseColor,
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

    function selectTheme(scope, id) {
      var snapshot = scope.getSnapshot();
      if (!snapshot.writable) return;
      var user =
        typeof snapshot.user === 'object' && snapshot.user !== null ? snapshot.user : undefined;
      var legacy =
        user !== undefined && !Object.hasOwn(user, 'theme')
          ? LEGACY_PRESETS[user.preset]
          : undefined;
      var current = normalizeSettings(snapshot.value, snapshot.user);
      var operations = [];
      // Before removing a legacy preset, materialize only the color fields it
      // supplied implicitly. This keeps the visible palette stable across the
      // migration while preserving any field the user already owns.
      if (legacy !== undefined && !Object.hasOwn(user, 'followHarnessColors')) {
        operations.push(function () {
          return scope.set('followHarnessColors', current.followHarnessColors);
        });
      }
      if (legacy !== undefined && !Object.hasOwn(user, 'baseColor')) {
        operations.push(function () {
          return scope.set('baseColor', current.baseColor);
        });
      }
      operations.push(
        function () {
          return scope.set('theme', id);
        },
        function () {
          return scope.unset('preset');
        },
      );
      // Invoke every write before yielding. SettingsScope serializes this full
      // migration/action before any later user action can enqueue its writes.
      runWrites('theme', operations);
    }

    function selectBaseColor(scope, color) {
      if (!scope.getSnapshot().writable) return;
      runWrites('base color', [
        function () {
          return scope.set('baseColor', color);
        },
        function () {
          return scope.set('followHarnessColors', false);
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
          return scope.unset('theme');
        },
        function () {
          return scope.unset('baseColor');
        },
        function () {
          return scope.unset('followHarnessColors');
        },
        function () {
          return scope.unset('preset');
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
        selectBaseColor(scope, draft.toLowerCase());
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
            'select',
            {
              className: 'dsh-vibe-theme-select',
              value: settings.theme,
              disabled: disabled,
              'aria-label': 'Vibe theme',
              onChange: function (event) {
                selectTheme(scope, event.target.value);
              },
            },
            Object.keys(THEMES).map(function (id) {
              return react.createElement('option', { key: id, value: id }, THEMES[id].label);
            }),
          ),
        ),
        react.createElement(
          'div',
          null,
          react.createElement(
            'label',
            { className: 'dsh-vibe-toggle' },
            react.createElement('input', {
              type: 'checkbox',
              checked: settings.followHarnessColors,
              disabled: disabled,
              onChange: function (event) {
                store(scope, 'followHarnessColors', event.target.checked);
              },
            }),
            react.createElement('span', null, 'Follow Harness colors'),
          ),
          react.createElement(
            'p',
            { className: 'dsh-vibe-helper' },
            'Editing Base color turns this off.',
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
                selectBaseColor(scope, event.target.value.toLowerCase());
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
          var resizeObserver;
          if (typeof window.ResizeObserver === 'function') {
            resizeObserver = new window.ResizeObserver(update);
            if (buttonRef.current !== null) resizeObserver.observe(buttonRef.current);
            if (rootRef.current !== null) resizeObserver.observe(rootRef.current);
          }
          window.addEventListener('resize', update);
          document.addEventListener('pointerdown', dismissOutside);
          document.addEventListener('keydown', dismissWithEscape);
          return function () {
            window.removeEventListener('resize', update);
            document.removeEventListener('pointerdown', dismissOutside);
            document.removeEventListener('keydown', dismissWithEscape);
            if (resizeObserver !== undefined) resizeObserver.disconnect();
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

    function particleStyle(kind, index) {
      var position = (index * 23 + 7) % 97;
      var size = 3 + ((index * 7) % 8);
      var speed = 8 + ((index * 5) % 11);
      var delay = -((index * 1.7) % speed);
      var prefix = kind === 'bubble' ? '--bubble-' : '--spark-';
      return {
        [prefix + 'x']: position + '%',
        [prefix + 'size']: size + 'px',
        [prefix + 'speed']: speed + 's',
        [prefix + 'delay']: delay + 's',
      };
    }

    function particleElements(kind, count) {
      return Array.from({ length: count }, function (_, index) {
        return react.createElement('i', {
          key: kind + index,
          className: 'dsh-vibe-' + kind,
          style: particleStyle(kind, index),
        });
      });
    }

    // Every theme owns its visual structure rather than recoloring one effect.
    function BackgroundLayer(props) {
      var common = {
        className: 'dsh-vibe-bg dsh-vibe-bg-' + props.theme,
        style: props.style,
        'data-vibe-theme': props.theme,
      };
      if (props.theme === 'ocean') {
        return react.createElement(
          'div',
          common,
          react.createElement('div', { className: 'dsh-vibe-ocean-depth' }),
          react.createElement('div', { className: 'dsh-vibe-caustics' }),
          react.createElement('div', { className: 'dsh-vibe-ocean-particles' }),
          ...particleElements('bubble', 13),
        );
      }
      if (props.theme === 'ember') {
        return react.createElement(
          'div',
          common,
          react.createElement('div', { className: 'dsh-vibe-ember-heat' }),
          react.createElement('div', { className: 'dsh-vibe-ash' }),
          ...particleElements('spark', 16),
        );
      }
      if (props.theme === 'synthwave') {
        return react.createElement(
          'div',
          common,
          react.createElement('div', { className: 'dsh-vibe-synth-sky' }),
          react.createElement('div', { className: 'dsh-vibe-synth-sun' }),
          react.createElement('div', { className: 'dsh-vibe-scanlines' }),
          react.createElement('div', { className: 'dsh-vibe-horizon-grid' }),
        );
      }
      return react.createElement(
        'div',
        common,
        react.createElement('div', { className: 'dsh-vibe-aurora dsh-vibe-aurora-a' }),
        react.createElement('div', { className: 'dsh-vibe-aurora dsh-vibe-aurora-b' }),
        react.createElement('div', { className: 'dsh-vibe-aurora dsh-vibe-aurora-c' }),
        react.createElement('div', { className: 'dsh-vibe-stars' }),
      );
    }

    function AuroraHud(props) {
      return react.createElement(
        'div',
        {
          className: 'dsh-vibe-hud dsh-vibe-hud-aurora',
          style: props.style,
          'data-vibe-theme': 'aurora',
        },
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

    function ThemedHud(props) {
      if (props.theme === 'ocean') {
        return react.createElement(
          'div',
          {
            className: 'dsh-vibe-hud dsh-vibe-hud-ocean',
            style: props.style,
            'data-vibe-theme': 'ocean',
          },
          react.createElement(
            'div',
            { className: 'dsh-vibe-sonar' },
            react.createElement('div', { className: 'dsh-vibe-sonar-ping' }),
          ),
        );
      }
      if (props.theme === 'ember') {
        return react.createElement(
          'div',
          {
            className: 'dsh-vibe-hud dsh-vibe-hud-ember',
            style: props.style,
            'data-vibe-theme': 'ember',
          },
          react.createElement('div', { className: 'dsh-vibe-energy-frame' }),
          react.createElement('div', { className: 'dsh-vibe-ember-pulse' }),
          ...particleElements('spark', 9),
        );
      }
      if (props.theme === 'synthwave') {
        return react.createElement(
          'div',
          {
            className: 'dsh-vibe-hud dsh-vibe-hud-synthwave',
            style: props.style,
            'data-vibe-theme': 'synthwave',
          },
          react.createElement('div', { className: 'dsh-vibe-retro-frame' }),
          react.createElement('div', { className: 'dsh-vibe-reticle' }),
        );
      }
      return react.createElement(AuroraHud, { style: props.style });
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
      return react.createElement(ThemedHud, { theme: props.theme, style: props.style });
    }

    // One overlay entry renders both layers: background always, HUD on demand.
    function VibeRoot(props) {
      var view = useSettings(props.scope);
      var style = themeStyle(view.settings);
      return react.createElement(
        react.Fragment,
        null,
        react.createElement(BackgroundLayer, { theme: view.settings.theme, style: style }),
        react.createElement(ThinkingHud, {
          useSessions: props.useSessions,
          theme: view.settings.theme,
          style: style,
        }),
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
          'Choose a visual system and adjust its color separately.',
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
