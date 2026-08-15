import RNFS from "react-native-fs";
import { MissionEvidencePhoto, MissionRecord } from "../interfaces/MissionRecord";

const ROOT_DIR = `${RNFS.DocumentDirectoryPath}/RadarSuRo`;
const MISSIONS_DIR = `${ROOT_DIR}/missions`;
const PHOTOS_DIR = `${ROOT_DIR}/photos`;

const ensureDirectories = async () => {
    await RNFS.mkdir(ROOT_DIR);
    await RNFS.mkdir(MISSIONS_DIR);
    await RNFS.mkdir(PHOTOS_DIR);
};

const sanitizeFilePart = (value: string) =>
    value.replace(/[^a-zA-Z0-9_.-]/g, "_");

export default class MissionFileService {
    static async saveEvidencePhoto(
        sourceUri: string,
        missionId: string,
        watermarkText: string
    ): Promise<MissionEvidencePhoto> {
        await ensureDirectories();

        const capturedAt = Date.now();
        const fileName = `${sanitizeFilePart(missionId)}_${capturedAt}.jpg`;
        const destination = `${PHOTOS_DIR}/${fileName}`;
        const cleanSource = sourceUri.replace("file://", "");

        await RNFS.copyFile(cleanSource, destination);

        return {
            uri: `file://${destination}`,
            fileName,
            capturedAt,
            watermarkText
        };
    }

    static async persistMissionJson(record: MissionRecord): Promise<void> {
        await ensureDirectories();

        const missionJsonPath = `${MISSIONS_DIR}/${sanitizeFilePart(record.id)}.json`;
        await RNFS.writeFile(
            missionJsonPath,
            JSON.stringify(record, null, 2),
            "utf8"
        );
    }

    static async persistGeneralIndex(records: MissionRecord[]): Promise<void> {
        await ensureDirectories();

        const index = {
            generatedAt: new Date().toISOString(),
            totalMissions: records.length,
            missions: records.map(record => ({
                id: record.id,
                status: record.status,
                outcome: record.outcome,
                rescueType: record.rescueType,
                operatorId: record.operatorProfile?.operatorId ?? null,
                operatorName: record.operatorProfile?.fullName ?? null,
                startTime: record.startTime,
                endTime: record.endTime,
                elapsedTime: record.elapsedTime,
                totalDistance: record.totalDistance,
                targetCount: record.targets.length,
                pathPoints: record.path.length,
                evidencePhoto: record.evidencePhoto ?? null
            }))
        };

        await RNFS.writeFile(
            `${ROOT_DIR}/missions_general.json`,
            JSON.stringify(index, null, 2),
            "utf8"
        );
    }
}
