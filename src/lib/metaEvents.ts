// Meta App Events (for comparing ad angles). A no-op until the Meta SDK plugin and app ID are
// configured; analytics.ts calls this for onboarding_complete and first_like.
export function logMetaEvent(_event: string, _props: Record<string, unknown> = {}) {
  // Intentionally empty for now: needs a Meta app ID + client token and a Capacitor plugin
  // wrapping Meta's iOS SDK, with advertiser tracking set from the ATT answer.
}
