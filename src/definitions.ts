import type { PluginListenerHandle } from '@capacitor/core';

export type MeasurementPhase =
  | 'SPEED'
  | 'PACKET_LOSS'
  | 'STREAMING'
  | 'SOCIAL_LATENCY'
  | 'DNS'
  | 'WEB_BROWSING'
  | 'RADIO'
  | 'NETWORK'
  | 'DEVICE'
  | 'GEO'
  | 'COMPLETE';

export interface MeasurementProgressEvent {
  phase: MeasurementPhase;
}

export interface NetworkMetricsSdkPlugin {
  initialize(options: {
    backendUrl: string;
    authHeader?: string;
    intervalMinutes?: number;
    enableSpeed?: boolean;
    enablePacketLoss?: boolean;
    enableStreaming?: boolean;
    enableSocialLatency?: boolean;
    enableDns?: boolean;
    enableWebBrowsing?: boolean;
    udpHost?: string;
    udpPort?: number;
    tcpPort?: number;
    remoteConfigUrl?: string;
    streamingUrl?: string;
    speedDownloadDurationMs?: number;
    speedUploadDurationMs?: number;
    speedThreadCount?: number;
  }): Promise<void>;

  measureNow(): Promise<void>;

  getLastResult(): Promise<{ json: string | null; timestamp: number }>;

  addListener(
    eventName: 'measurementProgress',
    listenerFunc: (event: MeasurementProgressEvent) => void,
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}
