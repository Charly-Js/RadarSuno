import {BluetoothService }from "../services/BluetoothService";
import {GPSService }from "../services/GPSService";
import SensorService from "../services/SensorService";
import SoundService from "../services/SoundService";
import WifiService from "../services/WifiService";

import { RadarTarget } from "../interfaces/RadarTarget";
import { PermissionService } from "../services/PermissionService";


export default class RadarEngine {

    /**
     * ==========================================================
     * OBJETIVOS DETECTADOS
     * ==========================================================
     */

    private static targets: RadarTarget[] = [];

    /**
     * ==========================================================
     * ESTADO DEL MOTOR
     * ==========================================================
     */

    private static running = false;

    /**
     * ==========================================================
     * INTERVALO DE ACTUALIZACIÓN
     * ==========================================================
     */

    private static updateInterval:
        ReturnType<typeof setInterval> | null = null;

    /**
     * ==========================================================
     * CONFIGURACIÓN
     * ==========================================================
     */

    private static readonly UPDATE_RATE = 1000;

    /**
     * ==========================================================
     * PARÁMETROS DE PRECISIÓN
     * ==========================================================
     */

    /**
     * RSSI esperado a 1 metro (txPower) por defecto.
     * Valor típico BLE para iBeacon/Edison/etiquetas genéricas: -59 dBm.
     */
    private static readonly DEFAULT_TX_POWER = -59;

    /**
     * Exponente de path loss. 2.0 = espacio libre. Subir a 2.5 si el entorno
     * tiene muchas paredes/obstáculos. Lo dejamos en 2.0 para evitar sobre-
     * estimación en distancias cortas (<1 m).
     */
    private static readonly BLE_PATH_LOSS_EXPONENT = 2.0;

    /**
     * Calibración empírica para corto alcance. En teléfonos reales, una señal
     * a 50 cm suele llegar bastante más débil que el txPower teórico por mano,
     * carcasa, orientación y modelo de antena. Este ancla evita que lecturas
     * alrededor de -65 dBm se muestren como varios metros.
     */
    private static readonly BLE_CLOSE_RANGE_RSSI = -65;
    private static readonly BLE_CLOSE_RANGE_DISTANCE = 0.5;
    private static readonly BLE_CLOSE_RANGE_LIMIT_RSSI = -75;
    private static readonly BLE_CLOSE_RANGE_BLEND_RSSI = -85;

    /**
     * Cap superior para distancias BLE (metros). Más allá de este valor la
     * señal es tan débil que la estimación deja de ser útil.
     */
    private static readonly BLE_MAX_DISTANCE = 20;

    /**
     * Cap superior para distancias WiFi (metros).
     */
    private static readonly WIFI_MAX_DISTANCE = 30;

    /**
     * Coeficiente de suavizado exponencial (EMA) para estimatedDistance.
     * 0.6 = bastante reactivo (recorta efecto de lecturas malas previas).
     */
    private static readonly DISTANCE_SMOOTHING = 0.6;

    /**
     * Tiempo (ms) tras el cual un objetivo sin nuevas observaciones se considera inactivo.
     */
    private static readonly TARGET_STALE_MS = 8000;

    /**
     * Factor de suavizado para confidence (EMA).
     */
    private static readonly CONFIDENCE_SMOOTHING = 0.25;

    /**
     * Historial RSSI por objetivo (id -> rssi[]) para medir estabilidad.
     */
    private static rssiHistory: Map<string, number[]> = new Map();
    private static readonly RSSI_HISTORY_MAX = 12;

    /**
     * Map<id, lastDistance> para EMA sobre estimatedDistance.
     */
    private static distanceHistory: Map<string, number> = new Map();

    /**
     * Mejor intensidad observada por objetivo. Se usa para conservar el
     * bearing absoluto donde el RSSI fue más fuerte sin inventar coordenadas.
     */
    private static bestSignalHistory: Map<string, number> = new Map();

