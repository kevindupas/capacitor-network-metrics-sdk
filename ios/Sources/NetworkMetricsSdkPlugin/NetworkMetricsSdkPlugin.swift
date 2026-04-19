import Foundation
import Capacitor
import NetworkMetricsSDK

@objc(NetworkMetricsSdkPlugin)
public class NetworkMetricsSdkPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier  = "NetworkMetricsSdkPlugin"
    public let jsName      = "NetworkMetricsSdk"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "initialize",    returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "measureNow",    returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getLastResult", returnType: CAPPluginReturnPromise),
    ]

    @objc func initialize(_ call: CAPPluginCall) {
        guard let backendUrl = call.getString("backendUrl") else {
            call.reject("backendUrl required")
            return
        }
        let config = NetworkMetricsConfig(
            backendUrl:             backendUrl,
            authHeader:             call.getString("authHeader"),
            intervalMinutes:        call.getInt("intervalMinutes")    ?? 15,
            enableSpeed:            call.getBool("enableSpeed")        ?? true,
            enablePacketLoss:       call.getBool("enablePacketLoss")   ?? true,
            enableStreaming:        call.getBool("enableStreaming")     ?? true,
            enableSocialLatency:    call.getBool("enableSocialLatency") ?? true,
            enableDns:              call.getBool("enableDns")           ?? true,
            enableWebBrowsing:      call.getBool("enableWebBrowsing")   ?? true,
            udpHost:                call.getString("udpHost")           ?? "",
            udpPort:                call.getInt("udpPort")              ?? 5005,
            tcpPort:                call.getInt("tcpPort")              ?? 5006,
            remoteConfigUrl:        call.getString("remoteConfigUrl")
        )
        NetworkMetricsSdk.shared.initialize(config: config)
        call.resolve()
    }

    @objc func measureNow(_ call: CAPPluginCall) {
        NetworkMetricsSdk.shared.measureNow()
        call.resolve()
    }

    @objc func getLastResult(_ call: CAPPluginCall) {
        let json = NetworkMetricsSdk.shared.getLastResult()
        let ts   = NetworkMetricsSdk.shared.getLastResultTimestamp()
        call.resolve(["json": json as Any, "timestamp": ts])
    }
}
