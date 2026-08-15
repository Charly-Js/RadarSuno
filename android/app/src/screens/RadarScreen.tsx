import React, { useState } from "react";
import { launchCamera } from "react-native-image-picker";

import {
    View,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Pressable
} from "react-native";

import RadarView from "../components/RadarView";
import StatusBarPanel from "../components/StatusBarPanel";
import BottomPanel from "../components/BottomPanel";
import { MissionEvidencePhoto, MissionOutcome } from "../interfaces/MissionRecord";
import MissionFileService from "../services/MissionFileService";

interface RadarScreenProps {
    status: any;
    missionStatus?: {
        bluetooth: boolean;
        wifi: boolean;
        gps: boolean;
    };
    running: boolean;
    onStart: () => Promise<void>;
    onStop: (outcome?: MissionOutcome, note?: string, evidencePhoto?: MissionEvidencePhoto | null) => Promise<void>;
    errorMessage: string;
    rescueType: string;
    focusedTargetId?: string | null;
    onPinTarget?: (id: string) => void;
    pinnedDestination?: {
        latitude: number;
        longitude: number;
    } | null;
    distanceToPinnedTarget?: number | null;
    onSubmitRescueReport?: (report: string) => Promise<void>;
    operatorName?: string;
    pinnedRoute?: Array<{
        latitude: number;
        longitude: number;
    }>;
}

