import { registerPlugin } from '@capacitor/core';
import type { NetworkMetricsSdkPlugin } from './definitions';

const NetworkMetricsSdk = registerPlugin<NetworkMetricsSdkPlugin>(
  'NetworkMetricsSdk',
  { web: () => import('./web').then(m => new m.NetworkMetricsSdkWeb()) }
);

export * from './definitions';
export { NetworkMetricsSdk };
