# capacitor-network-metrics-sdk

Capacitor plugin for comprehensive network quality measurement on Android and iOS. Thin bridge over:
- **Android**: [android-network-metrics-sdk](https://github.com/kevindupas/android-network-metrics-sdk) via JitPack
- **iOS**: [ios-network-metrics-sdk](https://github.com/kevindupas/ios-network-metrics-sdk) via SPM

## Install

```bash
npm install capacitor-network-metrics-sdk
npx cap sync
```

## Android setup

### `android/build.gradle` — add JitPack

```groovy
repositories {
    maven { url 'https://jitpack.io' }
}
```

### `android/app/src/main/AndroidManifest.xml` — permissions

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.READ_PHONE_STATE" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

<!-- Background work -->
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

### Register plugin in `MainActivity.java`

```java
import com.kevindupas.networkmetricssdk.NetworkMetricsSdkPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NetworkMetricsSdkPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
```

## iOS setup

### `Info.plist` — required keys

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Used to tag network measurements with GPS coordinates.</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Used to tag background network measurements with GPS coordinates.</string>
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.networkmetrics.refresh</string>
</array>
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
</array>
```

## Usage

```typescript
import { NetworkMetricsSdk } from 'capacitor-network-metrics-sdk';

// Initialize once (e.g. in app startup)
await NetworkMetricsSdk.initialize({
  backendUrl:          'https://your-backend.com/api/measurements',
  authHeader:          'Bearer YOUR_TOKEN',
  intervalMinutes:     15,
  enableSpeed:         true,
  enablePacketLoss:    true,
  enableStreaming:     true,
  enableSocialLatency: true,
  enableDns:           true,
  enableWebBrowsing:   true,
  udpHost:             'your-udp-server.com',
  udpPort:             5005,
  tcpPort:             5006,
  remoteConfigUrl:     'https://your-backend.com/api/config/targets', // optional
});

// Trigger a measurement immediately
await NetworkMetricsSdk.measureNow();

// Read last stored result
const { json, timestamp } = await NetworkMetricsSdk.getLastResult();
if (json) {
  const record = JSON.parse(json);
  console.log('Download:', record.speed?.downloadMbps, 'Mbps');
  console.log('MOS:', record.mos);
}
```

## API

### `initialize(options)`

Starts the SDK and schedules periodic background measurements.

| Option | Type | Default | Description |
|---|---|---|---|
| `backendUrl` | `string` | required | POST endpoint for measurements |
| `authHeader` | `string` | — | `Authorization` header |
| `intervalMinutes` | `number` | `15` | Background interval |
| `enableSpeed` | `boolean` | `true` | Speed test |
| `enablePacketLoss` | `boolean` | `true` | Packet loss |
| `enableStreaming` | `boolean` | `true` | HLS simulation |
| `enableSocialLatency` | `boolean` | `true` | Social platform TTFB |
| `enableDns` | `boolean` | `true` | DNS timing |
| `enableWebBrowsing` | `boolean` | `true` | Web phase timing |
| `udpHost` | `string` | `""` | UDP echo server |
| `udpPort` | `number` | `5005` | UDP port |
| `tcpPort` | `number` | `5006` | TCP fallback port |
| `remoteConfigUrl` | `string` | — | Remote web targets URL (1h cache) |

### `measureNow()`

Triggers an immediate one-shot measurement cycle. Returns as soon as the measurement is queued (non-blocking).

### `getLastResult()`

Returns the last stored measurement.

```typescript
{ json: string | null, timestamp: number }
// timestamp = ms since epoch, 0 if no result yet
```

## Payload reference

Full payload documented in [android-network-metrics-sdk/PAYLOAD_REFERENCE.md](https://github.com/kevindupas/android-network-metrics-sdk/blob/main/PAYLOAD_REFERENCE.md).

Key fields:

```json
{
  "testId":    "uuid",
  "deviceId":  "platform-device-id",
  "timestamp": "2026-04-19T10:00:00Z",
  "speed":     { "downloadMbps": 12.4, "uploadMbps": 5.1, "latencyMs": 28, "jitterMs": 3.2 },
  "udpPacketLoss": { "lossPercent": 1.0, "method": "UDP" },
  "radio":     { "rsrp": -85, "networkGeneration": "4G", "nrMode": null },
  "network":   { "isp": "Safaricom", "cfColo": "NBO", "isLocallyServed": true },
  "device":    { "model": "Pixel 8", "thermalStatus": "NONE" },
  "scores":    { "streaming": { "score": 4, "label": "Good" } },
  "mos":       4.2
}
```

## Platform feature matrix

| Feature | Android | iOS |
|---|:---:|:---:|
| Speed DL/UL/Latency/Jitter | ✅ | ✅ |
| Packet loss UDP/TCP | ✅ | ✅ |
| HLS streaming | ✅ | ✅ FG / ⚠️ BG |
| Social latency | ✅ | ✅ |
| DNS timing | ✅ | ✅ |
| Web browsing phases | ✅ | ✅ |
| GPS location | ✅ | ✅ |
| ISP / ASN / CF PoP | ✅ | ✅ |
| Device info / battery / thermal | ✅ | ✅ |
| RAM usage | ✅ | ✅ |
| CPU load % | ✅ | ❌ |
| MCC / MNC / Operator | ✅ | ❌ deprecated |
| RSRP / RSRQ / Cell ID | ✅ | ❌ private API |
| Neighbouring cells | ✅ | ❌ private API |
| 5G NSA/SA | ✅ | ❌ no public API |
| VoLTE / VoNR | ✅ | ❌ no public API |
| Background guaranteed | ✅ WorkManager | ⚠️ BGAppRefresh |
| MOS G.107 + QoS scores | ✅ | ✅ |

## Changelog

### v1.0.15
- Fix: bump ios-network-metrics-sdk to v1.0.10 — remove all `withTaskGroup` in measurements + `os_log` debug at each step.

### v1.0.14
- Fix: bump ios-network-metrics-sdk to v1.0.9 — `CLLocationManager` main thread crash + `DispatchSemaphore` blocking Swift cooperative thread pool.

### v1.0.13
- Fix: bump ios-network-metrics-sdk to v1.0.8 — Swift runtime `async let` heap corruption (swift#75501). Sequential `await` + `Task.detached`.

### v1.0.12
- Fix: bump ios-network-metrics-sdk to v1.0.7 — `DispatchQueue.main.sync` deadlock on main thread replaced with `MainActor.run`.

### v1.0.11
- Fix: bump ios-network-metrics-sdk to v1.0.6 (CI workflow fix + all UIDevice main thread fixes)

### v1.0.10
- Fix: bump ios-network-metrics-sdk to v1.0.3 (SIGABRT crash fix — `UIDevice.identifierForVendor` moved to `MainActor.run` in `runCycle`)

### v1.0.9
- Fix: bump ios-network-metrics-sdk to v1.0.2 (SIGABRT crash fix on `measureNow()` — UIDevice battery access on main thread)

### v1.0.8
- Fix: bump ios-network-metrics-sdk to v1.0.1 (BGTaskScheduler crash fix)
- iOS: `AppDelegate` must call `NetworkMetricsSdk.shared.registerForBackgroundTask()` in `didFinishLaunching` — see iOS Setup in README

### v1.0.7
- Feat: add `speedDownloadDurationMs`, `speedUploadDurationMs`, `speedThreadCount` to `initialize()` API
- Fix: pass all speed tuning params through to Android Builder and iOS Config

### v1.0.6
- Fix: Android `intervalMinutes` → `intervalMs` conversion (Builder API mismatch)
- Fix: Android `initialize()` → `init()` + `start()` (correct SDK API)

### v1.0.5
- Fix: Android SDK dependency bumped to v1.0.13

### v1.0.4
- Fix: Android SDK dependency bumped to v1.0.13 (fixes VoLTE/VoNR reflection compilation)

### v1.0.3
- Fix: add root `Package.swift` for Capacitor SPM auto-detection on iOS

### v1.0.2
- Fix: tsconfig ES2022 + moduleResolution bundler (fixes dynamic import error in CI)
- Build script: remove docgen dependency
- Add CI + release GitHub Actions workflows (npm publish on tag)

### v1.0.1
- Fix: TypeScript build configuration

### v1.0.0
- Initial release — Android + iOS
- Full API: `initialize`, `measureNow`, `getLastResult`
- Android: delegates to android-network-metrics-sdk v1.0.12
- iOS: delegates to ios-network-metrics-sdk v1.0.0