    /**
     * ==========================================================
     * INICIAR MOTOR
     * ==========================================================
     */
    static async start(): Promise<void> {

        if (this.running) return;

        const granted =
            await PermissionService.hasAllPermissions() ||
            await PermissionService.requestAllPermissions();

        if (!granted) {
            throw new Error("Permisos denegados.");
        }

        BluetoothService.startScan();

        // await GPSService.startTracking();

        SensorService.start();

        SoundService.start();

        //Diagnostico

        setTimeout(() => {

            console.log(
                "EstadoSonido:",
                SoundService.getStatus()
            );
        }, 15000);


        // El sonido queda desactivado durante el arranque critico para evitar
        // cierres nativos mientras validamos el escaneo en dispositivo real.

        try {
            await WifiService.start();
        } catch (error) {
            console.warn("RadarEngine: WiFi no disponible para telemetría", error);
        }

        this.running = true;

        this.updateInterval = setInterval(() => {
            this.update();
        }, this.UPDATE_RATE);

    }

    /**
     * ==========================================================
     * ACTUALIZAR MOTOR
     * ==========================================================
     */
    private static update(): void {

        this.updateBluetoothTargets();
        this.updateWifiTargets();
        this.expireStaleTargets();

        const nearestTarget = this.getNearestTarget();
        SoundService.update(nearestTarget?.estimatedDistance ?? null);

    }

    /**
     * ==========================================================
     * ACTUALIZAR OBJETIVOS BLUETOOTH
     * ==========================================================
     */

    private static updateBluetoothTargets(): void {

        const devices = BluetoothService.getDevices();

        const location = GPSService.getMissionCoordinates();

        const orientation = SensorService.getOrientation();

        devices.forEach(device => {

            const existing = this.targets.find(target =>
                target.bluetooth?.id === device.id
            );

            const rssi = device.rssi ?? -100;
            const txPower = (device as any).txPower ?? this.DEFAULT_TX_POWER;
            const stability = this.pushRssiAndGetStability(device.id, rssi);
            // Usamos el RSSI promediado por nuestro propio historial, incluyendo
            // la lectura actual, para no dejar la distancia un ciclo atrasada.
            const stableRssi = this.getStableRssi(device.id, rssi);
            const rawDistance = this.estimateBleDistance(stableRssi, txPower);
            const distance = this.smoothDistance(
                device.id,
                rawDistance
            );
            const deviceName = this.getBluetoothDeviceName(device, existing?.name);
            const signalStrength = this.normalizeRssi(stableRssi);
            const bearing = this.resolveObservedHeading(
                device.id,
                existing?.heading,
                orientation.azimuth,
                signalStrength
            );
            const proximity = this.getProximity(distance);
            const distanceLabel = this.formatApproxDistance(distance);

            if (existing) {

                existing.lastSeen = Date.now();

                existing.observations++;

                existing.signalStrength = signalStrength;

                existing.estimatedDistance = distance;

                existing.distanceLabel = distanceLabel;

                existing.proximity = proximity;

                existing.heading = bearing.heading;

                existing.relativeBearing = this.normalizeDegrees(
                    bearing.heading - orientation.azimuth
                );

                existing.bearingAccuracy = bearing.accuracy;

                existing.bluetooth = {

                    id: device.id,

                    name: deviceName,

                    rssi: stableRssi

                };

                existing.name = deviceName;

                existing.confidence = this.computeConfidence(
                    existing.confidence,
                    existing.observations,
                    signalStrength,
                    stability,
                    existing.source
                );

                existing.orientation = {

                    azimuth: orientation.azimuth,

                    pitch: orientation.pitch,

                    roll: orientation.roll

                };

                existing.active = true;

                return;

            }

            const target: RadarTarget = {

                id: device.id,

                name: deviceName,

                firstSeen: Date.now(),

                lastSeen: Date.now(),

                observations: 1,

                signalStrength,

                confidence: this.computeConfidence(50, 1, signalStrength, stability, "bluetooth"),

                estimatedDistance: distance,

                heading: bearing.heading,

                relativeBearing: this.normalizeDegrees(
                    bearing.heading - orientation.azimuth
                ),

                bearingAccuracy: bearing.accuracy,

                distanceLabel,

                proximity,

                source: "bluetooth",

                bluetooth: {

                    id: device.id,

                    name: deviceName,

                    rssi: stableRssi

                },

                location: {

                    latitude: location?.latitude ?? 0,

                    longitude: location?.longitude ?? 0,

                    accuracy: location?.accuracy ?? 0

                },

                orientation: {

                    azimuth: orientation.azimuth,

                    pitch: orientation.pitch,

                    roll: orientation.roll

                },

                active: true

            };

            this.targets.push(target);

        });

    }

