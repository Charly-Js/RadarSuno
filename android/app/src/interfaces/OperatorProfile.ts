/**
 * ==========================================================
 * RADARSUR — Perfil del operador
 * ----------------------------------------------------------
 * Datos personales y operativos del rescatista. Se anexan a
 * cada misión y a los PDF de evidencia.
 * ==========================================================
 */

export type DocumentType =
    | "Cédula de ciudadanía"
    | "Cédula de extranjería"
    | "Pasaporte"
    | "DNI"
    | "Licencia de conducir"
    | "Identificación militar"
    | "Identificación de bombero"
    | "Otro";

export type Language = "es" | "en" | "pt";

export interface OperatorProfile {
    /**
     * Identificador único generado por la app (formato RS-XXXXXX).
     * Sirve como clave operativa para sincronizar misiones entre
     * dispositivos sin exponer datos personales.
     */
    operatorId: string;

    /** Nombre completo */
    fullName: string;

    /** Número de teléfono de contacto */
    phone: string;

    /** Tipo de documento de identificación */
    documentType: DocumentType;

    /** Número del documento */
    documentId: string;

    /** País donde opera (ej. Venezuela, Colombia, ...) */
    country: string;

    /** Ciudad / zona operativa */
    city: string;

    /** Nombre del equipo de rescate */
    teamName: string;

    /** Organización a la que pertenece (opcional) */
    organization: string;

    /** Rol operativo (Rescatista, Médico, Coordinador, ...) */
    role: string;

    /** Idioma preferido de la app */
    language: Language;

    /** Tipo de rescate por defecto */
    rescueType: string;

    /** Marca de tiempo de creación */
    createdAt: number;
}
