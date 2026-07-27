import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, View, StyleSheet, Text, useWindowDimensions } from "react-native";
import WebView from "react-native-webview";
import { RadarTarget } from "../interfaces/RadarTarget";

const RadarMapWebView = WebView as unknown as React.ComponentType<any>;

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

const getTargetTone = (signalStrength: number, estimatedDistance: number) => {
    if (signalStrength >= 80 || estimatedDistance <= 5) {
        return { dot: "#EF4444", pulse: "rgba(239,68,68,0.30)" };
    }
    if (signalStrength >= 60 || estimatedDistance <= 15) {
        return { dot: "#FBBF24", pulse: "rgba(251,191,36,0.26)" };
    }
    return { dot: "#34D399", pulse: "rgba(52,211,153,0.22)" };
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
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const mapRef = useRef<WebView>(null);
    const { width, height } = useWindowDimensions();
    const radarSize = Math.max(280, Math.min(width - 18, height * 0.58, 430));
    const center = radarSize / 2;
    const maxRadius = radarSize * 0.43;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 900,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 0,
                    duration: 900,
                    useNativeDriver: true
                })
            ])
        ).start();
    }, [pulseAnim]);

    const pulseScale = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1.4]
    });

    const pulseOpacity = pulseAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.24, 0.05]
    });

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
html, body, #map { height: 100%; width: 100%; padding: 0; margin: 0; background: #0f172a; }
.leaflet-control-container { display: none; }
.marker, .destination {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #22c55e;
  border: 3px solid rgba(255,255,255,.92);
  box-shadow: 0 0 0 6px rgba(34,197,94,.20);
}
.destination {
  width: 18px;
  height: 18px;
  background: #60a5fa;
  box-shadow: 0 0 0 7px rgba(96,165,250,.22);
}
</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map', { zoomControl: false, attributionControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false }).setView([0, 0], 17);
var tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, crossOrigin: true }).addTo(map);
var marker = null;
var destinationMarker = null;
var polyline = null;
window.updateRadarMap = function(payload) {
  if (!payload || !payload.location) return;
  var center = [payload.location.latitude, payload.location.longitude];
  map.setView(center, 19, { animate: false });
  if (!marker) {
    marker = L.marker(center, { icon: L.divIcon({ className: '', html: '<div class="marker"></div>', iconSize: [22, 22], iconAnchor: [11, 11] }) }).addTo(map);
  } else {
    marker.setLatLng(center);
  }
  var route = payload.route || [];
  var bounds = [center];
  if (route.length > 1) {
    var latLngs = route.map(function(p) { return [p.latitude, p.longitude]; });
    bounds = bounds.concat(latLngs);
    if (!polyline) {
      polyline = L.polyline(latLngs, { color: '#38bdf8', weight: 5, opacity: .92 }).addTo(map);
    } else {
      polyline.setLatLngs(latLngs);
    }
  } else if (polyline) {
    map.removeLayer(polyline);
    polyline = null;
  }
  if (payload.destination) {
    var destination = [payload.destination.latitude, payload.destination.longitude];
    bounds.push(destination);
    if (!destinationMarker) {
      destinationMarker = L.marker(destination, { icon: L.divIcon({ className: '', html: '<div class="destination"></div>', iconSize: [24, 24], iconAnchor: [12, 12] }) }).addTo(map);
    } else {
      destinationMarker.setLatLng(destination);
    }
  } else if (destinationMarker) {
    map.removeLayer(destinationMarker);
    destinationMarker = null;
  }
  if (bounds.length > 1) {
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 19, animate: false });
  }
  setTimeout(function(){ map.invalidateSize(false); }, 80);
}
</script>
</body>
</html>`, []);

    useEffect(() => {
        if (!mapLocation || !mapRef.current) {
            return;
        }

        const payload = JSON.stringify({
            location: mapLocation,
            route: route.length > 0 ? route : [mapLocation],
            destination
        });
        mapRef.current.injectJavaScript(`window.updateRadarMap(${payload}); true;`);
    }, [destination, mapLocation, route]);

    const targetDots = useMemo(
        () => targets.map((target, index) => {
            const distance = Math.min(target.estimatedDistance / 60, 1);
            const heading = (target.heading ?? 0) - normalizedRotation;
            const angle = ((heading + 360) % 360) * Math.PI / 180;
            const radius = distance * maxRadius;
            const x = radius * Math.sin(angle);
            const y = -radius * Math.cos(angle);

            return {
                id: target.id,
                x,
                y,
                active: target.active,
                focused: target.id === focusedTargetId,
                tone: getTargetTone(target.signalStrength, target.estimatedDistance),
                label: target.bluetooth?.name || target.wifi?.ssid || target.name || "OBJ",
                key: `${target.id}-${index}`
            };
        }),
        [targets, normalizedRotation, maxRadius, focusedTargetId]
    );

    return (
        <View style={styles.container}>
            <View style={styles.mapLayer} pointerEvents="none">
                {mapLocation ? (
                    <RadarMapWebView
                        ref={mapRef}
                        originWhitelist={["*"]}
                        source={{ html: mapHtml }}
                        style={styles.map}
                        javaScriptEnabled
                        domStorageEnabled
                        mixedContentMode="always"
                        scrollEnabled={false}
                        showsHorizontalScrollIndicator={false}
                        showsVerticalScrollIndicator={false}
                        onLoadEnd={() => {
                            if (!mapLocation || !mapRef.current) {
                                return;
                            }
                            const payload = JSON.stringify({
                                location: mapLocation,
                                route: route.length > 0 ? route : [mapLocation],
                                destination
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
                <View style={[styles.ring, {
                    width: radarSize * 0.875,
                    height: radarSize * 0.875,
                    borderRadius: radarSize * 0.4375,
                    left: radarSize * 0.0625,
                    top: radarSize * 0.0625,
                    borderColor: "rgba(16, 185, 129, 0.2)"
                }]} />
                <View style={[styles.ring, {
                    width: radarSize * 0.656,
                    height: radarSize * 0.656,
                    borderRadius: radarSize * 0.328,
                    left: radarSize * 0.172,
                    top: radarSize * 0.172,
                    borderColor: "rgba(16, 185, 129, 0.28)"
                }]} />
                <View style={[styles.ring, {
                    width: radarSize * 0.438,
                    height: radarSize * 0.438,
                    borderRadius: radarSize * 0.219,
                    left: radarSize * 0.281,
                    top: radarSize * 0.281,
                    borderColor: "rgba(16, 185, 129, 0.35)"
                }]} />
                <View style={[styles.centerDot, { left: center - 7, top: center - 7 }]} />

                {targetDots.map(dot => (
                    <React.Fragment key={dot.key}>
                        <Animated.View
                            style={[
                                styles.targetPulse,
                                {
                                    left: center + dot.x - 18,
                                    top: center + dot.y - 18,
                                    transform: [{ scale: pulseScale }],
                                    opacity: dot.active ? pulseOpacity : 0.14,
                                    backgroundColor: dot.focused ? "rgba(96,165,250,0.32)" : dot.tone.pulse
                                }
                            ]}
                        />
                        <Pressable
                            style={[
                                styles.targetDot,
                                {
                                    left: center + dot.x - 6,
                                    top: center + dot.y - 6,
                                    backgroundColor: dot.focused ? "#60A5FA" : dot.tone.dot
                                }
                            ]}
                            onPress={() => onPinTarget?.(dot.id)}
                        />
                        <Pressable
                            style={[
                                styles.targetNameBadge,
                                {
                                    left: Math.max(8, Math.min(radarSize - 128, center + dot.x - 58)),
                                    top: Math.max(8, Math.min(radarSize - 28, center + dot.y - 34)),
                                    transform: [{ rotate: `${normalizedRotation}deg` }]
                                }
                            ]}
                            onPress={() => onPinTarget?.(dot.id)}
                        >
                            <Text style={[styles.targetNameText, dot.focused && styles.targetNameTextFocused]} numberOfLines={1}>
                                {dot.focused ? `PIN ${dot.label}` : dot.label}
                            </Text>
                        </Pressable>
                    </React.Fragment>
                ))}
            </View>
            <Text style={styles.label}>{location ? "RADAR + MAPA GPS" : "RADAR + MAPA OSM"}</Text>
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
        opacity: 0.62,
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
        backgroundColor: "rgba(15, 23, 42, 0.44)",
        borderWidth: 2,
        borderColor: "#0F766E",
        overflow: "hidden"
    },
    ring: {
        position: "absolute",
        borderWidth: 1
    },
    targetPulse: {
        position: "absolute",
        width: 36,
        height: 36,
        borderRadius: 18
    },
    centerDot: {
        position: "absolute",
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: "#34D399",
        borderWidth: 2,
        borderColor: "rgba(255, 255, 255, 0.4)"
    },
    targetDot: {
        position: "absolute",
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#0F172A"
    },
    targetNameBadge: {
        position: "absolute",
        width: 120,
        minHeight: 22,
        borderRadius: 6,
        backgroundColor: "rgba(15, 23, 42, 0.82)",
        borderWidth: 1,
        borderColor: "rgba(148, 163, 184, 0.32)",
        paddingHorizontal: 6,
        justifyContent: "center"
    },
    targetNameText: {
        color: "#E5E7EB",
        fontSize: 10,
        fontWeight: "800",
        textAlign: "center"
    },
    targetNameTextFocused: {
        color: "#BFDBFE"
    },
    label: {
        marginTop: 6,
        color: "#A7F3D0",
        fontWeight: "700",
        fontSize: 13
    }
});
