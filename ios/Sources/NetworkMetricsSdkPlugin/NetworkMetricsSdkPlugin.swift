import Foundation
import Capacitor
import NetworkMetricsSDK

@objc(NetworkMetricsSdkPlugin)
public class NetworkMetricsSdkPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier  = "NetworkMetricsSdkPlugin"
    public let jsName      = "NetworkMetricsSdk"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize",         returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "measureNow",         returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getRadioSnapshot",   returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLastResult",      returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "addListener",        returnType: CAPPluginReturnCallback),
        CAPPluginMethod(name: "removeAllListeners", returnType: CAPPluginReturnNone),
    ]

    public override func load() {
        super.load()
        // Bridge SDK progress callbacks → Capacitor listener events.
        NetworkMetricsSdk.shared.setProgressCallback { [weak self] progress in
            self?.emitProgress(progress)
        }
    }

    @objc func initialize(_ call: CAPPluginCall) {
        guard let backendUrl = call.getString("backendUrl") else {
            call.reject("backendUrl required")
            return
        }
        let config = NetworkMetricsConfig(
            backendUrl:             backendUrl,
            authHeader:             call.getString("authHeader"),
            intervalMinutes:        call.getInt("intervalMinutes")          ?? 15,
            enableSpeed:            call.getBool("enableSpeed")             ?? true,
            enablePacketLoss:       call.getBool("enablePacketLoss")        ?? true,
            enableStreaming:        call.getBool("enableStreaming")         ?? true,
            enableSocialLatency:    call.getBool("enableSocialLatency")     ?? true,
            enableDns:              call.getBool("enableDns")               ?? true,
            enableWebBrowsing:      call.getBool("enableWebBrowsing")       ?? true,
            speedDownloadDurationMs: call.getInt("speedDownloadDurationMs") ?? 8000,
            speedUploadDurationMs:  call.getInt("speedUploadDurationMs")    ?? 6000,
            speedThreadCount:       call.getInt("speedThreadCount")         ?? 3,
            udpHost:                call.getString("udpHost")               ?? "",
            udpPort:                call.getInt("udpPort")                  ?? 5005,
            tcpPort:                call.getInt("tcpPort")                  ?? 5006,
            remoteConfigUrl:        call.getString("remoteConfigUrl"),
            streamingUrl:           call.getString("streamingUrl")
        )
        NetworkMetricsSdk.shared.initialize(config: config)
        call.resolve()
    }

    @objc func measureNow(_ call: CAPPluginCall) {
        let skipSpeed = call.getBool("skipSpeed") ?? false
        NetworkMetricsSdk.shared.measureNow(skipSpeed: skipSpeed)
        call.resolve()
    }

    @objc func getRadioSnapshot(_ call: CAPPluginCall) {
        Task {
            let snapshot = await NetworkMetricsSdk.shared.getRadioSnapshot()
            var ret: [String: Any] = [:]

            let r = snapshot.radio
            ret["radio"] = [
                "rsrp": r.rsrp as Any,
                "rsrq": r.rsrq as Any,
                "sinr": r.sinr as Any,
                "rssi": r.rssi as Any,
                "cqi":  r.cqi  as Any,
                "ci":   r.ci   as Any,
                "pci":  r.pci  as Any,
                "tac":  r.tac  as Any,
                "earfcn": r.earfcn as Any,
                "isVoLteAvailable": r.isVoLteAvailable,
                "isNrAvailable":    r.isNrAvailable,
                "networkGeneration": r.networkGeneration,
                "signalStrengthLevel": r.signalStrengthLevel,
                "technology": r.technology
            ]

            let d = snapshot.device
            ret["device"] = [
                "simOperatorName": d.simOperatorName as Any,
                "mcc":             d.mcc as Any,
                "mnc":             d.mnc as Any,
                "batteryLevel":    d.batteryLevel as Any,
                "isCharging":      d.isCharging as Any
            ]

            call.resolve(ret)
        }
    }

    @objc func getLastResult(_ call: CAPPluginCall) {
        let json = NetworkMetricsSdk.shared.getLastResult()
        let ts   = NetworkMetricsSdk.shared.getLastResultTimestamp()
        call.resolve(["json": json as Any, "timestamp": ts])
    }

    private func emitProgress(_ progress: MeasurementProgress) {
        var data: [String: Any] = ["phase": progress.phase.rawValue]

        switch progress.phase {
        case .speedDownloadProgress, .speedUploadProgress:
            if let mbps = progress.result as? Double {
                data["mbps"] = mbps
            }
        case .speed:
            if let s = progress.result as? SpeedResult {
                data["downloadMbps"] = s.downloadMbps
                data["uploadMbps"]   = s.uploadMbps
                data["latencyMs"]    = s.latencyMs
                data["jitterMs"]     = s.jitterMs
                if let l = s.loadedLatencyMs { data["loadedLatencyMs"] = l }
                if let n = s.serverName      { data["serverName"]     = n }
                if let loc = s.serverLocation { data["serverLocation"] = loc }
            }
        default:
            break
        }

        notifyListeners("measurementProgress", data: data)
    }
}
