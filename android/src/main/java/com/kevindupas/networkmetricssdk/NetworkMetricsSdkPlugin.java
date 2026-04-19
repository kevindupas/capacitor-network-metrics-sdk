package com.kevindupas.networkmetricssdk;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kevindupas.networkmetrics.core.NetworkMetricsConfig;
import com.kevindupas.networkmetrics.core.NetworkMetricsSdk;

@CapacitorPlugin(name = "NetworkMetricsSdk")
public class NetworkMetricsSdkPlugin extends Plugin {

    @PluginMethod
    public void initialize(PluginCall call) {
        String backendUrl = call.getString("backendUrl");
        if (backendUrl == null) { call.reject("backendUrl required"); return; }

        NetworkMetricsConfig config = NetworkMetricsConfig.builder(backendUrl)
            .authHeader(call.getString("authHeader"))
            .intervalMinutes(call.getInt("intervalMinutes", 15))
            .enableSpeed(Boolean.TRUE.equals(call.getBoolean("enableSpeed", true)))
            .enablePacketLoss(Boolean.TRUE.equals(call.getBoolean("enablePacketLoss", true)))
            .enableStreaming(Boolean.TRUE.equals(call.getBoolean("enableStreaming", true)))
            .enableSocialLatency(Boolean.TRUE.equals(call.getBoolean("enableSocialLatency", true)))
            .enableDns(Boolean.TRUE.equals(call.getBoolean("enableDns", true)))
            .enableWebBrowsing(Boolean.TRUE.equals(call.getBoolean("enableWebBrowsing", true)))
            .udpHost(call.getString("udpHost", ""))
            .udpPort(call.getInt("udpPort", 5005))
            .tcpPort(call.getInt("tcpPort", 5006))
            .remoteConfigUrl(call.getString("remoteConfigUrl"))
            .build();

        NetworkMetricsSdk.INSTANCE.initialize(getContext(), config);
        call.resolve();
    }

    @PluginMethod
    public void measureNow(PluginCall call) {
        NetworkMetricsSdk.INSTANCE.measureNow(getContext());
        call.resolve();
    }

    @PluginMethod
    public void getLastResult(PluginCall call) {
        String json = NetworkMetricsSdk.INSTANCE.getLastResult(getContext());
        long ts     = NetworkMetricsSdk.INSTANCE.getLastResultTimestamp(getContext());
        JSObject ret = new JSObject();
        ret.put("json", json);
        ret.put("timestamp", ts);
        call.resolve(ret);
    }
}
