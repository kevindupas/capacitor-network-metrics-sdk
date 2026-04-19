import { WebPlugin } from '@capacitor/core';
import type { NetworkMetricsSdkPlugin } from './definitions';

export class NetworkMetricsSdkWeb extends WebPlugin implements NetworkMetricsSdkPlugin {
  async initialize(_options: Parameters<NetworkMetricsSdkPlugin['initialize']>[0]): Promise<void> {
    throw this.unimplemented('Not available on web.');
  }
  async measureNow(): Promise<void> {
    throw this.unimplemented('Not available on web.');
  }
  async getLastResult(): Promise<{ json: string | null; timestamp: number }> {
    throw this.unimplemented('Not available on web.');
  }
}
