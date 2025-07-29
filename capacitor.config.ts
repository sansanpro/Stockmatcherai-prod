
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
    },
    Stripe: {
      publishableKey: 'pk_test_51Q8l4wKVN448QAiBDGLmjLTQAQY5DFzNGTbNxrhIJYQWgSj8VDUHBKNfr5qS6CZmS5cUIvR3fKkzWFvjhqfhSlxK00cEpPOOIe'
    }
  }
};

export default config;
