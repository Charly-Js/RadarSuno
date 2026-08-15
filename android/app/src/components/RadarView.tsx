import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Text, useWindowDimensions } from "react-native";
import WebView from "react-native-webview";
import { RadarTarget } from "../interfaces/RadarTarget";

const RadarMapWebView = WebView as unknown as React.ComponentType<any>;
const RADAR_DISPLAY_RANGE_METERS = 20;
const MAX_VISIBLE_TARGETS = 12;

interface RadarViewProps {
    targets?: RadarTarget[];
    rotation?: number;
    location?: {
        latitude: number;
        longitude: number;
    } | null;
    route?: Array<{
        latitude: number;
        longitude: number;
    }>;
    destination?: {
        latitude: number;
        longitude: number;
    } | null;
    focusedTargetId?: string | null;
    onPinTarget?: (id: string) => void;
}

const hashTarget = (value: string) =>
    value.split("").reduce((hash, char) => {
        return (hash * 31 + char.charCodeAt(0)) % 360;
    }, 0);

const getFrequencyBearing = (target: RadarTarget) => {
    const frequency = target.wifi?.frequency;
    if (!frequency) {
        return hashTarget(target.id);
    }

    const channelSeed = frequency >= 5000
        ? (frequency - 5000) * 1.7
        : (frequency - 2400) * 4.2;
    return (channelSeed + hashTarget(target.id) * 0.28) % 360;
};

const getOperationalBearing = (target: RadarTarget, index: number) => {
    const observed = typeof target.heading === "number"
        ? target.heading
        : getFrequencyBearing(target);
    const frequencySpread = getFrequencyBearing(target);
    const separation = ((index % 5) - 2) * 7;

    return ((observed * 0.7 + frequencySpread * 0.3 + separation) % 360 + 360) % 360;
};

const getMapOffset = (
    origin: { latitude: number; longitude: number },
    distanceMeters: number,
    bearingDegrees: number
) => {
    const earthRadius = 6378137;
    const bearing = bearingDegrees * Math.PI / 180;
    const lat1 = origin.latitude * Math.PI / 180;
    const lon1 = origin.longitude * Math.PI / 180;
    const angularDistance = distanceMeters / earthRadius;

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(angularDistance) +
        Math.cos(lat1) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(lat1),
        Math.cos(angularDistance) - Math.sin(lat1) * Math.sin(lat2)
    );

    return {
        latitude: lat2 * 180 / Math.PI,
        longitude: lon2 * 180 / Math.PI
    };
};

