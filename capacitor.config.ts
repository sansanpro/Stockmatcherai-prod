
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hassanomar.stockmatcherai',
  appName: 'StockMatcherAI',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4f46e5',
      showSpinner: false
    }
  }
};

export default config;