    private static updateWifiTargets(): void {

        const networks = WifiService.getObservedNetworks();
        const location = GPSService.getMissionCoordinates();
        const orientation = SensorService.getOrientation();

        networks.forEach(network => {
            const id = `wifi-${network.bssid || network.ssid}`;
            const existing = this.targets.find(target => target.id === id);
            const rawRssi = network.signalLevel || -100;
            const signalStrength = this.normalizeRssi(rawRssi);
            const rawDistance = this.estimateWifiDistance(rawRssi, network.frequency);
            const distance = this.smoothDistance(id, rawDistance);
            const name = network.ssid || `WiFi ${network.bssid.slice(-5).toUpperCase()}`;
            const stability = this.pushRssiAndGetStability(id, rawRssi);
            const newSource: RadarTarget["source"] = existing?.bluetooth ? "hybrid" : "wifi";
            const bearing = this.resolveObservedHeading(
                id,
                existing?.heading,
                orientation.azimuth,
                signalStrength
            );
            const proximity = this.getProximity(distance);
            const distanceLabel = this.formatApproxDistance(distance);

            if (existing) {
                existing.lastSeen = network.lastSeen;
                existing.observations++;
                existing.signalStrength = signalStrength;
                existing.estimatedDistance = distance;
                existing.heading = bearing.heading;
                existing.relativeBearing = this.normalizeDegrees(
                    bearing.heading - orientation.azimuth
                );
                existing.bearingAccuracy = bearing.accuracy;
                existing.distanceLabel = distanceLabel;
                existing.proximity = proximity;
                existing.source = newSource;
                existing.name = existing.bluetooth?.name || name;
                existing.wifi = {
                    ssid: name,
                    bssid: network.bssid,
                    signalLevel: network.signalLevel,
                    frequency: network.frequency
                };
                existing.location = {
                    latitude: location?.latitude ?? existing.location.latitude,
                    longitude: location?.longitude ?? existing.location.longitude,
                    accuracy: location?.accuracy ?? existing.location.accuracy
                };
                existing.orientation = {
                    azimuth: orientation.azimuth,
                    pitch: orientation.pitch,
                    roll: orientation.roll
                };
                existing.confidence = this.computeConfidence(
                    existing.confidence,
                    existing.observations,
                    signalStrength,
                    stability,
                    newSource
                );
                existing.active = true;
                return;
            }

            this.targets.push({
                id,
                name,
                firstSeen: network.lastSeen,
                lastSeen: network.lastSeen,
                observations: 1,
                signalStrength,
                confidence: this.computeConfidence(42, 1, signalStrength, stability, "wifi"),
                estimatedDistance: distance,
                heading: bearing.heading,
                relativeBearing: this.normalizeDegrees(
                    bearing.heading - orientation.azimuth
                ),
                bearingAccuracy: bearing.accuracy,
                distanceLabel,
                proximity,
                source: "wifi",
                wifi: {
                    ssid: name,
                    bssid: network.bssid,
                    signalLevel: network.signalLevel,
                    frequency: network.frequency
                },
                location: {
                    latitude: location?.latitude ?? 0,
                    longitude: location?.longitude ?? 0,
                    accuracy: location?.accuracy ?? 0
                },
                orientation: {
                    azimuth: orientation.azimuth,
                    pitch: orientation.pitch,
                    roll: orientation.roll
                },
                active: true
            });
        });

    }

    private static getBluetoothDeviceName(
        device: any,
        fallback?: string
    ): string {

        const advertisedName =
            device.localName ||
            device.name ||
            device.serviceData?.localName ||
            fallback;

        if (advertisedName && advertisedName !== "Dispositivo desconocido") {

            return advertisedName;

        }

        return `BLE ${device.id.slice(-5).toUpperCase()}`;

    }

