
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.a8e2b68748bf41719dfa1c6295dd71d3',
  appName: 'wealth-wiz-ai',
  webDir: 'dist',
  server: {
    url: 'https://a8e2b687-48bf-4171-9dfa-1c6295dd71d3.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#4f46e5',
      showSpinner: false
    }
  }
};

export default config;
