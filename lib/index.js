import z from '@deepseek-ai/schemastery';

const SETTINGS_NAMESPACE = 'dsh-vibe';

const VibeSettingsSchema = z.object({
  showFloatingButton: z.boolean().default(true),
  showThinkingEffects: z.boolean().default(true),
  theme: z.union(['aurora', 'ocean', 'ember', 'synthwave', 'manbo']).default('aurora'),
  followHarnessColors: z.boolean().default(true),
  playSound: z.boolean().default(true),
  soundVolume: z.percent().default(0.25),
  baseColor: z
    .string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .default('#4dc9ff'),
  // Accepted without a default so settings saved by the former preset model
  // remain readable while the client migrates their meaning to true themes.
  preset: z.union(['adaptive', 'ocean', 'ember', 'custom']),
  // Kept without a default so existing Manbo users retain their sound choice.
  playManboSound: z.boolean(),
});

// Host half of dsh-vibe. Register the durable namespace when the Harness
// settings service joins this Cordis composition.
export default {
  name: 'dsh-vibe',
  apply(ctx) {
    ctx.inject(['settings'], (settingsCtx) => {
      settingsCtx.settings.register(SETTINGS_NAMESPACE, VibeSettingsSchema);
    });
  },
};
