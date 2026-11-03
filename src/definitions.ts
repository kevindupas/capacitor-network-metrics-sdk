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
  | 'COMPLETE'
  /** After COMPLETE, when a backend is set: `posted` says if the record reached it. */
  | 'POST'
  /** Terminal: nothing follows for this testId. `error` says why. */
  | 'FAILED';

export type MeasurementFailureCode = 'no_network' | 'config_missing' | 'stopped' | 'error';

export interface MeasurementProgressEvent {
  phase: MeasurementPhase;
  /**
   * The run this event belongs to, as resolved by measureNow. A FAILED event can arrive before
   * that promise resolves. Periodic runs send no events.
   */
  testId?: string;
  /** Instantaneous Mbps, only set when phase is SPEED_DOWNLOAD_PROGRESS or SPEED_UPLOAD_PROGRESS. */
  mbps?: number;
  /** SPEED phase payload — final values once the speed test finishes. Null: not measured, never 0. */
  downloadMbps?: number | null;
  uploadMbps?: number | null;
  latencyMs?: number | null;
  jitterMs?: number | null;
  loadedLatencyMs?: number;
  serverName?: string;
  serverLocation?: string;
  /** FAILED phase. */
  error?: MeasurementFailureCode;
  /** FAILED and POST phases: detail for logs. */
  message?: string;
  /** POST phase. */
  posted?: boolean;
  httpStatus?: number;
}

export interface RadioInfo {
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
  /** RSSI on LTE and GSM. On WCDMA and TD-SCDMA it holds RSCP, like `rscp`. */
  rssi: number | null;
  /** WCDMA and TD-SCDMA RSCP. */
  rscp: number | null;
  cqi: number | null;
  ci: number | null;
  pci: number | null;
  tac: number | null;
  /** GSM and WCDMA Location Area Code. */
  lac: number | null;
  /** LTE EARFCN, NR NR-ARFCN, WCDMA or TD-SCDMA UARFCN, GSM ARFCN. Depends on the generation. */
  earfcn: number | null;
  /** LTE channel bandwidth in kHz. */
  bandwidth: number | null;
  /** WCDMA Primary Scrambling Code. */
  psc: number | null;
  /** LTE Timing Advance, raw units. Distance ≈ TA × 78.07 m (consumer-side). */
  timingAdvance: number | null;
  /** Age of the cell reading when sampled. */
  cellAgeMs: number | null;
  isVoLteAvailable: boolean | null;
  isVoNrAvailable: boolean | null;
  isNrAvailable: boolean | null;
  isRoaming: boolean | null;
  /** Null when not on 5G or unknown. In NSA, rsrp/rsrq/sinr are the LTE anchor's. */
  nrMode: 'NSA' | 'SA' | null;
  /** NR leg. In NSA next to the anchor's values, in SA equal to them. */
  nrRsrp: number | null;
  nrRsrq: number | null;
  nrSinr: number | null;
  networkGeneration: string | null;
  signalStrengthLevel: string | null;
  technology: string | null;
}

export interface GnssSatellite {
  svid: number;
  constellation: 'GPS' | 'GLO' | 'GAL' | 'BDS' | 'QZS' | 'SBAS' | 'IRN' | 'OTH';
  azimuth: number;       // degrees from north (clockwise)
  elevation: number;     // degrees above horizon
  cn0DbHz: number;       // signal C/N0
  usedInFix: boolean;
}

export interface GnssSatellitesSnapshot {
  satellites: GnssSatellite[];
  inView: number;
  usedInFix: number;
  avgCn0DbHz: number;
}

export interface NeighborCell {
  technology: 'LTE' | 'NR' | 'WCDMA' | 'GSM';
  isRegistered: boolean;
  mcc: string | null;
  mnc: string | null;
  tac: number | null;
  ci: number | null;
  nci: number | null;
  pci: number | null;
  psc: number | null;
  arfcn: number | null;
  rsrp: number | null;
  rsrq: number | null;
  sinr: number | null;
  asuLevel: number | null;
  dbm: number | null;
  timestampNanos: number;
  /** Age of this reading when sampled. */
  cellAgeMs: number | null;
}

