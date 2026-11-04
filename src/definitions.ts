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

/**
 * `stopped`: by `stop()`, by the system, or replaced by a newer `measureNow`. A run stopped by the
 * system is not run again.
 */
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
  /**
   * COMPLETE phase. False when no UDP loss test ran, or only the TCP fallback, which hides loss:
   * MOS and scores then leave loss out, so do not present them as complete.
   */
  packetLossMeasured?: boolean;
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
  /** VoLTE enabled. Null when not readable: it comes from a hidden Android API. Never a guess. */
  isVoLteAvailable: boolean | null;
  /** VoNR enabled. Null when not readable, and below Android 12. Never a guess. */
  isVoNrAvailable: boolean | null;
  /**
   * True when `nrMode` is set or the serving cell is NR. On LTE that follows the phone's 5G icon,
   * which can show for a cell merely capable of EN-DC: see `nrLegObserved`.
   */
  isNrAvailable: boolean | null;
  /**
   * An NR cell or NR signal was actually seen for this SIM. `nrMode` 'NSA' without it means the
   * phone shows 5G but no NR leg was observed. Android only.
   */
  nrLegObserved: boolean | null;
  isRoaming: boolean | null;
  /**
   * Null when not on 5G or unknown. 'NSA' matches the phone's own 5G icon, see `nrLegObserved`.
   * In NSA, rsrp/rsrq/sinr are the LTE anchor's.
   */
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
   * The subscription mobile data goes through right now. When the device is on mobile data,
   * throughput, latency and MOS are measured over this SIM. On Wi-Fi it is still set, but they
   * went over Wi-Fi: see `radio.technology`.
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

  /**
   * Cancels periodic work and a one-shot in progress (FAILED, `stopped`), and releases the GNSS
   * and 5G listeners. Later reads register them again, so it is safe during a recording.
   * Android only: the iOS plugin does not implement it and the call rejects there.
   */
  stop(): Promise<void>;

  /**
   * Trigger an immediate one-shot measurement.
   * @param options.skipSpeed — when true, skips the native speed phase (useful in foreground
   *   when the app runs Cloudflare JS speed test separately to avoid duplicate work).
   * Rejects if initialize() was not called. Resolves as soon as the run is enqueued: wait for
   * COMPLETE or FAILED. With no network, FAILED (`no_network`) comes right away. A later call
   * replaces this run: it gets FAILED (`stopped`), possibly before that call resolves.
   * If a periodic run is measuring, this one starts when that ends. If the app's process dies
   * mid-run no terminal event comes at all, so keep a timeout of your own.
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

  /**
   * The last record of any run, periodic included: compare `testId` with the one you ran.
   * `testId`: the run this record belongs to. Null when there is no result.
   * `posted`: whether that result reached the backend. Null when unknown or no backend.
   * `packetLossMeasured`: see the COMPLETE event. Null when there is no result.
   */
  getLastResult(): Promise<{
    json: string | null;
    testId: string | null;
    timestamp: number;
    posted: boolean | null;
    packetLossMeasured: boolean | null;
  }>;

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
