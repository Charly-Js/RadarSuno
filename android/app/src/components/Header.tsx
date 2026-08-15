import React from "react";

import {
    View,
    Text,
    StyleSheet
} from "react-native";

interface HeaderProps {
    online?: boolean;
    operatorName?: string;
    operatorId?: string;
    teamName?: string;
}

export default function Header({
    online = false,
    operatorName,
    operatorId,
    teamName
}: HeaderProps) {
    const displayName = operatorName?.trim() || "Operador sin registrar";
    const displayId = operatorId?.trim() || "RS------";
    const displayTeam = teamName?.trim();

    return (
        <View style={styles.container}>
            <View style={[styles.logoBadge, online && styles.logoBadgeActive]}>
                <Text style={styles.logoText}>RS</Text>
            </View>
            <View style={styles.titleBlock}>
                <View style={styles.titleRow}>
                    <Text style={styles.title}>RADARSUR</Text>
                    <View style={styles.idChip}>
                        <Text style={styles.idChipText}>{displayId}</Text>
                    </View>
                </View>
                <Text style={styles.operatorName} numberOfLines={1}>
                    {displayName}
                </Text>
                {displayTeam ? (
                    <Text style={styles.teamName} numberOfLines={1}>
                        {displayTeam}
                    </Text>
                ) : (
                    <Text style={styles.subtitle}>
                        Sistema Inteligente de Búsqueda
                    </Text>
                )}
            </View>
            <View style={styles.statusContainer}>
                <View style={[styles.dot, online ? styles.dotOnline : styles.dotOffline]} />
                <Text style={[styles.online, online ? styles.textOnline : styles.textOffline]}>
                    {online ? "ONLINE" : "OFFLINE"}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottomWidth: 1,
        borderBottomColor: "#2C3746",
        backgroundColor: "#111827"
    },
    logoBadge: {
        width: 42,
        height: 42,
        borderRadius: 21,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F172A",
        borderWidth: 2,
        borderColor: "#334155",
        marginRight: 10
    },
    logoBadgeActive: {
        borderColor: "#00FF88",
        backgroundColor: "#064E3B"
    },
    logoText: {
        color: "#A7F3D0",
        fontSize: 15,
        fontWeight: "900"
    },
    titleBlock: {
        flex: 1,
        marginRight: 12
    },
    titleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8
    },
    title: {
        color: "#00FF88",
        fontSize: 22,
        fontWeight: "800",
        letterSpacing: 1
    },
    idChip: {
        backgroundColor: "#064E3B",
        borderColor: "#10B981",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 8,
        paddingVertical: 2
    },
    idChipText: {
        color: "#6EE7B7",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1
    },
    operatorName: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
        marginTop: 4
    },
    teamName: {
        color: "#A5B4C3",
        fontSize: 12,
        marginTop: 2
    },
    subtitle: {
        color: "#A5B4C3",
        marginTop: 4,
        fontSize: 12
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
        flexShrink: 0
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8
    },
    dotOnline: {
        backgroundColor: "#00FF88"
    },
    dotOffline: {
        backgroundColor: "#64748B"
    },
    online: {
        fontWeight: "600"
    },
    textOnline: {
        color: "#00FF88"
    },
    textOffline: {
        color: "#94A3B8"
    }
});
