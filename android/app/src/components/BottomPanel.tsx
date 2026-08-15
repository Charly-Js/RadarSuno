import React from "react";

import {
    View,
    StyleSheet
} from "react-native";

import RadarCard from "./RadarCard";
import { RadarTarget } from "../interfaces/RadarTarget";

interface BottomPanelProps {
    targetCount?: number;
    nearestTarget?: RadarTarget | null;
}

const formatDistance = (meters: number): string => {
    if (meters < 1) {
        return `≈ ${Math.max(10, Math.round(meters * 100))} cm`;
    }

    if (meters < 10) {
        return `≈ ${meters.toFixed(1)} m`;
    }

    return `≈ ${Math.round(meters)} m`;
};

const formatProximity = (target: RadarTarget | null): string => {
    switch (target?.proximity) {
        case "very_near":
            return "MUY CERCA";
        case "near":
            return "CERCA";
        case "medium":
            return "MEDIO";
        case "far":
            return "LEJOS";
        default:
            return "N/A";
    }
};

export default function BottomPanel({
    targetCount = 0,
    nearestTarget = null
}: BottomPanelProps) {
    const distance = nearestTarget?.estimatedDistance != null
        ? formatDistance(nearestTarget.estimatedDistance)
        : "N/A";

    const proximity = formatProximity(nearestTarget);

    const rssi = nearestTarget?.bluetooth?.rssi != null
        ? `${nearestTarget.bluetooth.rssi} dBm`
        : nearestTarget?.wifi?.signalLevel != null
            ? `${nearestTarget.wifi.signalLevel} dBm`
            : "N/A";

    return (
        <View style={styles.container}>
            <View style={styles.cardSlot}>
                <RadarCard title="Objetivos" value={targetCount} />
            </View>
            <View style={styles.cardSlot}>
                <RadarCard title="Distancia" value={distance} />
            </View>
            <View style={styles.cardSlot}>
                <RadarCard title="Proximidad" value={proximity} />
            </View>
            <View style={styles.cardSlot}>
                <RadarCard title="RSSI" value={rssi} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 12,
        backgroundColor: "#111827",
        flexDirection: "row",
        flexWrap: "wrap"
    },
    cardSlot: {
        width: "50%",
        padding: 4
    }
});