export interface NeighborCellsSnapshot {
  cells: NeighborCell[];
  count: number;
}

export interface RadioPerSimInfo {
  subscriptionId: number;
  slotIndex: number;
  carrierName: string | null;
  /** MCC/MNC of the subscription's home network, not of the cell it is camped on. */
  mcc: string | null;
  mnc: string | null;
  /**
   * The subscription currently carrying mobile data. Throughput, latency and MOS are
   * measured over this SIM, so treat it as the reference reading when several are active.
   */
  isDefaultData: boolean;
  radio: RadioInfo | null;
}

export interface NetworkMetricsSdkPlugin {
  initialize(options: {
    backendUrl: string;
    authHeader?: string;
    /**
     * Periodic background measurements, each a full speed test. Only scheduled when passed;
     * without it, any periodic work scheduled earlier is cancelled. Minimum 15. Android only.
     */
    intervalMinutes?: number;
    enableSpeed?: boolean;
    enablePacketLoss?: boolean;
    enableStreaming?: boolean;
    enableSocialLatency?: boolean;
    enableDns?: boolean;
    enableWebBrowsing?: boolean;
    udpHost?: string;
    udpPort?: number;
    /** Defaults to 8230. */
    tcpPort?: number;
    remoteConfigUrl?: string;
    streamingUrl?: string;
    speedDownloadDurationMs?: number;
    speedUploadDurationMs?: number;
    speedThreadCount?: number;
    /** Server exposing `/__down?bytes=N` and `/__up`. Defaults to Cloudflare. */
    speedTestBaseUrl?: string;
  }): Promise<void>;

  /** Cancels periodic work and a one-shot in progress (FAILED, `stopped`), releases GNSS. */
  stop(): Promise<void>;

  /**
   * Trigger an immediate one-shot measurement.
   * @param options.skipSpeed — when true, skips the native speed phase (useful in foreground
   *   when the app runs Cloudflare JS speed test separately to avoid duplicate work).
   * Rejects if initialize() was not called. Resolves as soon as the run is enqueued: wait for
   * COMPLETE or FAILED. With no network, FAILED (`no_network`) comes right away.
   */
  measureNow(options?: { skipSpeed?: boolean }): Promise<{ testId: string }>;

  /**
   * Fast synchronous snapshot — Radio + Device info only, no network I/O.
   * Use at app launch to populate operator/signal display immediately.
   */
  getRadioSnapshot(): Promise<{
    radio: RadioInfo | null;
    radioPerSim: RadioPerSimInfo[];
    device: {
      simOperatorName: string | null;
      mcc: string | null;
      mnc: string | null;
      batteryLevel: number | null;
      isCharging: boolean | null;
    } | null;
  }>;

  /** `posted`: whether that result reached the backend. Null when unknown or no backend. */
  getLastResult(): Promise<{ json: string | null; timestamp: number; posted: boolean | null }>;

  /**
   * Snapshot of GNSS satellites currently visible. Android only.
   * Requires ACCESS_FINE_LOCATION permission and that location services are on.
   */
  getGnssSatellites(): Promise<GnssSatellitesSnapshot>;

  /** Unregisters the callback getGnssSatellites keeps registered. Android only. */
  stopGnssSatellites(): Promise<void>;

  /**
   * Snapshot of all visible cells (serving + neighbors). Android only.
   * Requires ACCESS_FINE_LOCATION + READ_PHONE_STATE; returns
   * `{ cells: [], count: 0 }` if either is missing.
   */
  getNeighborCells(): Promise<NeighborCellsSnapshot>;

  addListener(
    eventName: 'measurementProgress',
    listenerFunc: (event: MeasurementProgressEvent) => void,
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}
