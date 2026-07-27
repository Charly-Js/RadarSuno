import RNFS from "react-native-fs";
import { MissionRecord } from "../interfaces/MissionRecord";

const escapePdfText = (value: string) =>
    value
        .replace(/\\/g, "\\\\")
        .replace(/\(/g, "\\(")
        .replace(/\)/g, "\\)");

const wrapLine = (line: string, width = 86): string[] => {
    if (line.length <= width) {
        return [line];
    }

    const words = line.split(" ");
    const lines: string[] = [];
    let current = "";

    words.forEach(word => {
        const next = current ? `${current} ${word}` : word;
        if (next.length > width) {
            if (current) {
                lines.push(current);
            }
            current = word;
        } else {
            current = next;
        }
    });

    if (current) {
        lines.push(current);
    }

    return lines;
};

const buildLines = (record: MissionRecord): string[] => {
    const operator = record.operatorProfile;
    const elapsedMinutes = Math.round(record.elapsedTime / 600) / 100;
    const firstPoint = record.path[0];
    const lastPoint = record.path[record.path.length - 1];

    const lines = [
        "RADARSURO - REGISTRO DE MISION",
        "",
        `ID: ${record.id}`,
        `Estado: ${record.status}`,
        `Resultado: ${record.outcome ?? "en curso"}`,
        `Tipo de rescate: ${record.rescueType}`,
        `Inicio: ${new Date(record.startTime).toLocaleString()}`,
        `Fin: ${record.endTime ? new Date(record.endTime).toLocaleString() : "Sin cierre"}`,
        `Duracion: ${elapsedMinutes.toFixed(2)} min`,
        `Distancia recorrida: ${record.totalDistance.toFixed(1)} m`,
        "",
        "OPERADOR",
        `Nombre: ${operator?.fullName ?? "No registrado"}`,
        `Documento/ID: ${operator?.documentId ?? "No registrado"}`,
        `Organizacion: ${operator?.organization ?? "No registrada"}`,
        `Pais/Zona: ${operator?.country ?? "No registrada"}`,
        `Rol: ${operator?.role ?? "No registrado"}`,
        "",
        "RESUMEN OPERATIVO",
        `Puntos GPS: ${record.path.length}`,
        `Muestras de sensores: ${record.sensorSamples.length}`,
        `Objetivos detectados: ${record.targets.length}`,
        `Objetivo fijado inicial: ${record.pinnedTargetIds?.join(", ") || "Ninguno"}`,
        `Notas: ${record.notes.join(" | ") || "Sin notas"}`,
        "",
        "UBICACION",
        `Primera coordenada: ${firstPoint ? `${firstPoint.latitude}, ${firstPoint.longitude}` : "No disponible"}`,
        `Ultima coordenada: ${lastPoint ? `${lastPoint.latitude}, ${lastPoint.longitude}` : "No disponible"}`,
        "",
        "OBJETIVOS",
        ...record.targets.slice(0, 30).map(target =>
            `${target.id} | ${target.source} | ${target.name || target.bluetooth?.name || target.wifi?.ssid || "Objetivo"} | señal ${target.signalStrength} | distancia ${target.estimatedDistance.toFixed(1)} m | obs ${target.observations}`
        ),
        "",
        "RUTA GPS RECIENTE",
        ...record.path.slice(-80).map(point =>
            `${new Date(point.timestamp).toLocaleTimeString()} | ${point.latitude.toFixed(6)}, ${point.longitude.toFixed(6)} | acc ${point.accuracy ?? "-"} m | vel ${point.speed ?? "-"}`
        )
    ];

    return lines.flatMap(line => wrapLine(line));
};

export default class MissionPdfService {
    static async exportRecord(record: MissionRecord): Promise<string> {
        const lines = buildLines(record);
        const pageHeight = 792;
        const lineHeight = 14;
        const linesPerPage = 48;
        const pages: string[][] = [];

        for (let index = 0; index < lines.length; index += linesPerPage) {
            pages.push(lines.slice(index, index + linesPerPage));
        }

        const objects: string[] = [];
        const pageObjectIds: number[] = [];

        const addObject = (body: string) => {
            objects.push(body);
            return objects.length;
        };

        const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

        pages.forEach(pageLines => {
            const stream = [
                "BT",
                "/F1 10 Tf",
                "50 748 Td",
                ...pageLines.flatMap((line, index) => [
                    index === 0 ? "" : `0 -${lineHeight} Td`,
                    `(${escapePdfText(line)}) Tj`
                ]).filter(Boolean),
                "ET"
            ].join("\n");

            const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
            const pageId = addObject(`<< /Type /Page /Parent 0 0 R /MediaBox [0 0 612 ${pageHeight}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
            pageObjectIds.push(pageId);
        });

        const pagesId = objects.length + 1;
        const catalogId = objects.length + 2;

        pageObjectIds.forEach(pageId => {
            objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
        });

        objects.push(`<< /Type /Pages /Kids [${pageObjectIds.map(id => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`);
        objects.push(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

        let pdf = "%PDF-1.4\n";
        const offsets: number[] = [0];

        objects.forEach((body, index) => {
            offsets.push(pdf.length);
            pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
        });

        const xrefOffset = pdf.length;
        pdf += `xref\n0 ${objects.length + 1}\n`;
        pdf += "0000000000 65535 f \n";
        offsets.slice(1).forEach(offset => {
            pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
        });
        pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

        const fileName = `RadarSuRo_${record.id}.pdf`.replace(/[^a-zA-Z0-9_.-]/g, "_");
        const path = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(path, pdf, "utf8");
        return `file://${path}`;
    }
}
