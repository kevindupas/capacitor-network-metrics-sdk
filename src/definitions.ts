import type { PluginListenerHandle } from '@capacitor/core';

export type MeasurementPhase =
  | 'SPEED_DOWNLOAD_PROGRESS'
  | 'SPEED_UPLOAD_PROGRESS'
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
  /** Instantaneous Mbps, only set when phase is SPEED_DOWNLOAD_PROGRESS or SPEED_UPLOAD_PROGRESS. */
  mbps?: number;
  /** SPEED phase payload — final values once the speed test finishes. */
  downloadMbps?: number;
  uploadMbps?: number;
  latencyMs?: number;
  jitterMs?: number;
  loadedLatencyMs?: number;
  serverName?: string;
  serverLocation?: string;
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

  /**
   * Trigger an immediate one-shot measurement.
   * @param options.skipSpeed — when true, skips the native speed phase (useful in foreground
   *   when the app runs Cloudflare JS speed test separately to avoid duplicate work).
   */
  measureNow(options?: { skipSpeed?: boolean }): Promise<void>;

  /**
   * Fast synchronous snapshot — Radio + Device info only, no network I/O.
   * Use at app launch to populate operator/signal display immediately.
   */
  getRadioSnapshot(): Promise<{
    radio: {
      rsrp: number | null;
      rsrq: number | null;
      sinr: number | null;
      rssi: number | null;
      cqi: number | null;
      ci: number | null;
      pci: number | null;
      tac: number | null;
      earfcn: number | null;
      isVoLteAvailable: boolean | null;
      isNrAvailable: boolean | null;
      networkGeneration: string | null;
      signalStrengthLevel: string | null;
      technology: string | null;
    } | null;
    device: {
      simOperatorName: string | null;
      mcc: string | null;
      mnc: string | null;
      batteryLevel: number | null;
      isCharging: boolean | null;
    } | null;
  }>;

  getLastResult(): Promise<{ json: string | null; timestamp: number }>;

  addListener(
    eventName: 'measurementProgress',
    listenerFunc: (event: MeasurementProgressEvent) => void,
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}