const RadarScreen: React.FC<RadarScreenProps> = ({
    status,
    missionStatus,
    running,
    onStart,
    onStop,
    errorMessage,
    rescueType,
    focusedTargetId = null,
    onPinTarget,
    pinnedDestination = null,
    distanceToPinnedTarget = null,
    onSubmitRescueReport,
    operatorName = "Rescatista sin nombre",
    pinnedRoute = []
}) => {
    const [rescueReport, setRescueReport] = useState("");
    const [finishReport, setFinishReport] = useState("");
    const [finishOutcome, setFinishOutcome] = useState<MissionOutcome | null>(null);
    const [finishPhoto, setFinishPhoto] = useState<MissionEvidencePhoto | null>(null);
    const [noResultConfirmed, setNoResultConfirmed] = useState(false);
    const [finishError, setFinishError] = useState("");
    const [statsOpen, setStatsOpen] = useState(false);
    const orientation = status?.mission?.sensors?.azimuth ?? 0;
    const elapsedSeconds = Math.round((status?.mission?.elapsedTime ?? 0) / 1000);
    const gps = status?.mission?.gps;
    const sensors = status?.mission?.sensors;
    const visibleRoute = pinnedRoute.length > 0 ? pinnedRoute : status?.mission?.gps?.route ?? [];
    const shouldShowRescueForm = running && focusedTargetId && distanceToPinnedTarget != null && distanceToPinnedTarget <= 20;

    const submitRescueReport = async () => {
        if (!rescueReport.trim() || !onSubmitRescueReport) {
            return;
        }
        await onSubmitRescueReport(rescueReport.trim());
        setRescueReport("");
    };

    const requestStop = (outcome: MissionOutcome) => {
        setFinishOutcome(outcome);
        setFinishPhoto(null);
        setNoResultConfirmed(false);
        setFinishError("");
        setStatsOpen(true);
    };

    const captureFinishPhoto = async () => {
        const missionId = status?.mission?.startTime
            ? `MISSION-${status.mission.startTime}`
            : `MISSION-${Date.now()}`;
        const result = await launchCamera({
            mediaType: "photo",
            saveToPhotos: false,
            includeBase64: false,
            quality: 0.8
        });

        if (result.didCancel) {
            return;
        }

        const uri = result.assets?.[0]?.uri;
        if (!uri) {
            setFinishError("No se pudo capturar la foto de evidencia.");
            return;
        }

        const evidence = await MissionFileService.saveEvidencePhoto(
            uri,
            missionId,
            operatorName
        );
        setFinishPhoto(evidence);
        setFinishError("");
    };

    const submitStop = async () => {
        if (!finishOutcome) {
            return;
        }
        if (finishOutcome === "completed" && !finishPhoto) {
            setFinishError("Para finalizar con resultado debe tomar una foto de evidencia.");
            return;
        }
        if (finishOutcome === "no_result" && !noResultConfirmed) {
            setFinishError("Confirme que no hubo resultado antes de cerrar la misión.");
            return;
        }

        const fallback =
            finishOutcome === "no_result"
                ? "Misión cerrada sin resultado útil."
                : "Misión finalizada por el operador.";
        await onStop(finishOutcome, finishReport.trim() || fallback, finishPhoto);
        setFinishReport("");
        setFinishPhoto(null);
        setNoResultConfirmed(false);
        setFinishOutcome(null);
    };

    return (
        <View style={styles.container}>
            {/* MAPA: ocupa todo el espacio */}
            <View style={styles.radarContainer}>
                <RadarView
                    targets={status?.targets ?? []}
                    rotation={orientation}
                    location={status?.mission?.gps?.latitude && status?.mission?.gps?.longitude ? {
                        latitude: status.mission.gps.latitude,
                        longitude: status.mission.gps.longitude
                    } : null}
                    route={visibleRoute}
                    destination={pinnedDestination}
                    focusedTargetId={focusedTargetId}
                    onPinTarget={onPinTarget}
                />
            </View>

            {/* BOTÓN FLOTANTE SOBRE EL MAPA (parte inferior) */}
            <View style={styles.floatingButtonWrapper} pointerEvents="box-none">
                {running ? (
                    <View style={styles.floatingRow}>
                        <TouchableOpacity
                            style={[styles.floatingButton, styles.stopButton]}
                            onPress={() => requestStop("completed")}
                        >
                            <Text style={styles.actionText}>Finalizar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.floatingButton, styles.noResultButton]}
                            onPress={() => requestStop("no_result")}
                        >
                            <Text style={styles.actionText}>Sin resultado</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={[styles.floatingButton, styles.startButton]}
                        onPress={onStart}
                    >
                        <Text style={styles.actionText}>Iniciar misión</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* MENÚ DESPLEGABLE DE ESTADÍSTICAS (esquina superior) */}
            <View style={styles.statsDrawerWrapper} pointerEvents="box-none">
                <Pressable
                    style={styles.statsToggle}
                    onPress={() => setStatsOpen(prev => !prev)}
                >
                    <Text style={styles.statsToggleIcon}>{statsOpen ? "▲" : "▼"}</Text>
                    <Text style={styles.statsToggleText}>
                        Estadísticas {statsOpen ? "" : `· ${status?.targets?.length ?? 0} obj.`}
                    </Text>
                </Pressable>

                {statsOpen && (
                    <View style={styles.statsDrawer}>
                        <ScrollView
                            style={styles.statsScroll}
                            contentContainerStyle={styles.statsContent}
                            showsVerticalScrollIndicator
                            nestedScrollEnabled
                            bounces={false}
                        >
                            <View style={styles.missionStateCard}>
                                <View style={styles.missionStateHeader}>
                                    <Text style={styles.missionStateTitle}>
                                        {running ? "Misión activa" : status?.mission?.endTime ? "Misión finalizada" : "Misión en espera"}
                                    </Text>
                                    <Text style={[
                                        styles.missionStateBadge,
                                        running ? styles.runningBadge : styles.idleBadge
                                    ]}>
                                        {running ? "REGISTRANDO" : "CERRADA"}
                                    </Text>
                                </View>
                                <Text style={styles.missionStateText}>
                                    Tiempo: {elapsedSeconds}s · Recorrido: {(gps?.totalDistance ?? 0).toFixed(1)} m
                                </Text>
                                <Text style={styles.missionStateText}>
                                    Tipo de rescate: {rescueType}
                                </Text>
                                <Text style={styles.missionStateText}>
                                    PIN: {focusedTargetId ? focusedTargetId : "Sin objetivo fijado"} · Ruta PIN: {pinnedRoute.length} puntos
                                </Text>
                                <Text style={styles.missionStateText}>
                                    Distancia al PIN: {distanceToPinnedTarget != null ? `${distanceToPinnedTarget.toFixed(1)} m` : "Sin destino calculado"}
                                </Text>
                                <Text style={styles.missionStateText} numberOfLines={1}>
                                    GPS: {(gps?.latitude ?? 0).toFixed(6)}, {(gps?.longitude ?? 0).toFixed(6)} · Precisión {(gps?.accuracy ?? 0).toFixed(1)} m
                                </Text>
                                <Text style={styles.missionStateText}>
                                    Acelerómetro: {sensors?.moving ? "movimiento detectado" : "estable"} · Azimut {(sensors?.azimuth ?? 0).toFixed(0)}°
                                </Text>
                            </View>

                            {shouldShowRescueForm ? (
                                <View style={styles.rescueCard}>
                                    <Text style={styles.rescueTitle}>Rescate en sitio</Text>
                                    <Text style={styles.rescueText}>Objetivo cercano. Registre el estado antes de continuar.</Text>
                                    <TextInput
                                        style={styles.rescueInput}
                                        value={rescueReport}
                                        onChangeText={setRescueReport}
                                        placeholder="Estado de la víctima, equipo usado, acción tomada..."
                                        placeholderTextColor="#64748B"
                                        multiline
                                    />
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.rescueButton]}
                                        onPress={submitRescueReport}
                                    >
                                        <Text style={styles.actionText}>Guardar reporte</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : null}

                            {finishOutcome ? (
                                <View style={styles.rescueCard}>
                                    <Text style={styles.rescueTitle}>
                                        {finishOutcome === "no_result" ? "Cerrar sin hallazgo" : "Reporte final"}
                                    </Text>
                                    <Text style={styles.rescueText}>Registre qué encontró, coordenadas relevantes, estado de la señal o motivo del cierre.</Text>
                                    <TextInput
                                        style={styles.rescueInput}
                                        value={finishReport}
                                        onChangeText={setFinishReport}
                                        placeholder="Ej: se encontró teléfono bajo escombros, sin víctima visible..."
                                        placeholderTextColor="#64748B"
                                        multiline
                                    />
                                    {finishOutcome === "completed" ? (
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.photoButton]}
                                            onPress={captureFinishPhoto}
                                        >
                                            <Text style={styles.actionText}>
                                                {finishPhoto ? "Foto guardada" : "Tomar foto de evidencia"}
                                            </Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <TouchableOpacity
                                            style={[
                                                styles.confirmButton,
                                                noResultConfirmed && styles.confirmButtonActive
                                            ]}
                                            onPress={() => setNoResultConfirmed(prev => !prev)}
                                        >
                                            <Text style={styles.confirmText}>
                                                {noResultConfirmed ? "Confirmado sin resultado" : "Confirmar cierre sin resultado"}
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                    {finishPhoto ? (
                                        <Text style={styles.evidenceText}>
                                            Evidencia: {finishPhoto.fileName} · Marca: {finishPhoto.watermarkText}
                                        </Text>
                                    ) : null}
                                    {finishError ? (
                                        <Text style={styles.errorText}>{finishError}</Text>
                                    ) : null}
                                    <View style={styles.finishActions}>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.cancelButton]}
                                            onPress={() => {
                                                setFinishOutcome(null);
                                                setFinishError("");
                                            }}
                                        >
                                            <Text style={styles.actionText}>Cancelar</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.actionButton, styles.rescueButton, styles.finishButton]}
                                            onPress={submitStop}
                                        >
                                            <Text style={styles.actionText}>Guardar y cerrar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ) : null}

                            {errorMessage ? (
                                <Text style={styles.errorText} numberOfLines={2}>{errorMessage}</Text>
                            ) : null}

                            <StatusBarPanel
                                gps={missionStatus?.gps ?? false}
                                ble={missionStatus?.bluetooth ?? false}
                                wifi={missionStatus?.wifi ?? false}
                                sensors={status?.mission?.sensors?.running ?? false}
                            />
                            <BottomPanel
                                targetCount={status?.targets?.length ?? 0}
                                nearestTarget={status?.nearestTarget ?? null}
                            />
                        </ScrollView>
                    </View>
                )}
            </View>
        </View>
    );
};

