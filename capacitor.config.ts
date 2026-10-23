
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hassanomar.stockmatcherai',
  appName: 'StockMatcherAI',
  webDir: 'dist',
  // Cream behind the web view, so there's no flash of another color while it loads
  backgroundColor: '#FAF6EF',
  ios: {
    backgroundColor: '#FAF6EF',
  },
};

export default config;
