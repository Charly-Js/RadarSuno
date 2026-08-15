import { PermissionsAndroid, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BluetoothService } from './BluetoothService';
import WifiService from './WifiService';
import { GPSService } from './GPSService';

type AndroidPermission = Parameters<typeof PermissionsAndroid.requestMultiple>[0][number];
const NEARBY_WIFI_DEVICES_PERMISSION = 'android.permission.NEARBY_WIFI_DEVICES' as AndroidPermission;
const POST_NOTIFICATIONS_PERMISSION = 'android.permission.POST_NOTIFICATIONS' as AndroidPermission;
const READ_MEDIA_IMAGES_PERMISSION = 'android.permission.READ_MEDIA_IMAGES' as AndroidPermission;

const STORAGE_KEYS = {
    bluetooth: '@RC:activation:bluetooth',
    wifi: '@RC:activation:wifi',
    gps: '@RC:activation:gps'
};

const OPTIONAL_PERMISSIONS: AndroidPermission[] = [
    PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE,
    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    PermissionsAndroid.PERMISSIONS.CALL_PHONE
];

export class PermissionService {
    private static getAndroidApiLevel(): number {
        return typeof Platform.Version === 'number'
            ? Platform.Version
            : Number.parseInt(Platform.Version, 10);
    }

    private static getRequiredPermissions(): AndroidPermission[] {
        const permissions: AndroidPermission[] = [
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
            PermissionsAndroid.PERMISSIONS.CAMERA
        ];

        if (this.getAndroidApiLevel() >= 31) {
            permissions.push(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            );
        }

        if (this.getAndroidApiLevel() >= 33) {
            permissions.push(
                NEARBY_WIFI_DEVICES_PERMISSION,
                POST_NOTIFICATIONS_PERMISSION,
                READ_MEDIA_IMAGES_PERMISSION
            );
        } else {
            permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            if (this.getAndroidApiLevel() <= 28) {
                permissions.push(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
            }
        }

        return permissions;
    }

    private static async hasLocationPermissions(): Promise<boolean> {
        const fine = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const coarse = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
        );
        return fine || coarse;
    }

