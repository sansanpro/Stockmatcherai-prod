import { Capacitor } from '@capacitor/core';

export type ATTStatus = 'authorized' | 'denied' | 'notDetermined' | 'restricted';

export async function requestTrackingPermission(): Promise<ATTStatus> {
  if (!Capacitor.isNativePlatform()) return 'authorized';
  
  try {
    const { AppTrackingTransparency } = await import('@capacitor-community/app-tracking-transparency');
    const { status } = await AppTrackingTransparency.requestPermission();
    return status as ATTStatus;
  } catch (error) {
    console.warn('[ATT] Failed to request permission:', error);
    return 'denied';
  }
}

export async function getTrackingStatus(): Promise<ATTStatus> {
  if (!Capacitor.isNativePlatform()) return 'authorized';
  
  try {
    const { AppTrackingTransparency } = await import('@capacitor-community/app-tracking-transparency');
    const { status } = await AppTrackingTransparency.getStatus();
    return status as ATTStatus;
  } catch (error) {
    console.warn('[ATT] Failed to get status:', error);
    return 'denied';
  }
}
