# dsh-vibe

> Ambient sci-fi vibes for the [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) web surface.

dsh-vibe is a dual-face Cordis plugin that adds two layers of atmosphere to the
dsh web UI:

1. **A permanent background** — three slow-drifting aurora glows (theme-aware)
   and a deep, slowly scrolling starfield.
2. **A thinking HUD** — the moment the model starts thinking, a sci-fi overlay
   fades in: four pulsing corner brackets, a scanning energy beam, two spinning
   energy rings, and a synthwave perspective grid flowing along the bottom of
   the screen. The HUD unmounts when the response finishes or stops.

Everything is pure CSS animation, fully click-through, and adapts to your
light/dark theme.

### Ambient background

Idle Harness UI with the always-on aurora and starfield:

![dsh-vibe ambient background in an idle Harness session](assets/background.gif)

### Thinking HUD

The HUD activated by a real running model response:

![dsh-vibe thinking HUD during a running Harness response](assets/thinking.gif)

## Features

| Layer                        | What you get                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------ |
| Background (always)          | 3 aurora glows · drifting 2-layer starfield                                    |
| Thinking HUD (while running) | glowing corner brackets · scan beam · 2 spinning energy rings · synthwave grid |

- **Zero interaction cost** — `pointer-events: none` on every layer, hardened
  against the shell's overlay CSS. It can never block a click.
- **Theme-aware** — glows use the harness theme tokens
  (`--dsw-alias-brand-primary`, state colors, label colors), so it looks right
  in light and dark mode.
- **Instant show/hide** — the HUD is driven by the same `useSessions` running
  flag the sidebar uses; no polling, no extra services.
- **No build step, no config schema, no persistence** — it is one hand-written
  client bundle plus an inert host half.
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

| Harness version | Validation                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `0.1.0-rc.8`    | Visual runtime test                                                                                   |
| `0.1.1-rc.2`    | Packed bundle add/dump/remove cycle; client module loader, `shell.overlay`, and running state checked |

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

## Tuning

Everything visual lives in [`lib/client.js`](lib/client.js):

- `var CYAN = "77, 201, 255"` — the HUD accent color (R, G, B).
- Opacities — `opacity: 0.42` on `.dsh-vibe-aurora`, `0.5` on
  `.dsh-vibe-stars`, `0.3` on `.dsh-vibe-ring`, `0.9` on `.dsh-vibe-corner`.
- Animation speeds — `dsh-vibe-scan 4.5s`, ring spins `7s`/`11s`, grid
  `1.6s`, star drift `70s`, aurora drift `26s–40s`.
- Remove a piece entirely by deleting its CSS block and its
  `react.createElement(...)` line in `BackgroundLayer` / `ThinkingHud`.

After editing, the running server serves the changed bundle on the next page
hard-refresh (no restart needed for bundle content changes; adding or removing
the row itself requires a restart).

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
