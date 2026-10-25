// First-party product analytics: events go to the analytics_events table (insert-only for
// clients). Fire-and-forget, so tracking can never slow down or break the UI.
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logMetaEvent } from '@/lib/metaEvents';

export type AnalyticsEvent =
  | 'app_open'
  | 'onboarding_started'
  | 'onboarding_step'
  | 'onboarding_complete'
  | 'sign_up'
  | 'sign_in'
  | 'profile_complete'
  | 'deck_loaded'
  | 'deck_finished'
  | 'swipe'
  | 'first_like'
  | 'details_opened'
  | 'values_card_shared'
  | 'save_prompt_shown'
  | 'save_prompt_action'
  | 'causes_updated'
  | 'ai_message_sent'
  | 'ai_widget_signed_out_tap'
  | 'recap_shown'
  | 'recap_shared'
  | 'paywall_shown'
  | 'purchase_started'
  | 'purchase_completed';

// These also go to Meta App Events, to compare ad angles
const META_EVENTS: AnalyticsEvent[] = ['onboarding_complete', 'first_like'];

const INSTALL_ID_KEY = 'analytics_install_id';
const FIRST_LIKE_KEY = 'analytics_first_like_sent';

const randomId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

const storage = {
  get(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* private mode or blocked storage */ }
  },
};

// Stable per install; ties pre-sign-in events (onboarding) to the account created later
function getInstallId(): string {
  let id = storage.get(INSTALL_ID_KEY);
  if (!id) {
    id = randomId();
    storage.set(INSTALL_ID_KEY, id);
  }
  return id;
}

const sessionId = randomId();
let cachedUserId: string | null = null;
supabase.auth.onAuthStateChange((_event, session) => {
  cachedUserId = session?.user?.id ?? null;
});

export function track(event: AnalyticsEvent, props: Record<string, unknown> = {}) {
  try {
    const row = {
      event,
      anonymous_id: getInstallId(),
      user_id: cachedUserId,
      session_id: sessionId,
      platform: Capacitor.getPlatform(),
      app_version: __APP_BUILD__,
      props: props as Json,
    };
    supabase.from('analytics_events').insert(row).then(({ error }) => {
      if (error) console.warn('[analytics] insert failed:', error.message);
    });
    if (META_EVENTS.includes(event)) logMetaEvent(event, props);
  } catch (error) {
    console.warn('[analytics] track failed:', error);
  }
}

// The first like on this install, ever (the north-star "time to first like" ends here)
export function trackLike(props: Record<string, unknown>) {
  track('swipe', { ...props, liked: true });
  if (!storage.get(FIRST_LIKE_KEY)) {
    storage.set(FIRST_LIKE_KEY, new Date().toISOString());
    track('first_like', props);
  }
}
