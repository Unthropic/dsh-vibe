import z from '@deepseek-ai/schemastery';

const SETTINGS_NAMESPACE = 'dsh-vibe';

const VibeSettingsSchema = z.object({
  showFloatingButton: z.boolean().default(true),
  preset: z.union(['adaptive', 'ocean', 'ember', 'custom']).default('adaptive'),
  baseColor: z
    .string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .default('#4dc9ff'),
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
