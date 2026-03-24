import { Capacitor } from '@capacitor/core';

export type ATTStatus = 'authorized' | 'denied' | 'notDetermined' | 'restricted';

export async function requestTrackingPermission(): Promise<ATTStatus> {
  if (!Capacitor.isNativePlatform()) return 'authorized';
  
  try {
    // Dynamic import — only resolves on native iOS with the plugin installed
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await (import('@capacitor-community/app-tracking-transparency' as any) as Promise<any>);
    const { status } = await mod.AppTrackingTransparency.requestPermission();
    return status as ATTStatus;
  } catch (error) {
    console.warn('[ATT] Failed to request permission:', error);
    return 'denied';
  }
}

export async function getTrackingStatus(): Promise<ATTStatus> {
  if (!Capacitor.isNativePlatform()) return 'authorized';
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await (import('@capacitor-community/app-tracking-transparency' as any) as Promise<any>);
    const { status } = await mod.AppTrackingTransparency.getStatus();
    return status as ATTStatus;
  } catch (error) {
    console.warn('[ATT] Failed to get status:', error);
    return 'denied';
  }
}
