import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

// One place for haptics, so every moment uses the storyboard's strength (docs/phase-0.md):
// light = a swipe released or a recap slide, medium = a like, success = a tip thank-you.
// Silent where unsupported (the web, older devices).
export type HapticKind = 'light' | 'medium' | 'success';

export function haptic(kind: HapticKind) {
  try {
    const done = kind === 'success'
      ? Haptics.notification({ type: NotificationType.Success })
      : Haptics.impact({ style: kind === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light });
    done.catch(() => {});
  } catch { /* plugin missing */ }
}
