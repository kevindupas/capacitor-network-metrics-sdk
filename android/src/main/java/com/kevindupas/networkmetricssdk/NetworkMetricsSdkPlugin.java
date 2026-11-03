package com.kevindupas.networkmetricssdk;

import com.getcapacitor.JSObject;
import com.kevindupas.networkmetrics.model.GnssSatellite;
import com.kevindupas.networkmetrics.model.GnssSnapshot;
import com.kevindupas.networkmetrics.model.NeighborCell;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.kevindupas.networkmetrics.core.MeasurementFailure;
import com.kevindupas.networkmetrics.core.MeasurementProgress;
import com.kevindupas.networkmetrics.core.NetworkMetricsConfig;
import com.kevindupas.networkmetrics.core.NetworkMetricsSdk;
import com.kevindupas.networkmetrics.core.PostOutcome;
import com.kevindupas.networkmetrics.core.RadioSnapshot;
import com.kevindupas.networkmetrics.model.DeviceResult;
import com.kevindupas.networkmetrics.model.RadioPerSimResult;
import com.kevindupas.networkmetrics.model.RadioResult;
import com.kevindupas.networkmetrics.model.SpeedResult;

import org.json.JSONArray;
import org.json.JSONObject;

import java.util.List;

@CapacitorPlugin(name = "NetworkMetricsSdk")
public class NetworkMetricsSdkPlugin extends Plugin {

    /**
     * Capacitor's getLong returns the default for an Integer, which is what a JS number under
     * 2^31 parses to, so durations were silently ignored.
     */
    private static long longOption(PluginCall call, String name, long fallback) {
        Object value = call.getData().opt(name);
        return value instanceof Number ? ((Number) value).longValue() : fallback;
    }

    /** JSONObject.put(name, null) removes the key, and the definitions promise null. */
    private static void putN(JSObject target, String name, Object value) {
        target.put(name, value == null ? JSONObject.NULL : value);
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        try {
            String backendUrl = call.getString("backendUrl");
            if (backendUrl == null) { call.reject("backendUrl required"); return; }

            // Periodic work runs a full speed test: only on explicit request.
            boolean periodic = call.getData().opt("intervalMinutes") instanceof Number;
            NetworkMetricsConfig.Builder builder = NetworkMetricsConfig.builder(backendUrl)
                .authHeader(call.getString("authHeader"))
                .enableSpeed(Boolean.TRUE.equals(call.getBoolean("enableSpeed", true)))
                .enablePacketLoss(Boolean.TRUE.equals(call.getBoolean("enablePacketLoss", true)))
                .enableStreaming(Boolean.TRUE.equals(call.getBoolean("enableStreaming", true)))
                .enableSocialLatency(Boolean.TRUE.equals(call.getBoolean("enableSocialLatency", true)))
                .enableDns(Boolean.TRUE.equals(call.getBoolean("enableDns", true)))
                .enableWebBrowsing(Boolean.TRUE.equals(call.getBoolean("enableWebBrowsing", true)))
                .udpHost(call.getString("udpHost", ""))
                .udpPort(call.getInt("udpPort", 5005))
                .tcpPort(call.getInt("tcpPort", 8230))
                .remoteConfigUrl(call.getString("remoteConfigUrl"))
                .streamingUrl(call.getString("streamingUrl"))
                .speedDownloadDurationMs(longOption(call, "speedDownloadDurationMs", 8000L))
                .speedUploadDurationMs(longOption(call, "speedUploadDurationMs", 6000L))
                .speedThreadCount(call.getInt("speedThreadCount", 3))
                .speedTestBaseUrl(call.getString("speedTestBaseUrl", "https://speed.cloudflare.com"));
            if (periodic) builder.intervalMs(longOption(call, "intervalMinutes", 15L) * 60_000L);

            NetworkMetricsSdk.INSTANCE.init(getContext(), builder.build());
            if (periodic) {
                NetworkMetricsSdk.INSTANCE.start(getContext());
            } else {
                // WorkManager persists: earlier versions left a 15-minute job scheduled on every install.
                NetworkMetricsSdk.INSTANCE.cancelPeriodic(getContext());
            }
            call.resolve();
        } catch (Throwable t) {
            call.reject("initialize failed: " + t);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            NetworkMetricsSdk.INSTANCE.stop(getContext());
            call.resolve();
        } catch (Throwable t) {
            call.reject("stop failed: " + t);
        }
    }

