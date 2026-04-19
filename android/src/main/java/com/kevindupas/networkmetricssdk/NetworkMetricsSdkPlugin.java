package com.kevindupas.networkmetricssdk;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kevindupas.networkmetrics.core.MeasurementProgress;
import com.kevindupas.networkmetrics.core.NetworkMetricsConfig;
import com.kevindupas.networkmetrics.core.NetworkMetricsSdk;
import com.kevindupas.networkmetrics.core.ProgressCallback;
import com.kevindupas.networkmetrics.core.RadioSnapshot;
import com.kevindupas.networkmetrics.model.DeviceResult;
import com.kevindupas.networkmetrics.model.RadioResult;
import com.kevindupas.networkmetrics.model.SpeedResult;

@CapacitorPlugin(name = "NetworkMetricsSdk")
public class NetworkMetricsSdkPlugin extends Plugin {

    @PluginMethod
    public void initialize(PluginCall call) {
        String backendUrl = call.getString("backendUrl");
        if (backendUrl == null) { call.reject("backendUrl required"); return; }

        int intervalMinutes = call.getInt("intervalMinutes", 15);
        NetworkMetricsConfig config = NetworkMetricsConfig.builder(backendUrl)
            .authHeader(call.getString("authHeader"))
            .intervalMs((long) intervalMinutes * 60_000L)
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
            .streamingUrl(call.getString("streamingUrl"))
            .speedDownloadDurationMs(call.getLong("speedDownloadDurationMs", 8000L))
            .speedUploadDurationMs(call.getLong("speedUploadDurationMs", 6000L))
            .speedThreadCount(call.getInt("speedThreadCount", 3))
            .build();

        NetworkMetricsSdk.INSTANCE.init(getContext(), config);
        NetworkMetricsSdk.INSTANCE.start(getContext());
        call.resolve();
    }

    @PluginMethod
    public void measureNow(PluginCall call) {
        boolean skipSpeed = Boolean.TRUE.equals(call.getBoolean("skipSpeed", false));
        NetworkMetricsSdk.INSTANCE.measureNow(getContext(), progress -> {
            JSObject data = new JSObject();
            String phaseName = progress.getPhase().name();
            data.put("phase", phaseName);
            Object result = progress.getResult();
            if (("SPEED_DOWNLOAD_PROGRESS".equals(phaseName) || "SPEED_UPLOAD_PROGRESS".equals(phaseName))
                    && result instanceof Number) {
                data.put("mbps", ((Number) result).doubleValue());
            } else if ("SPEED".equals(phaseName) && result instanceof SpeedResult) {
                SpeedResult s = (SpeedResult) result;
                data.put("downloadMbps", s.getDownloadMbps());
                data.put("uploadMbps", s.getUploadMbps());
                data.put("latencyMs", s.getLatencyMs());
                data.put("jitterMs", s.getJitterMs());
                if (s.getLoadedLatencyMs() != null) data.put("loadedLatencyMs", s.getLoadedLatencyMs());
                if (s.getServerName() != null)     data.put("serverName", s.getServerName());
                if (s.getServerLocation() != null) data.put("serverLocation", s.getServerLocation());
            }
            notifyListeners("measurementProgress", data);
        }, skipSpeed);
        call.resolve();
    }

    @PluginMethod
    public void getRadioSnapshot(PluginCall call) {
        RadioSnapshot snapshot = NetworkMetricsSdk.INSTANCE.getRadioSnapshot(getContext());
        JSObject ret = new JSObject();

        RadioResult radio = snapshot.getRadio();
        if (radio != null) {
            JSObject r = new JSObject();
            r.put("rsrp", radio.getRsrp());
            r.put("rsrq", radio.getRsrq());
            r.put("sinr", radio.getSinr());
            r.put("rssi", radio.getRssi());
            r.put("cqi", radio.getCqi());
            r.put("ci", radio.getCi());
            r.put("pci", radio.getPci());
            r.put("tac", radio.getTac());
            r.put("earfcn", radio.getEarfcn());
            r.put("isVoLteAvailable", radio.isVoLteAvailable());
            r.put("isNrAvailable", radio.isNrAvailable());
            r.put("networkGeneration", radio.getNetworkGeneration());
            r.put("signalStrengthLevel", radio.getSignalStrengthLevel());
            r.put("technology", radio.getTechnology());
            ret.put("radio", r);
        }

        DeviceResult device = snapshot.getDevice();
        if (device != null) {
            JSObject d = new JSObject();
            d.put("simOperatorName", device.getSimOperatorName());
            d.put("mcc", device.getMcc());
            d.put("mnc", device.getMnc());
            d.put("batteryLevel", device.getBatteryLevel());
            d.put("isCharging", device.isCharging());
            ret.put("device", d);
        }

        call.resolve(ret);
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
