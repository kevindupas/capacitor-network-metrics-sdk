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
  }): Promise<void>;

  measureNow(): Promise<void>;

  getLastResult(): Promise<{ json: string | null; timestamp: number }>;
}