const normalizeTargetName = (value?: string | null) =>
    (value ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");

const getTargetDisplayName = (target: RadarTarget) =>
    target.bluetooth?.name ||
    target.wifi?.ssid ||
    target.name ||
    "";

const simplifyTargetName = (target: RadarTarget) => {
    const name = getTargetDisplayName(target)
        .replace(/^BLE\s+/i, "")
        .replace(/^WiFi\s+/i, "")
        .replace(/\s+/g, " ")
        .trim();

    if (!name || name === "Dispositivo desconocido" || name === "WiFi oculto") {
        return "";
    }

    return name.length > 11 ? `${name.slice(0, 10)}…` : name;
};

const getTargetCode = (target: RadarTarget) => {
    const name = simplifyTargetName(target);
    const fallback = target.source.toUpperCase();
    return (name || fallback).replace(/[^a-zA-Z0-9]/g, "").slice(0, 3).toUpperCase();
};

const getSignalTypeLabel = (target: RadarTarget) => {
    if (target.source === "hybrid") return "HIBRIDA";
    if (target.source === "wifi") return "WIFI";
    return "BLE";
};

const getSignalColorName = (target: RadarTarget) => {
    if (target.source === "hybrid") return "hybrid";
    if (target.source === "wifi") return "wifi";
    return "bluetooth";
};

const PERSONAL_DEVICE_KEYWORDS = [
    "iphone",
    "ipad",
    "ios",
    "android",
    "phone",
    "mobile",
    "celular",
    "samsung",
    "galaxy",
    "pixel",
    "xiaomi",
    "redmi",
    "poco",
    "oppo",
    "vivo",
    "oneplus",
    "motorola",
    "moto",
    "nokia",
    "honor",
    "realme",
    "watch",
    "reloj",
    "band",
    "fit",
    "fitbit",
    "amazfit",
    "garmin",
    "wear",
    "buds",
    "airpods",
    "laptop",
    "notebook",
    "macbook",
    "thinkpad",
    "ideapad",
    "vivobook",
    "chromebook",
    "surface",
    "dell",
    "lenovo",
    "asus",
    "acer",
    "msi",
    "hp-",
    "hp "
];

const INFRASTRUCTURE_KEYWORDS = [
    "router",
    "modem",
    "wlan",
    "wifioculto",
    "accesspoint",
    "access point",
    "repeater",
    "extender",
    "tplink",
    "tp-link",
    "dlink",
    "d-link",
    "netgear",
    "arris",
    "ubiquiti",
    "mikrotik",
    "mercusys",
    "tenda",
    "cisco",
    "homenetwork",
    "invitado",
    "guest"
];

const isGeneratedName = (name: string) =>
    /^BLE\s+[A-Z0-9]{3,}$/i.test(name) ||
    /^WiFi\s+[A-Z0-9:-]{3,}$/i.test(name) ||
    name === "Dispositivo desconocido" ||
    name === "WiFi oculto";

const isPersonalDeviceTarget = (target: RadarTarget) => {
    const rawName = getTargetDisplayName(target).trim();
    const normalized = normalizeTargetName(rawName);

    if (!rawName || isGeneratedName(rawName)) {
        return false;
    }

    if (INFRASTRUCTURE_KEYWORDS.some(keyword => normalized.includes(normalizeTargetName(keyword)))) {
        return false;
    }

    if (target.bluetooth && !target.wifi) {
        return true;
    }

    return PERSONAL_DEVICE_KEYWORDS.some(keyword =>
        normalized.includes(normalizeTargetName(keyword))
    );
};

const getTargetIdentity = (target: RadarTarget) => {
    const bluetoothName = normalizeTargetName(target.bluetooth?.name);
    const wifiName = normalizeTargetName(target.wifi?.ssid);
    const targetName = normalizeTargetName(target.name);

    if (target.wifi?.bssid) return `wifi:${target.wifi.bssid.toLowerCase()}`;
    if (bluetoothName) return `name:${bluetoothName}`;
    if (wifiName) return `name:${wifiName}`;
    if (targetName) return `name:${targetName}`;
    return `id:${target.id}`;
};

const dedupeTargets = (items: RadarTarget[]) => {
    const byIdentity = new Map<string, RadarTarget>();

    items.forEach(target => {
        const identity = getTargetIdentity(target);
        const previous = byIdentity.get(identity);

        if (
            !previous ||
            target.confidence > previous.confidence ||
            (
                target.confidence === previous.confidence &&
                target.estimatedDistance < previous.estimatedDistance
            )
        ) {
            byIdentity.set(identity, target);
        }
    });

    return Array.from(byIdentity.values());
};

export default function RadarView({
    targets = [],
    rotation = 0,
    location = null,
    route = [],
    destination = null,
    focusedTargetId = null,
    onPinTarget
}: RadarViewProps) {
    const mapRef = useRef<WebView>(null);
    const hideCardTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
    const { width, height } = useWindowDimensions();
    const radarSize = Math.max(280, Math.min(width - 18, height * 0.58, 430));
    const center = radarSize / 2;
    const maxRadius = radarSize * 0.43;

    const normalizedRotation = ((rotation % 360) + 360) % 360;
    const mapLocation = useMemo(
        () => location ?? route[route.length - 1] ?? null,
        [location, route]
    );
    const mapHtml = useMemo(() => `<!doctype html>
<html>
<head>
<meta name="viewport" content="initial-scale=1, maximum-scale=1, user-scalable=no, width=device-width">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>
html, body { height: 100%; width: 100%; padding: 0; margin: 0; background: #1f2937; overflow: hidden; }
#map { height: 100%; width: 100%; padding: 0; margin: 0; background: #1f2937; transform-origin: 50% 50%; will-change: transform; transition: transform 160ms linear; }
.leaflet-control-container { display: none; }
.marker {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #f97316;
  border: 3px solid rgba(255,255,255,.96);
  box-shadow: 0 0 0 8px rgba(249,115,22,.24), 0 0 20px rgba(239,68,68,.65);
  position: relative;
  transform: rotate(var(--map-bearing, 0deg));
}
.marker:before,
.marker:after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  background: #ffffff;
  border-radius: 2px;
  transform: translate(-50%, -50%);
}
.marker:before {
  width: 16px;
  height: 5px;
}
.marker:after {
  width: 5px;
  height: 16px;
}
.destination {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,.92);
  transform: rotate(var(--map-bearing, 0deg));
}
.destination {
  background: #60a5fa;
  box-shadow: 0 0 0 7px rgba(96,165,250,.22);
}
.target-dot {
  min-width: 30px;
  max-width: 34px;
  min-height: 24px;
  border-radius: 999px;
  background: #22c55e;
  color: #03130a;
  display: flex;
  align-items: center;
  justify-content: center;
  font: 900 10px system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  line-height: 1;
  overflow: hidden;
  padding: 0 7px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 0 0 6px rgba(34,197,94,.24), 0 0 14px rgba(34,197,94,.58);
  transform: rotate(var(--map-bearing, 0deg));
}
.target-dot.bluetooth {
  background: #38bdf8;
  box-shadow: 0 0 0 6px rgba(56,189,248,.24), 0 0 14px rgba(56,189,248,.58);
}
.target-dot.hybrid {
  background: #fbbf24;
  box-shadow: 0 0 0 6px rgba(251,191,36,.24), 0 0 14px rgba(251,191,36,.58);
}
.target-dot.wifi {
  background: #22c55e;
}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, fadeAnimation: false, zoomAnimation: false, markerZoomAnimation: false }).setView([0, 0], 19);
var tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { minZoom: 19, maxZoom: 19, crossOrigin: true, updateWhenIdle: true, keepBuffer: 4 }).addTo(map);
var marker = null;
var destinationMarker = null;
var targetRanges = {};
var polyline = null;
var lastBearing = 0;
var didInvalidate = false;
function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
function createTargetIcon(displayName, signalType) {
  var className = 'target-dot ' + (signalType || 'wifi');
  return L.divIcon({
    className: '',
    html: '<div class="' + className + '">' + escapeHtml(displayName) + '</div>',
    iconSize: [34, 24],
    iconAnchor: [17, 12]
  });
}
window.updateRadarMap = function(payload) {
  if (!payload || !payload.location) return;
  var center = [payload.location.latitude, payload.location.longitude];
  map.setView(center, 19, { animate: false });
  if (!marker) {
    marker = L.marker(center, {
      icon: L.divIcon({ className: '', html: '<div class="marker"></div>', iconSize: [36, 36], iconAnchor: [18, 18] }),
      zIndexOffset: 10000
    }).addTo(map);
  } else {
    marker.setLatLng(center);
  }
  marker.setZIndexOffset(10000);
  var route = payload.route || [];
  if (route.length > 1) {
    var latLngs = route.map(function(p) { return [p.latitude, p.longitude]; });
    if (!polyline) {
      polyline = L.polyline(latLngs, { color: '#f97316', weight: 5, opacity: .9, dashArray: '8 8' }).addTo(map);
    } else {
      polyline.setLatLngs(latLngs);
      polyline.setStyle({ color: '#f97316', weight: 5, opacity: .9, dashArray: '8 8' });
    }
  } else if (polyline) {
    map.removeLayer(polyline);
    polyline = null;
  }
  if (payload.destination) {
    var destination = [payload.destination.latitude, payload.destination.longitude];
    if (!destinationMarker) {
      destinationMarker = L.marker(destination, { icon: L.divIcon({ className: '', html: '<div class="destination"></div>', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map);
    } else {
      destinationMarker.setLatLng(destination);
    }
  } else if (destinationMarker) {
    map.removeLayer(destinationMarker);
    destinationMarker = null;
  }
  var seenTargets = {};
  (payload.targets || []).forEach(function(target) {
    if (!target || !target.id) return;
    if (typeof target.latitude !== 'number' || typeof target.longitude !== 'number') return;
    seenTargets[target.id] = true;
    var targetCenter = [target.latitude, target.longitude];
    var displayName = target.displayName || '';
    if (!displayName) return;
    if (!targetRanges[target.id]) {
      targetRanges[target.id] = L.marker(targetCenter, {
        icon: createTargetIcon(displayName, target.signalType)
      }).addTo(map);
      targetRanges[target.id].on('click', function() {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'targetPress', id: target.id }));
      });
    } else {
      targetRanges[target.id].setLatLng(targetCenter);
      targetRanges[target.id].setIcon(createTargetIcon(displayName, target.signalType));
    }
  });
  Object.keys(targetRanges).forEach(function(id) {
    if (!seenTargets[id]) {
      map.removeLayer(targetRanges[id]);
      delete targetRanges[id];
    }
  });
  if (marker) marker.setZIndexOffset(10000);
  if (!didInvalidate) {
    didInvalidate = true;
    setTimeout(function(){ map.invalidateSize(false); }, 80);
  }
}
window.setMapBearing = function(bearing) {
  if (typeof bearing !== 'number' || isNaN(bearing)) return;
  var b = ((bearing % 360) + 360) % 360;
  if (Math.abs(b - lastBearing) < 0.5) return;
  lastBearing = b;
  var mapNode = document.getElementById('map');
  if (mapNode) {
    mapNode.style.transform = 'scale(2.05) rotate(' + (-b) + 'deg)';
  }
  document.documentElement.style.setProperty('--map-bearing', b + 'deg');
};
</script>
</body>
</html>`, []);
    const mapSource = useMemo(() => ({ html: mapHtml }), [mapHtml]);
    const visibleTargets = useMemo(
        () => dedupeTargets(
            targets.filter(target =>
                target.active &&
                target.estimatedDistance <= RADAR_DISPLAY_RANGE_METERS &&
                target.confidence >= 35 &&
                isPersonalDeviceTarget(target)
            )
        )
            .sort((a, b) => {
                const focusedDelta =
                    Number(b.id === focusedTargetId) - Number(a.id === focusedTargetId);
                if (focusedDelta !== 0) return focusedDelta;

                const distanceDelta = a.estimatedDistance - b.estimatedDistance;
                if (Math.abs(distanceDelta) > 0.2) return distanceDelta;

                return b.confidence - a.confidence;
            })
            .slice(0, MAX_VISIBLE_TARGETS),
        [focusedTargetId, targets]
    );
    const trackedTargets = useMemo(
        () => focusedTargetId
            ? visibleTargets.filter(target => target.id === focusedTargetId)
            : visibleTargets,
        [focusedTargetId, visibleTargets]
    );
    const selectedTarget = useMemo(
        () => visibleTargets.find(target => target.id === selectedTargetId) ?? null,
        [selectedTargetId, visibleTargets]
    );
    const mapTargets = useMemo(
        () => trackedTargets
            .map((target, index) => {
                const bearing = getOperationalBearing(target, index);
                const targetLocation = mapLocation
                    ? getMapOffset(
                        mapLocation,
                        Math.max(1, Math.min(target.estimatedDistance, RADAR_DISPLAY_RANGE_METERS)),
                        bearing
                    )
                    : null;

                return {
                id: target.id,
                displayName: getTargetCode(target),
                signalType: getSignalColorName(target),
                heading: bearing,
                latitude: targetLocation?.latitude ?? null,
                longitude: targetLocation?.longitude ?? null,
                estimatedDistance: Math.min(target.estimatedDistance ?? 0, RADAR_DISPLAY_RANGE_METERS),
                proximity: target.proximity ?? "far"
                };
            }),
        [mapLocation, trackedTargets]
    );

    useEffect(() => {
        if (!mapLocation || !mapRef.current) {
            return;
        }

        const payload = JSON.stringify({
            location: mapLocation,
            route: route.length > 0 ? route : [mapLocation],
            destination,
            targets: mapTargets
        });
        mapRef.current.injectJavaScript(`window.updateRadarMap(${payload}); true;`);
    }, [destination, mapLocation, route, mapTargets]);

    /**
     * Sincroniza la rotación del mapa Leaflet con el heading del operador.
     * Se inyecta en cada cambio de rotación para que el mapa gire junto
     * con la brújula del radar.
     */
    useEffect(() => {
        if (!mapRef.current) return;
        mapRef.current.injectJavaScript(
            `window.setMapBearing(${normalizedRotation}); true;`
        );
    }, [normalizedRotation]);

    useEffect(() => {
        return () => {
            if (hideCardTimer.current) {
                clearTimeout(hideCardTimer.current);
            }
        };
    }, []);

    const showTargetCard = (id: string) => {
        setSelectedTargetId(id);
        onPinTarget?.(id);

        if (hideCardTimer.current) {
            clearTimeout(hideCardTimer.current);
        }
        hideCardTimer.current = setTimeout(() => {
            setSelectedTargetId(null);
            hideCardTimer.current = null;
        }, 5000);
    };

    const handleMapMessage = (event: any) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message?.type === "targetPress" && typeof message.id === "string") {
                showTargetCard(message.id);
            }
        } catch {
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.mapLayer}>
                {mapLocation ? (
                    <RadarMapWebView
                        ref={mapRef}
                        originWhitelist={["*"]}
                        source={mapSource}
                        style={styles.map}
                        javaScriptEnabled
                        domStorageEnabled
                        mixedContentMode="always"
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        onMessage={handleMapMessage}
                        onLoadEnd={() => {
                            if (!mapLocation || !mapRef.current) {
                                return;
                            }
                            const payload = JSON.stringify({
                                location: mapLocation,
                                route: route.length > 0 ? route : [mapLocation],
                                destination,
                                targets: mapTargets
                            });
                            mapRef.current.injectJavaScript(`window.updateRadarMap(${payload}); true;`);
                        }}
                    />
                ) : (
                    <View style={styles.waitingGps}>
                        <Text style={styles.waitingGpsText}>Esperando ubicación GPS real...</Text>
                    </View>
                )}
            </View>
            <View
                pointerEvents="none"
                style={[
                    styles.radarFrame,
                    {
                        width: radarSize,
                        height: radarSize,
                        borderRadius: center,
                        transform: [{ rotate: `${-normalizedRotation}deg` }]
                    }
                ]}
            >
                {/* Flecha de heading: rota con la brújula del operador */}
                <View
                    style={[
                        styles.headingArrow,
                        {
                            left: center - 11,
                            top: center - maxRadius + 4,
                            transform: [{ rotate: `${normalizedRotation}deg` }]
                        }
                    ]}
                >
                    <View style={styles.headingArrowShaft} />
                    <View style={styles.headingArrowTip} />
                </View>
            </View>
            {selectedTarget ? (
                <View
                    style={[
                        styles.targetCard,
                        selectedTarget.source === "bluetooth" && styles.targetCardBluetooth,
                        selectedTarget.source === "hybrid" && styles.targetCardHybrid
                    ]}
                    pointerEvents="none"
                >
                    <View style={styles.targetCardHeader}>
                        <Text style={styles.targetCardCode}>{getTargetCode(selectedTarget)}</Text>
                        <Text style={styles.targetCardType}>{getSignalTypeLabel(selectedTarget)}</Text>
                    </View>
                    <Text style={styles.targetCardName} numberOfLines={1}>
                        {getTargetDisplayName(selectedTarget)}
                    </Text>
                    <Text style={styles.targetCardText}>
                        Distancia {selectedTarget.estimatedDistance.toFixed(1)} m · Señal {selectedTarget.signalStrength}% · Confianza {selectedTarget.confidence}%
                    </Text>
                    <Text style={styles.targetCardText} numberOfLines={1}>
                        ID {selectedTarget.bluetooth?.id || selectedTarget.wifi?.bssid || selectedTarget.id}
                    </Text>
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 4,
        width: "100%",
        overflow: "hidden"
    },
    mapLayer: {
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        opacity: 0.82,
        backgroundColor: "#0F172A"
    },
    map: {
        flex: 1,
        backgroundColor: "#0F172A"
    },
    waitingGps: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    waitingGpsText: {
        color: "#A5B4C3",
        fontSize: 13,
        fontWeight: "700"
    },
    radarFrame: {
        backgroundColor: "transparent",
        borderWidth: 0,
        borderColor: "transparent",
        overflow: "hidden"
    },
    headingArrow: {
        position: "absolute",
        width: 22,
        height: 32,
        alignItems: "center"
    },
    headingArrowShaft: {
        position: "absolute",
        top: 10,
        width: 4,
        height: 22,
        backgroundColor: "#F97316",
        borderRadius: 2
    },
    headingArrowTip: {
        position: "absolute",
        top: 0,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 12,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#F97316"
    },
    targetCard: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 84,
        minHeight: 96,
        borderRadius: 8,
        backgroundColor: "rgba(5, 46, 22, 0.94)",
        borderWidth: 1,
        borderColor: "#22C55E",
        paddingHorizontal: 12,
        paddingVertical: 10
    },
    targetCardBluetooth: {
        backgroundColor: "rgba(7, 47, 73, 0.94)",
        borderColor: "#38BDF8"
    },
    targetCardHybrid: {
        backgroundColor: "rgba(69, 26, 3, 0.94)",
        borderColor: "#FBBF24"
    },
    targetCardHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 4
    },
    targetCardCode: {
        color: "#FFFFFF",
        fontSize: 18,
        fontWeight: "900"
    },
    targetCardType: {
        color: "#FFFFFF",
        fontSize: 11,
        fontWeight: "900"
    },
    targetCardName: {
        color: "#F8FAFC",
        fontSize: 14,
        fontWeight: "800",
        marginBottom: 4
    },
    targetCardText: {
        color: "#D1FAE5",
        fontSize: 12,
        fontWeight: "600",
        marginTop: 2
    }
});