    private static normalizeRssi(rssi: number): number {

        // Escala calibrada para RSSI BLE/WiFi real.
        // -100 dBm -> 0, -30 dBm -> 100. La curva no es lineal: el RSSI
        // varía de forma aproximadamente logarítmica con la distancia,
        // por lo que usamos una interpolación con leve compresión en
        // valores altos y expansión en valores bajos para diferenciar
        // señales débiles que son críticas en rescates.
        const MIN_RSSI = -100;
        const MAX_RSSI = -30;

        if (rssi <= MIN_RSSI) return 0;
        if (rssi >= MAX_RSSI) return 100;

        const normalized = (rssi - MIN_RSSI) / (MAX_RSSI - MIN_RSSI);
        // Curva suave (sqrt) que separa mejor señales en el rango crítico (-90 a -70).
        const shaped = Math.sqrt(normalized);
        return Math.max(0, Math.min(100, Math.round(shaped * 100)));

    }

    /**
     * Distancia estimada para BLE usando el modelo de path-loss log-distance.
     * d = 10 ^ ((txPower - rssi) / (10 * n))
     * Para corto alcance se usa un ancla empírica:
     *   rssi -65 -> ~0.5 m
     *   rssi -75 -> ~1.6 m
     * y se mezcla gradualmente con path-loss normal en señales más débiles.
     */
    private static estimateBleDistance(
        rssi: number,
        txPower: number = this.DEFAULT_TX_POWER,
        pathLossExponent: number = this.BLE_PATH_LOSS_EXPONENT
    ): number {
        if (rssi >= 0 || txPower >= 0) return 0;

        const closeRangeDistance = this.BLE_CLOSE_RANGE_DISTANCE *
            Math.pow(
                10,
                (this.BLE_CLOSE_RANGE_RSSI - rssi) / (10 * pathLossExponent)
            );
        const pathLossDistance = Math.pow(
            10,
            (txPower - rssi) / (10 * pathLossExponent)
        );

        let distance = pathLossDistance;
        if (rssi >= this.BLE_CLOSE_RANGE_LIMIT_RSSI) {
            distance = closeRangeDistance;
        } else if (rssi > this.BLE_CLOSE_RANGE_BLEND_RSSI) {
            const blend =
                (rssi - this.BLE_CLOSE_RANGE_BLEND_RSSI) /
                (this.BLE_CLOSE_RANGE_LIMIT_RSSI - this.BLE_CLOSE_RANGE_BLEND_RSSI);
            distance =
                closeRangeDistance * blend +
                pathLossDistance * (1 - blend);
        }

        return Math.max(0.1, Math.min(this.BLE_MAX_DISTANCE, distance));
    }

    /**
     * Distancia estimada para WiFi usando FSPL con frecuencia (MHz).
     * fspl(d_km) = 20*log10(d_km) + 20*log10(f) + 32.44
     * WiFi típico 2.4 GHz -> f = 2437 MHz; 5 GHz -> 5180 MHz.
     */
    private static estimateWifiDistance(
        rssi: number,
        frequencyMHz: number = 2437
    ): number {
        if (rssi >= 0 || rssi <= -120) return 0;
        const WIFI_TX_POWER = 18; // dBm típico de un AP doméstico (15-20)
        const pathLoss = WIFI_TX_POWER - rssi;
        const dMeters =
            Math.pow(10, (pathLoss - 20 * Math.log10(frequencyMHz) - 32.44) / 20) *
            1000;
        return Math.max(0.5, Math.min(this.WIFI_MAX_DISTANCE, dMeters));
    }

    /**
     * EMA sobre estimatedDistance por objetivo para suavizar fluctuaciones.
     * Si la nueva lectura dista mucho (>5 m) de la previa, se interpreta
     * como un cambio real (movimiento del objetivo o cambio de entorno) y
     * se reemplaza el histórico en vez de promediar — evita arrastrar
     * estimaciones erróneas heredadas de las primeras muestras.
     */
    private static smoothDistance(id: string, rawDistance: number): number {
        const previous = this.distanceHistory.get(id);
        if (previous == null) {
            this.distanceHistory.set(id, rawDistance);
            return rawDistance;
        }
        const delta = Math.abs(rawDistance - previous);
        const smoothed =
            delta > 5
                ? rawDistance
                : previous * (1 - this.DISTANCE_SMOOTHING) +
                  rawDistance * this.DISTANCE_SMOOTHING;
        const final = Number(smoothed.toFixed(2));
        this.distanceHistory.set(id, final);
        return final;
    }