export default RadarScreen;

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: "#111827"
    },

    radarContainer: {
        flex: 1
    },

    /**
     * Wrapper flotante para el botón de misión.
     * Posicionado en la parte inferior del mapa, encima del radar.
     * Ocupa el ancho completo con un poco de padding lateral.
     */
    floatingButtonWrapper: {
        position: "absolute",
        left: 12,
        right: 12,
        bottom: 14,
        alignItems: "stretch"
    },

    floatingRow: {
        flexDirection: "row",
        gap: 10,
        width: "100%"
    },

    floatingButton: {
        flex: 1,
        minHeight: 58,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.45,
        shadowRadius: 5,
        paddingHorizontal: 8
    },

    /**
     * Menú desplegable de estadísticas en la parte superior.
     */
    statsDrawerWrapper: {
        position: "absolute",
        top: 48,
        left: 12,
        right: 12,
        alignItems: "center"
    },

    statsToggle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        backgroundColor: "#0F172A",
        borderColor: "#1E293B",
        borderWidth: 1,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        marginBottom: 6
    },

    statsToggleIcon: {
        color: "#38BDF8",
        fontSize: 12,
        fontWeight: "700"
    },

    statsToggleText: {
        color: "#E2E8F0",
        fontSize: 13,
        fontWeight: "700"
    },

    statsDrawer: {
        marginTop: 8,
        width: "100%",
        height: 360,
        backgroundColor: "rgba(15, 23, 42, 0.97)",
        borderColor: "#1E293B",
        borderWidth: 1,
        borderRadius: 12,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
        overflow: "hidden"
    },

    statsScroll: {
        flex: 1
    },

    statsContent: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 14
    },

    missionStateCard: {
        backgroundColor: "#0F172A",
        borderColor: "#1E293B",
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 8
    },

    missionStateHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 4
    },

    missionStateTitle: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700"
    },

    missionStateBadge: {
        overflow: "hidden",
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        color: "#FFFFFF",
        fontSize: 10,
        fontWeight: "700"
    },

    runningBadge: {
        backgroundColor: "#059669"
    },

    idleBadge: {
        backgroundColor: "#475569"
    },

    missionStateText: {
        color: "#CBD5E1",
        fontSize: 11,
        marginTop: 2
    },

    actionButton: {
        minHeight: 42,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center"
    },

    startButton: {
        backgroundColor: "#10B981"
    },

    stopButton: {
        backgroundColor: "#EF4444"
    },

    noResultButton: {
        backgroundColor: "#F59E0B"
    },

    rescueCard: {
        backgroundColor: "#082F49",
        borderColor: "#38BDF8",
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginTop: 10
    },

    rescueTitle: {
        color: "#E0F2FE",
        fontSize: 13,
        fontWeight: "800"
    },

    rescueText: {
        color: "#BAE6FD",
        fontSize: 11,
        marginTop: 3
    },

    rescueInput: {
        minHeight: 70,
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#0EA5E9",
        color: "#FFFFFF",
        paddingHorizontal: 10,
        paddingVertical: 8,
        textAlignVertical: "top"
    },

    rescueButton: {
        backgroundColor: "#0284C7",
        marginTop: 8
    },

    finishButton: {
        flex: 1,
        marginTop: 0
    },

    finishActions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 8
    },

    photoButton: {
        backgroundColor: "#0369A1",
        marginTop: 8
    },

    confirmButton: {
        minHeight: 42,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#F59E0B",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 8
    },

    confirmButtonActive: {
        backgroundColor: "#92400E"
    },

    confirmText: {
        color: "#FEF3C7",
        fontWeight: "800"
    },

    evidenceText: {
        color: "#BAE6FD",
        fontSize: 11,
        marginTop: 6
    },

    cancelButton: {
        flex: 1,
        backgroundColor: "#475569"
    },

    actionText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 15
    },

    errorText: {
        color: "#FCA5A5",
        fontSize: 12,
        marginTop: 8,
        textAlign: "center"
    }

});