    @PluginMethod
    public void measureNow(PluginCall call) {
        if (!NetworkMetricsSdk.INSTANCE.isInitialised()) {
            call.reject("initialize() must be called before measureNow()");
            return;
        }
        try {
            boolean skipSpeed = Boolean.TRUE.equals(call.getBoolean("skipSpeed", false));
            String testId = NetworkMetricsSdk.INSTANCE.measureNow(getContext(), this::emitProgress, skipSpeed);
            JSObject ret = new JSObject();
            ret.put("testId", testId);
            call.resolve(ret);
        } catch (Throwable t) {
            call.reject("measureNow failed: " + t);
        }
    }

    private void emitProgress(MeasurementProgress progress) {
        JSObject data = new JSObject();
        String phaseName = progress.getPhase().name();
        data.put("phase", phaseName);
        data.put("testId", progress.getTestId());
        Object result = progress.getResult();
        if (("SPEED_DOWNLOAD_PROGRESS".equals(phaseName) || "SPEED_UPLOAD_PROGRESS".equals(phaseName))
                && result instanceof Number) {
            data.put("mbps", ((Number) result).doubleValue());
        } else if (result instanceof SpeedResult) {
            SpeedResult s = (SpeedResult) result;
            putN(data, "downloadMbps", s.getDownloadMbps());
            putN(data, "uploadMbps", s.getUploadMbps());
            putN(data, "latencyMs", s.getLatencyMs());
            putN(data, "jitterMs", s.getJitterMs());
            if (s.getLoadedLatencyMs() != null) data.put("loadedLatencyMs", s.getLoadedLatencyMs());
            if (s.getServerName() != null)     data.put("serverName", s.getServerName());
            if (s.getServerLocation() != null) data.put("serverLocation", s.getServerLocation());
        } else if (result instanceof MeasurementFailure) {
            MeasurementFailure f = (MeasurementFailure) result;
            data.put("error", f.getCode());
            if (f.getMessage() != null) data.put("message", f.getMessage());
        } else if (result instanceof PostOutcome) {
            PostOutcome p = (PostOutcome) result;
            data.put("posted", p.getPosted());
            if (p.getHttpStatus() != null) data.put("httpStatus", p.getHttpStatus());
            if (p.getError() != null) data.put("message", p.getError());
        }
        notifyListeners("measurementProgress", data);
    }

    @PluginMethod
    public void getRadioSnapshot(PluginCall call) {
        try {
            RadioSnapshot snapshot = NetworkMetricsSdk.INSTANCE.getRadioSnapshot(getContext());
            JSObject ret = new JSObject();

            RadioResult radio = snapshot.getRadio();
            putN(ret, "radio", radio != null ? radioToJSObject(radio) : null);

            JSONArray perSimArr = new JSONArray();
            for (RadioPerSimResult ps : snapshot.getRadioPerSim()) {
                JSObject s = new JSObject();
                s.put("subscriptionId", ps.getSubscriptionId());
                s.put("slotIndex", ps.getSlotIndex());
                putN(s, "carrierName", ps.getCarrierName());
                putN(s, "mcc", ps.getMcc());
                putN(s, "mnc", ps.getMnc());
                s.put("isDefaultData", ps.isDefaultData());
                putN(s, "radio", ps.getRadio() != null ? radioToJSObject(ps.getRadio()) : null);
                perSimArr.put(s);
            }
            ret.put("radioPerSim", perSimArr);

            DeviceResult device = snapshot.getDevice();
            if (device != null) {
                JSObject d = new JSObject();
                putN(d, "simOperatorName", device.getSimOperatorName());
                putN(d, "mcc", device.getMcc());
                putN(d, "mnc", device.getMnc());
                putN(d, "batteryLevel", device.getBatteryLevel());
                putN(d, "isCharging", device.isCharging());
                ret.put("device", d);
            } else {
                ret.put("device", JSONObject.NULL);
            }

            call.resolve(ret);
        } catch (Throwable t) {
            call.reject("getRadioSnapshot failed: " + t);
        }
    }

