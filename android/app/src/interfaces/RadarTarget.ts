/**
 * ==========================================================
 * RADARSURO
 * RadarTarget
 * ----------------------------------------------------------
 * Representa un objetivo detectado por el RadarEngine.
 * Un objetivo puede contener información proveniente de
 * Bluetooth, WiFi o ambas tecnologías.
 * ==========================================================
 */

export interface RadarTarget {

    /**
     * Identificador interno único
     */
    id: string;

    /**
     * Nombre visible del objetivo
     */
    name: string;

    /**
     * Primera vez detectado
     */
    firstSeen: number;

    /**
     * Última vez detectado
     */
    lastSeen: number;

    /**
     * Cantidad de veces observado
     */
    observations: number;

    /**
     * Intensidad estimada (0 - 100)
     */
    signalStrength: number;

    /**
     * Nivel de confianza del algoritmo (0 - 100)
     */
    confidence: number;

    /**
     * Distancia estimada (metros)
     * Es solamente una aproximación.
     */
    estimatedDistance: number;

    /**
     * Dirección respecto al rescatista
     */
    heading: number;

    /**
     * Bearing relativo observado al operador cuando la señal fue más fuerte.
     * No es una coordenada física real del emisor; es una pista operativa
     * derivada de RSSI + orientación.
     */
    relativeBearing?: number;

    /**
     * Calidad del bearing estimado.
     */
    bearingAccuracy?: "unknown" | "observed";

    /**
     * Etiqueta legible para comunicar que la distancia es aproximada.
     */
    distanceLabel?: string;

    /**
     * Estado de proximidad derivado de estimatedDistance.
     */
    proximity?: "far" | "medium" | "near" | "very_near";

    /**
     * Tecnología utilizada para detectarlo
     */
    source: "bluetooth" | "wifi" | "hybrid";

    /**
     * Información Bluetooth
     */
    bluetooth?: {

        id: string;

        name: string;

        rssi: number;

    };

    /**
     * Información WiFi
     */
    wifi?: {

        ssid: string;

        bssid: string;

        signalLevel: number;

        frequency: number;

    };

    /**
     * Posición del rescatista
     * cuando observó el objetivo.
     */
    location: {

        latitude: number;

        longitude: number;

        accuracy: number;

    };

    /**
     * Orientación del dispositivo
     */
    orientation: {

        azimuth: number;

        pitch: number;

        roll: number;

    };

    /**
     * ¿El objetivo continúa activo?
     */
    active: boolean;

}
