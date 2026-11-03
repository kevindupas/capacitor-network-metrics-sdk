import { WebPlugin } from '@capacitor/core';
import type { NetworkMetricsSdkPlugin } from './definitions';

export class NetworkMetricsSdkWeb extends WebPlugin implements NetworkMetricsSdkPlugin {
  async initialize(_options: Parameters<NetworkMetricsSdkPlugin['initialize']>[0]): Promise<void> {
    throw this.unimplemented('Not available on web.');
  }
  async stop(): Promise<void> {
    throw this.unimplemented('Not available on web.');
  }
  async measureNow(_options?: { skipSpeed?: boolean }): Promise<{ testId: string }> {
    throw this.unimplemented('Not available on web.');
  }
  async getRadioSnapshot(): ReturnType<NetworkMetricsSdkPlugin['getRadioSnapshot']> {
    throw this.unimplemented('Not available on web.');
  }
  async getLastResult(): ReturnType<NetworkMetricsSdkPlugin['getLastResult']> {
    throw this.unimplemented('Not available on web.');
  }
  async getGnssSatellites(): ReturnType<NetworkMetricsSdkPlugin['getGnssSatellites']> {
    throw this.unimplemented('Not available on web.');
  }
  async stopGnssSatellites(): Promise<void> {
    throw this.unimplemented('Not available on web.');
  }
  async getNeighborCells(): ReturnType<NetworkMetricsSdkPlugin['getNeighborCells']> {
    throw this.unimplemented('Not available on web.');
  }
}
