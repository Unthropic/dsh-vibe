// Host half of dsh-vibe.
// The visual effects are entirely client-side; this row exists so the host
// loader activates the package and the client-modules scanner can pick its
// `dsh.client` declaration up into the browser roster.
export default {
  name: 'dsh-vibe',
  apply() {},
};
