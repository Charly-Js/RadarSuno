import { RadarTarget } from "./RadarTarget";
import { OperatorProfile } from "./OperatorProfile";

export type MissionOutcome = "completed" | "no_result" | "cancelled";

export interface MissionPathPoint {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number;
    speed?: number | null;
    heading?: number | null;
    timestamp: number;
}

export interface MissionSensorSample {
    timestamp: number;
    orientation: {
        azimuth: number;
        pitch: number;
        roll: number;
    };
    acceleration: {
        x: number;
        y: number;
        z: number;
    };
    moving: boolean;
}

export interface MissionEvidencePhoto {
    uri: string;
    fileName: string;
    capturedAt: number;
    watermarkText: string;
}

export interface MissionRecord {
    id: string;
    status: "running" | "finished";
    outcome: MissionOutcome | null;
    rescueType: string;
    operatorProfile: OperatorProfile | null;
    pinnedTargetIds: string[];
    startTime: number;
    endTime: number | null;
    elapsedTime: number;
    totalDistance: number;
    path: MissionPathPoint[];
    sensorSamples: MissionSensorSample[];
    targets: RadarTarget[];
    notes: string[];
    evidencePhoto?: MissionEvidencePhoto | null;
}
