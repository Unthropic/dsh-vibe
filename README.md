# dsh-vibe

English | [简体中文](README.zh-CN.md)

> Ambient sci-fi vibes for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web surface.

dsh-vibe is a dual-face Cordis plugin that adds a configurable visual theme to
the dsh web UI:

1. **A permanent background** — each theme has its own animated atmosphere.
2. **A thinking HUD** — each theme adds a matching overlay while the model is
   thinking. The HUD unmounts when the response finishes or stops.

The visual effects use CSS animation and remain fully click-through. A Vibe
button in the bottom-left sidebar footer gives you quick access to the plugin's
appearance settings.

### Ambient background

Idle Harness UI with the default Aurora theme:

![dsh-vibe ambient background in an idle Harness session](assets/background.gif)

### Thinking HUD

The default Aurora HUD activated by a real running model response:

![dsh-vibe thinking HUD during a running Harness response](assets/thinking.gif)

## Features

| Layer                        | What you get                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| Background (always)          | a distinct animated atmosphere for Aurora, Ocean, Ember, or Synthwave              |
| Thinking HUD (while running) | a theme-specific motion and HUD system                                             |
| Vibe settings                | theme dropdown · Harness color matching · custom base color · quick button · reset |

- **Zero interaction cost** — `pointer-events: none` on every layer, hardened
  against the shell's overlay CSS. It can never block a click.
- **Four real themes** — Aurora, Ocean, Ember, and Synthwave change the motion,
  background, and thinking HUD—not only the color palette.
- **Independent color controls** — follow Harness colors or choose your own
  base color without changing the selected visual theme.
- **Easy to configure** — open the Vibe button in the bottom-left sidebar
  footer to switch themes or adjust the color controls.
- **Instant HUD** — the thinking effects follow the same `useSessions` running
  flag used by the sidebar, with no polling.
- **Saved automatically** — configuration is persisted by the Harness host and
  restored when you return.
- **Reduced-motion aware** — continuous movement stops when the operating
  system requests reduced motion.

## Requirements

- [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) (dsh)
  with the `web` profile running.
- Node 20+.
- `pnpm` available on your `PATH` (the `dsh plugin` command uses it to manage
  profile packages).

If `pnpm --version` is not available, install it first with
`npm install --global pnpm`.

### Compatibility

| Harness version | Validation                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| `0.1.0-rc.8`    | Live isolated UI: quick panel, Plugin configuration, persistence, themes, light/dark, rail, and mobile layouts |
| `0.1.1-rc.2`    | Packed bundle add/dump/remove cycle; client module loader, `shell.overlay`, and running state checked          |

Harness is still evolving. If a newer release changes the client contract,
please open an issue with the Harness version and browser console output.

## Install

```sh
dsh plugin --profile web add dsh-vibe
```

This downloads `dsh-vibe` from npm into the Web profile and activates its
bundle automatically. Restart `dsh web`, then hard-refresh the page (Ctrl+F5).
No manual YAML editing is needed.

## Update

```sh
dsh plugin --profile web update dsh-vibe
```

Restart `dsh web` after updating, then hard-refresh the page.

## Migrating from the manual installation

If you installed an older version by adding a `dsh-vibe` row to
`$DSH_HOME/profiles/web/cordis.patch.yml`, remove that row **before** running
the install command above. The bundle now supplies the row; leaving both copies
would insert the same plugin twice.

After removing the old row, run the install command and restart `dsh web`.

## Install the latest source from GitHub (no npm registry)

```sh
dsh plugin --profile web add github:unthropic/dsh-vibe
```

Restart `dsh web` after installation. This still requires `pnpm`; it only
changes where the package is downloaded from.

## Configuration

Select the **Vibe** button in the bottom-left sidebar footer for quick changes.
The same controls—and the quick-button switch—are available under **Settings →
Plugins → Plugin configuration → dsh-vibe**.

The **Theme** dropdown selects a complete visual system:

- **Aurora** — drifting aurora veils, a star field, and a sci-fi ring/grid HUD.
- **Ocean** — moving caustic light, bubbles and particles, and a sonar-sweep
  HUD.
- **Ember** — heat glow and shimmer, rising sparks and ash, and an angular
  energy-frame HUD.
- **Synthwave** — a striped neon sunset, scanlines, a perspective horizon grid,
  and a retro neon HUD.

Changing **Theme** selects only the visual system; it does not change the color
setting. Color settings are independent controls:

- **Follow Harness colors** — uses Harness theme colors so the effects adapt to
  the current light or dark appearance.
- **Base color** — chooses the effect accent. Editing it automatically turns
  **Follow Harness colors** off.
- **Show floating Vibe button** — hides or restores the quick-access button;
  this switch remains available in Plugin configuration.
- **Reset** — restores the Aurora theme with **Follow Harness colors** enabled.

Changes appear immediately and are saved through the Harness host. Your theme,
color choices, and quick-button preference are restored when you return.
Continuous movement still stops when your operating system requests reduced
motion.

## Development

```sh
npm install
npm run check
```

Run `npm run demos:render` to capture the animated README demos from a real,
running DeepSeek Harness UI with this plugin enabled. It uses
`http://127.0.0.1:3081/` by default; set `DSH_DEMO_URL` to use another address.
The renderer opens an isolated browser, verifies both Harness and the plugin,
captures the idle background, submits one real model prompt, captures the HUD
only while Harness reports that response as running, and fully decodes the
generated GIFs before accepting them. The selected model provider therefore
needs enough quota for one response. Set `DSH_DEMO_PROMPT` to replace the
default capture prompt.

## Uninstall

```sh
dsh plugin --profile web remove dsh-vibe
```

Restart `dsh web` after removal.

## License

[MIT](LICENSE) © 2026 Unthropic
