
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hassanomar.stockmatcherai',
  appName: 'StockMatcherAI',
  webDir: 'dist',
  // No fixed background: the web view uses the system's (white or black) while it loads, so dark
  // mode doesn't flash a light color
};

export default config;