    /**
     * Registra un RSSI en el historial y devuelve un coeficiente de
     * estabilidad en [0, 1] (1 = totalmente estable, 0 = muy ruidoso).
     * Se calcula a partir de la desviación estándar normalizada.
     */
    private static pushRssiAndGetStability(id: string, rssi: number): number {
        let history = this.rssiHistory.get(id) ?? [];
        history.push(rssi);
        if (history.length > this.RSSI_HISTORY_MAX) history.shift();
        this.rssiHistory.set(id, history);

        if (history.length < 3) return 0.4; // pocos datos -> asumimos ruido medio

        const mean =
            history.reduce((acc, v) => acc + v, 0) / history.length;
        const variance =
            history.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) /
            history.length;
        const stdDev = Math.sqrt(variance);
        // 0 dBm de desviación -> 1.0; 12 dBm o más -> 0.0
        const stability = Math.max(0, Math.min(1, 1 - stdDev / 12));
        return Number(stability.toFixed(2));
    }

    /**
     * RSSI promedio del historial (ventana RSSI_HISTORY_MAX). Si no hay
     * historial todavía, devuelve el valor crudo de la lectura actual.
     */
    private static getStableRssi(id: string, fallback: number): number {
        const history = this.rssiHistory.get(id);
        if (!history || history.length === 0) return fallback;
        const mean =
            history.reduce((acc, v) => acc + v, 0) / history.length;
        return Number(mean.toFixed(1));
    }

    private static normalizeDegrees(value: number): number {
        return ((value % 360) + 360) % 360;
    }

    /**
     * Mantiene el rumbo absoluto asociado a la mejor señal observada.
     * Sin AoA real no conocemos el bearing físico del emisor; esta pista sólo
     * indica en qué orientación del operador se observó mayor intensidad.
     */
    private static resolveObservedHeading(
        id: string,
        previousHeading: number | undefined,
        currentAzimuth: number,
        signalStrength: number
    ): {
        heading: number;
        accuracy: RadarTarget["bearingAccuracy"];
    } {
        const normalizedAzimuth = this.normalizeDegrees(currentAzimuth);
        const previousBest = this.bestSignalHistory.get(id);

        if (
            previousBest == null ||
            signalStrength >= previousBest + 4 ||
            previousHeading == null
        ) {
            this.bestSignalHistory.set(id, signalStrength);
            return {
                heading: normalizedAzimuth,
                accuracy: "observed"
            };
        }

        return {
            heading: this.normalizeDegrees(previousHeading),
            accuracy: "observed"
        };
    }

    private static formatApproxDistance(distance: number): string {
        if (distance < 1) {
            return `≈ ${Math.max(10, Math.round(distance * 100))} cm`;
        }
        if (distance < 10) {
            return `≈ ${distance.toFixed(1)} m`;
        }
        return `≈ ${Math.round(distance)} m`;
    }

    private static getProximity(
        distance: number
    ): NonNullable<RadarTarget["proximity"]> {
        if (distance <= 1.5) return "very_near";
        if (distance <= 5) return "near";
        if (distance <= 12) return "medium";
        return "far";
    }

    /**
     * Calcula la confianza (0-100) combinando:
     * - observaciones (más = mejor)
     * - intensidad de señal
     * - estabilidad del RSSI
     * - fuente híbrida (BT + WiFi)
     * Aplicado con EMA para evitar saltos bruscos.
     */
    private static computeConfidence(
        previous: number,
        observations: number,
        signalStrength: number,
        stability: number,
        source: RadarTarget["source"]
    ): number {
        const obsFactor = Math.min(1, observations / 15); // se satura a 15 observaciones
        const signalFactor = signalStrength / 100;
        const sourceBonus = source === "hybrid" ? 0.1 : 0;
        const raw =
            (obsFactor * 0.4 + signalFactor * 0.35 + stability * 0.25 + sourceBonus) *
            100;
        const smoothed =
            previous * (1 - this.CONFIDENCE_SMOOTHING) +
            raw * this.CONFIDENCE_SMOOTHING;
        return Math.max(0, Math.min(100, Math.round(smoothed)));
    }

    /**
     * Marca como inactivos los objetivos sin observaciones recientes.
     * También descarta históricos de distancia/RSSI obsoletos.
     */
    private static expireStaleTargets(): void {
        const now = Date.now();
        for (const target of this.targets) {
            if (now - target.lastSeen > this.TARGET_STALE_MS) {
                target.active = false;
            }
        }
        // Limpia historiales de objetivos que ya no existen.
        const liveIds = new Set(this.targets.map(t => t.id));
        for (const id of Array.from(this.distanceHistory.keys())) {
            if (!liveIds.has(id)) this.distanceHistory.delete(id);
        }
        for (const id of Array.from(this.rssiHistory.keys())) {
            if (!liveIds.has(id)) this.rssiHistory.delete(id);
        }
        for (const id of Array.from(this.bestSignalHistory.keys())) {
            if (!liveIds.has(id)) this.bestSignalHistory.delete(id);
        }
    }

        /**
     * ==========================================================
     * OBTENER TODOS LOS OBJETIVOS
     * ==========================================================
     */

    static getTargets(): RadarTarget[] {

        return [...this.targets];

    }

    /**
     * ==========================================================
     * OBTENER UN OBJETIVO
     * ==========================================================
     */

    static getTarget(id: string): RadarTarget | undefined {

        return this.targets.find(target => target.id === id);

    }

    /**
     * ==========================================================
     * CANTIDAD DE OBJETIVOS
     * ==========================================================
     */

    static getTargetCount(): number {

        return this.targets.length;

    }

    /**
     * ==========================================================
     * OBJETIVO MÁS CERCANO
     * ==========================================================
     */

    static getNearestTarget(): RadarTarget | null {

        if (this.targets.length === 0) {

            return null;

        }

        return this.targets.reduce((nearest, current) => {

            // Solo se consideran objetivos activos. Si el actual está
            // inactivo y el "nearest" no, conservamos nearest.
            if (!current.active && nearest.active) return nearest;
            if (current.active && !nearest.active) return current;

            const distDelta = current.estimatedDistance - nearest.estimatedDistance;
            if (Math.abs(distDelta) < 0.5) {
                // Empate cercano: gana quien tenga mayor confianza.
                return current.confidence > nearest.confidence ? current : nearest;
            }
            return distDelta < 0 ? current : nearest;

        });

    }

    /**
     * ==========================================================
     * OBJETIVOS ACTIVOS
     * ==========================================================
     */

    static getActiveTargets(): RadarTarget[] {

        return this.targets.filter(target => target.active);

    }

    /**
     * ==========================================================
     * LIMPIAR OBJETIVOS
     * ==========================================================
     */

    static clearTargets(): void {

        this.targets = [];
        this.distanceHistory.clear();
        this.rssiHistory.clear();
        this.bestSignalHistory.clear();

    }

        /**
     * ==========================================================
     * ¿EL MOTOR ESTÁ ACTIVO?
     * ==========================================================
     */

    static isRunning(): boolean {

        return this.running;

    }

    /**
     * ==========================================================
     * ESTADO GENERAL DEL MOTOR
     * ==========================================================
     */

    static getStatus() {

        return {

            running: this.running,

            targets: this.targets.length,

            activeTargets: this.getActiveTargets().length,

            nearestTarget: this.getNearestTarget(),

            updateRate: this.UPDATE_RATE

        };

    }

    /**
     * ==========================================================
     * DETENER MOTOR
     * ==========================================================
     */

    static stop(): void {

        if (this.updateInterval) {

            clearInterval(this.updateInterval);

            this.updateInterval = null;

        }

        SoundService.stop();

        BluetoothService.stopScan();

        WifiService.stop();

        GPSService.stopAll();

        SensorService.stop();

        this.running = false;

    }

    /**
     * ==========================================================
     * REINICIAR MOTOR
     * ==========================================================
     */

    static reset(): void {

        this.stop();

        this.clearTargets();

    }

        /**
     * ==========================================================
     * LIBERAR RECURSOS
     * ==========================================================
     */

    static destroy(): void {

        this.stop();

        this.clearTargets();

    }

}


