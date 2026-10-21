import { Capacitor, registerPlugin } from '@capacitor/core';

export type ATTStatus = 'authorized' | 'denied' | 'notDetermined' | 'restricted';

interface AppTrackingTransparencyPlugin {
  requestPermission(): Promise<{ status: string }>;
  getStatus(): Promise<{ status: string }>;
}

// Only resolves at runtime on native iOS when the plugin is installed
const AppTrackingTransparency = registerPlugin<AppTrackingTransparencyPlugin>(
  'AppTrackingTransparency'
);

export async function requestTrackingPermission(): Promise<ATTStatus> {
  if (!Capacitor.isNativePlatform()) return 'authorized';

  try {
    const { status } = await AppTrackingTransparency.requestPermission();
    return status as ATTStatus;
  } catch (error) {
    console.warn('[ATT] Failed to request permission:', error);
    return 'denied';
  }
}

// Asks once per install. Called after onboarding (never before the reveal screen).
export async function requestTrackingOnce(): Promise<void> {
  try {
    if (localStorage.getItem('att_status')) return;
    const status = await requestTrackingPermission();
    localStorage.setItem('att_status', status);
  } catch { /* storage blocked */ }
}

export async function getTrackingStatus(): Promise<ATTStatus> {
  if (!Capacitor.isNativePlatform()) return 'authorized';

  try {
    const { status } = await AppTrackingTransparency.getStatus();
    return status as ATTStatus;
  } catch (error) {
    console.warn('[ATT] Failed to get status:', error);
    return 'denied';
  }
}
