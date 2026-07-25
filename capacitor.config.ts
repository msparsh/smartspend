import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartspend.app',
  appName: 'smartspend',
  webDir: 'out',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || undefined,
    cleartext: true,
  },
};

export default config;