    /**
     * ==========================================
     * SOLICITAR TODOS LOS PERMISOS
     * ==========================================
     */
    static async requestAllPermissions(): Promise<boolean> {

        if (Platform.OS !== 'android') {
            return false;
        }

        try {
            const requiredPermissions = this.getRequiredPermissions();
            const requiredResult = await PermissionsAndroid.requestMultiple(requiredPermissions);
            await PermissionsAndroid.requestMultiple(OPTIONAL_PERMISSIONS);

            const locationGranted =
                requiredResult[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
                requiredResult[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
            const cameraGranted =
                requiredResult[PermissionsAndroid.PERMISSIONS.CAMERA] === PermissionsAndroid.RESULTS.GRANTED;

            const bluetoothGranted =
                this.getAndroidApiLevel() >= 31
                    ? requiredResult[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
                      requiredResult[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED
                    : true;

            const nearbyWifiGranted =
                this.getAndroidApiLevel() >= 33
                    ? requiredResult[NEARBY_WIFI_DEVICES_PERMISSION] === PermissionsAndroid.RESULTS.GRANTED
                    : true;
            const notificationsGranted =
                this.getAndroidApiLevel() >= 33
                    ? requiredResult[POST_NOTIFICATIONS_PERMISSION] === PermissionsAndroid.RESULTS.GRANTED
                    : true;
            const storageGranted =
                this.getAndroidApiLevel() >= 33
                    ? requiredResult[READ_MEDIA_IMAGES_PERMISSION] === PermissionsAndroid.RESULTS.GRANTED
                    : requiredResult[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED &&
                      (this.getAndroidApiLevel() > 28 ||
                       requiredResult[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED);

            const requiredGranted = locationGranted && bluetoothGranted && nearbyWifiGranted && cameraGranted && notificationsGranted && storageGranted;

            if (!requiredGranted) {
                console.warn("PermissionService: Required permissions missing.");
            }

            return requiredGranted;

        } catch (error) {

            console.error("PermissionService:", error);

            return false;

        }

    }

    /**
     * ==========================================
     * VERIFICAR TODOS LOS PERMISOS
     * ==========================================
     */
    static async hasAllPermissions(): Promise<boolean> {

        if (Platform.OS !== 'android') {
            return false;
        }

        const locationGranted = await this.hasLocationPermissions();
        const cameraGranted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.CAMERA
        );
        const notificationsGranted =
            this.getAndroidApiLevel() >= 33
                ? await PermissionsAndroid.check(POST_NOTIFICATIONS_PERMISSION)
                : true;
        const storageGranted =
            this.getAndroidApiLevel() >= 33
                ? await PermissionsAndroid.check(READ_MEDIA_IMAGES_PERMISSION)
                : await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE) &&
                  (this.getAndroidApiLevel() > 28 ||
                   await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE));

        if (this.getAndroidApiLevel() >= 31) {
            const scanGranted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
            );
            const connectGranted = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
            );
            if (this.getAndroidApiLevel() >= 33) {
                const nearbyWifiGranted = await PermissionsAndroid.check(
                    NEARBY_WIFI_DEVICES_PERMISSION
                );
                return locationGranted && scanGranted && connectGranted && nearbyWifiGranted && cameraGranted && notificationsGranted && storageGranted;
            }

            return locationGranted && scanGranted && connectGranted && cameraGranted && notificationsGranted && storageGranted;
        }

        return locationGranted && cameraGranted && notificationsGranted && storageGranted;

    }

    static async getPermissionDetails() {
        const details: Record<string, boolean> = {
            fineLocation: await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION),
            coarseLocation: await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION),
            camera: await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA)
        };

        if (this.getAndroidApiLevel() >= 31) {
            details.bluetoothScan = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN);
            details.bluetoothConnect = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT);
        }

        if (this.getAndroidApiLevel() >= 33) {
            details.nearbyWifiDevices = await PermissionsAndroid.check(NEARBY_WIFI_DEVICES_PERMISSION);
            details.notifications = await PermissionsAndroid.check(POST_NOTIFICATIONS_PERMISSION);
            details.mediaImages = await PermissionsAndroid.check(READ_MEDIA_IMAGES_PERMISSION);
        } else {
            details.readStorage = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
            details.writeStorage = this.getAndroidApiLevel() > 28 ||
                await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
        }

        return details;
    }

    static async getStoredActivation(key: keyof typeof STORAGE_KEYS): Promise<boolean> {
        try {
            const value = await AsyncStorage.getItem(STORAGE_KEYS[key]);
            return value === 'true';
        } catch {
            return false;
        }
    }

    static async setStoredActivation(key: keyof typeof STORAGE_KEYS): Promise<void> {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS[key], 'true');
        } catch {
            // ignore write failures
        }
    }

    static async isBluetoothEnabled(): Promise<boolean> {
        return await BluetoothService.isEnabled();
    }

    static async isWifiEnabled(): Promise<boolean> {
        try {
            if (!WifiService.isRunning()) {
                await WifiService.start();
            }
            return WifiService.isEnabled() || WifiService.isRunning();
        } catch {
            return false;
        }
    }

    static async isGPSEnabled(): Promise<boolean> {
        return await GPSService.hasLocationPermission();
    }

    /**
     * ==========================================
     * ESTADO GENERAL DE LA MISIÓN
     * ==========================================
     */
    static async checkMissionReady(): Promise<boolean> {

        const permissions = await this.hasAllPermissions();
        const bluetooth = await this.isBluetoothEnabled();
        const wifi = await this.isWifiEnabled();
        const gps = await this.isGPSEnabled();

        return permissions && gps && (bluetooth || wifi);

    }

    /**
     * ==========================================
     * ESTADO COMPLETO
     * ==========================================
     */
    static async getMissionStatus() {

        const permissions = await this.hasAllPermissions();
        const bluetooth = await this.isBluetoothEnabled();
        const wifi = await this.isWifiEnabled();
        const gps = await this.isGPSEnabled();

        const rememberedBluetooth = await this.getStoredActivation('bluetooth');
        const rememberedWifi = await this.getStoredActivation('wifi');
        const rememberedGps = await this.getStoredActivation('gps');
        const details = await this.getPermissionDetails();

        const scanReady = bluetooth || wifi;
        const ready = permissions && gps && scanReady;

        return {

            permissions,

            permissionDetails: details,

            bluetooth,

            gps,

            wifi,

            compass: false,

            internet: false,

            scanReady,

            ready,

            startBlockedReason: ready
                ? ""
                : !permissions
                    ? "Faltan permisos requeridos."
                    : !gps
                        ? "Falta permiso de ubicación."
                        : !scanReady
                            ? "Active Bluetooth o WiFi para iniciar el escaneo."
                            : "La misión aún no está lista.",

            remembered: {
                bluetooth: rememberedBluetooth,
                wifi: rememberedWifi,
                gps: rememberedGps
            }

        };

    }

    static async rememberActiveServices(): Promise<void> {
        if (await this.isBluetoothEnabled()) {
            await this.setStoredActivation('bluetooth');
        }
        if (await this.isWifiEnabled()) {
            await this.setStoredActivation('wifi');
        }
        if (await this.isGPSEnabled()) {
            await this.setStoredActivation('gps');
        }
    }

    /**
     * ==========================================
     * DIAGNÓSTICO
     * ==========================================
     */
    static async runDiagnostics() {

        return {

            permissions: await this.hasAllPermissions(),

            timestamp: new Date().toISOString()

        };

    }

}