    private static JSObject radioToJSObject(RadioResult radio) {
        JSObject r = new JSObject();
        putN(r, "rsrp", radio.getRsrp());
        putN(r, "rsrq", radio.getRsrq());
        putN(r, "sinr", radio.getSinr());
        putN(r, "rssi", radio.getRssi());
        putN(r, "rscp", radio.getRscp());
        putN(r, "cqi", radio.getCqi());
        putN(r, "ci", radio.getCi());
        putN(r, "pci", radio.getPci());
        putN(r, "tac", radio.getTac());
        putN(r, "lac", radio.getLac());
        putN(r, "earfcn", radio.getEarfcn());
        putN(r, "bandwidth", radio.getBandwidth());
        putN(r, "psc", radio.getPsc());
        putN(r, "timingAdvance", radio.getTimingAdvance());
        putN(r, "cellAgeMs", radio.getCellAgeMs());
        r.put("isVoLteAvailable", radio.isVoLteAvailable());
        r.put("isVoNrAvailable", radio.isVoNrAvailable());
        r.put("isNrAvailable", radio.isNrAvailable());
        r.put("isRoaming", radio.isRoaming());
        putN(r, "nrMode", radio.getNrMode());
        putN(r, "nrRsrp", radio.getNrRsrp());
        putN(r, "nrRsrq", radio.getNrRsrq());
        putN(r, "nrSinr", radio.getNrSinr());
        r.put("networkGeneration", radio.getNetworkGeneration());
        r.put("signalStrengthLevel", radio.getSignalStrengthLevel());
        r.put("technology", radio.getTechnology());
        return r;
    }

    @PluginMethod
    public void getGnssSatellites(PluginCall call) {
        GnssSnapshot snap;
        try {
            snap = NetworkMetricsSdk.INSTANCE.getGnssSatellites(getContext());
        } catch (Throwable t) {
            call.reject("getGnssSatellites failed: " + t);
            return;
        }
        JSObject ret = new JSObject();
        JSONArray arr = new JSONArray();
        for (GnssSatellite s : snap.getSatellites()) {
            JSObject o = new JSObject();
            o.put("svid", s.getSvid());
            o.put("constellation", s.getConstellation());
            o.put("azimuth", s.getAzimuth());
            o.put("elevation", s.getElevation());
            o.put("cn0DbHz", s.getCn0DbHz());
            o.put("usedInFix", s.getUsedInFix());
            arr.put(o);
        }
        ret.put("satellites", arr);
        ret.put("inView", snap.getInView());
        ret.put("usedInFix", snap.getUsedInFix());
        ret.put("avgCn0DbHz", snap.getAvgCn0DbHz());
        call.resolve(ret);
    }

    @PluginMethod
    public void stopGnssSatellites(PluginCall call) {
        try {
            NetworkMetricsSdk.INSTANCE.releaseGnss(getContext());
            call.resolve();
        } catch (Throwable t) {
            call.reject("stopGnssSatellites failed: " + t);
        }
    }

    @PluginMethod
    public void getNeighborCells(PluginCall call) {
        List<NeighborCell> cells;
        try {
            cells = NetworkMetricsSdk.INSTANCE.getNeighborCells(getContext());
        } catch (Throwable t) {
            call.reject("getNeighborCells failed: " + t);
            return;
        }
        JSObject ret = new JSObject();
        JSONArray arr = new JSONArray();
        for (NeighborCell c : cells) {
            JSObject o = new JSObject();
            o.put("technology",     c.getTechnology());
            o.put("isRegistered",   c.isRegistered());
            o.put("mcc",            c.getMcc());
            o.put("mnc",            c.getMnc());
            o.put("tac",            c.getTac());
            o.put("ci",             c.getCi());
            o.put("nci",            c.getNci());
            o.put("pci",            c.getPci());
            o.put("psc",            c.getPsc());
            o.put("arfcn",          c.getArfcn());
            o.put("rsrp",           c.getRsrp());
            o.put("rsrq",           c.getRsrq());
            o.put("sinr",           c.getSinr());
            o.put("asuLevel",       c.getAsuLevel());
            o.put("dbm",            c.getDbm());
            o.put("timestampNanos", c.getTimestampNanos());
            o.put("cellAgeMs",      c.getCellAgeMs());
            arr.put(o);
        }
        ret.put("cells", arr);
        ret.put("count", cells.size());
        call.resolve(ret);
    }

    @PluginMethod
    public void getLastResult(PluginCall call) {
        String json = NetworkMetricsSdk.INSTANCE.getLastResult(getContext());
        long ts     = NetworkMetricsSdk.INSTANCE.getLastResultTimestamp(getContext());
        JSObject ret = new JSObject();
        ret.put("json", json);
        ret.put("timestamp", ts);
        putN(ret, "posted", NetworkMetricsSdk.INSTANCE.getLastResultPosted(getContext()));
        call.resolve(ret);
    }
}
