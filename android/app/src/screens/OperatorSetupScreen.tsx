import React, { useMemo, useState } from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    Modal,
    FlatList
} from "react-native";
import {
    DocumentType,
    Language,
    OperatorProfile
} from "../interfaces/OperatorProfile";

interface OperatorSetupScreenProps {
    initialProfile?: OperatorProfile | null;
    onSave: (profile: OperatorProfile) => void;
}

const COUNTRIES = [
    "Venezuela", "Colombia", "Ecuador", "Perú", "Brasil",
    "Bolivia", "Chile", "Argentina", "Uruguay", "Paraguay",
    "México", "Estados Unidos", "España", "Panamá", "Costa Rica",
    "República Dominicana", "Guatemala", "Honduras", "El Salvador",
    "Nicaragua", "Cuba", "Otro"
];

const DOCUMENT_TYPES: DocumentType[] = [
    "Cédula de ciudadanía",
    "Cédula de extranjería",
    "Pasaporte",
    "DNI",
    "Licencia de conducir",
    "Identificación militar",
    "Identificación de bombero",
    "Otro"
];

const RESCUE_TYPES = [
    "Terremoto / colapso estructural",
    "Inundación",
    "Deslizamiento",
    "Búsqueda urbana",
    "Búsqueda rural",
    "Apoyo comunitario"
];

const ROLES = [
    "Rescatista", "Médico", "Enfermero", "Paramédico",
    "Coordinador", "Jefe de brigada", "Bombero", "Piloto de dron",
    "Operador de comunicaciones", "Otro"
];

const LANGUAGES: { code: Language; label: string }[] = [
    { code: "es", label: "Español" },
    { code: "en", label: "English" },
    { code: "pt", label: "Português" }
];

/**
 * Genera un identificador operativo aleatorio tipo RS-AB12CD.
 * Este ID es el que aparecerá en el Header de la app y se usará
 * más adelante como clave de sincronización.
 */
const generateOperatorId = (): string => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "RS-";
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
};

interface PickerProps<T extends string> {
    label: string;
    value: T;
    options: readonly T[];
    onChange: (value: T) => void;
}

function Picker<T extends string>({ label, value, options, onChange }: PickerProps<T>) {
    const [open, setOpen] = useState(false);
    return (
        <View style={styles.pickerWrapper}>
            <Text style={styles.pickerLabel}>{label}</Text>
            <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setOpen(true)}
            >
                <Text style={styles.pickerButtonText}>{value}</Text>
                <Text style={styles.pickerChevron}>▾</Text>
            </TouchableOpacity>
            <Modal
                visible={open}
                animationType="fade"
                transparent
                onRequestClose={() => setOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                >
                    <View style={styles.modalSheet}>
                        <Text style={styles.modalTitle}>{label}</Text>
                        <FlatList
                            data={options as unknown as string[]}
                            keyExtractor={(item) => item}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.modalItem,
                                        item === value && styles.modalItemActive
                                    ]}
                                    onPress={() => {
                                        onChange(item as T);
                                        setOpen(false);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.modalItemText,
                                            item === value && styles.modalItemTextActive
                                        ]}
                                    >
                                        {item}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

export default function OperatorSetupScreen({
    initialProfile = null,
    onSave
}: OperatorSetupScreenProps) {
    const [fullName, setFullName] = useState(initialProfile?.fullName ?? "");
    const [phone, setPhone] = useState(initialProfile?.phone ?? "");
    const [documentType, setDocumentType] = useState<DocumentType>(
        initialProfile?.documentType ?? "Cédula de ciudadanía"
    );
    const [documentId, setDocumentId] = useState(initialProfile?.documentId ?? "");
    const [country, setCountry] = useState(initialProfile?.country ?? "Venezuela");
    const [city, setCity] = useState(initialProfile?.city ?? "");
    const [teamName, setTeamName] = useState(initialProfile?.teamName ?? "");
    const [organization, setOrganization] = useState(initialProfile?.organization ?? "");
    const [role, setRole] = useState(initialProfile?.role ?? "Rescatista");
    const [language, setLanguage] = useState<Language>(initialProfile?.language ?? "es");
    const [rescueType, setRescueType] = useState(initialProfile?.rescueType ?? RESCUE_TYPES[0]);
    const [error, setError] = useState("");

    // ID auto-generado persistente: se conserva entre ediciones.
    const operatorId = useMemo(
        () => initialProfile?.operatorId ?? generateOperatorId(),
        [initialProfile?.operatorId]
    );

    const save = () => {
        if (!fullName.trim()) {
            setError("El nombre completo es obligatorio.");
            return;
        }
        if (!documentId.trim()) {
            setError("El número de documento es obligatorio.");
            return;
        }
        if (!teamName.trim()) {
            setError("Indica el nombre del equipo de rescate.");
            return;
        }
        if (!country.trim()) {
            setError("Indica el país.");
            return;
        }
        if (!city.trim()) {
            setError("Indica la ciudad o zona operativa.");
            return;
        }

        onSave({
            operatorId,
            fullName: fullName.trim(),
            phone: phone.trim(),
            documentType,
            documentId: documentId.trim(),
            country: country.trim(),
            city: city.trim(),
            teamName: teamName.trim(),
            organization: organization.trim() || "No especificada",
            role,
            language,
            rescueType,
            createdAt: initialProfile?.createdAt ?? Date.now()
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Registro del operador</Text>
            <Text style={styles.description}>
                Configure su perfil. Se anexará a cada misión y a los PDF de evidencia.
            </Text>

            {/* ID operativo generado automáticamente */}
            <View style={styles.idCard}>
                <Text style={styles.idLabel}>IDENTIFICADOR OPERATIVO</Text>
                <Text style={styles.idValue}>{operatorId}</Text>
                <Text style={styles.idHint}>
                    Generado automáticamente por la aplicación.
                </Text>
            </View>

            <Text style={styles.sectionTitle}>Datos personales</Text>
            <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Nombre completo"
                placeholderTextColor="#64748B"
            />
            <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Número de contacto"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
            />

            <Picker
                label="Tipo de documento"
                value={documentType}
                options={DOCUMENT_TYPES}
                onChange={setDocumentType}
            />
            <TextInput
                style={styles.input}
                value={documentId}
                onChangeText={setDocumentId}
                placeholder="Número de documento"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
            />

            <Text style={styles.sectionTitle}>Ubicación operativa</Text>
            <Picker
                label="País"
                value={country}
                options={COUNTRIES}
                onChange={setCountry}
            />
            <TextInput
                style={styles.input}
                value={city}
                onChangeText={setCity}
                placeholder="Ciudad / zona de operaciones"
                placeholderTextColor="#64748B"
            />

            <Text style={styles.sectionTitle}>Equipo y rol</Text>
            <TextInput
                style={styles.input}
                value={teamName}
                onChangeText={setTeamName}
                placeholder="Nombre del equipo de rescate"
                placeholderTextColor="#64748B"
            />
            <TextInput
                style={styles.input}
                value={organization}
                onChangeText={setOrganization}
                placeholder="Organización / brigada (opcional)"
                placeholderTextColor="#64748B"
            />
            <Picker
                label="Rol operativo"
                value={role}
                options={ROLES}
                onChange={setRole}
            />

            <Text style={styles.sectionTitle}>Preferencias</Text>
            <Picker
                label="Idioma"
                value={LANGUAGES.find(l => l.code === language)?.label ?? "Español"}
                options={LANGUAGES.map(l => l.label)}
                onChange={(label) => {
                    const found = LANGUAGES.find(l => l.label === label);
                    if (found) setLanguage(found.code);
                }}
            />

            <Text style={styles.sectionTitle}>Tipo de rescate</Text>
            <View style={styles.optionList}>
                {RESCUE_TYPES.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.optionButton, rescueType === type && styles.optionButtonActive]}
                        onPress={() => setRescueType(type)}
                    >
                        <Text style={[styles.optionText, rescueType === type && styles.optionTextActive]}>
                            {type}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.saveButton} onPress={save}>
                <Text style={styles.saveText}>Guardar y continuar</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827"
    },
    content: {
        padding: 20,
        paddingBottom: 36
    },
    title: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 8
    },
    description: {
        color: "#A5B4C3",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 16
    },
    idCard: {
        backgroundColor: "#0F172A",
        borderColor: "#10B981",
        borderWidth: 1,
        borderRadius: 12,
        padding: 14,
        marginBottom: 18,
        alignItems: "center"
    },
    idLabel: {
        color: "#6EE7B7",
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1,
        marginBottom: 4
    },
    idValue: {
        color: "#10B981",
        fontSize: 24,
        fontWeight: "800",
        letterSpacing: 2,
        marginBottom: 4
    },
    idHint: {
        color: "#64748B",
        fontSize: 11,
        textAlign: "center"
    },
    sectionTitle: {
        color: "#E2E8F0",
        fontSize: 14,
        fontWeight: "800",
        marginTop: 14,
        marginBottom: 10
    },
    input: {
        backgroundColor: "#0F172A",
        borderColor: "#1E293B",
        borderWidth: 1,
        borderRadius: 10,
        color: "#FFFFFF",
        paddingHorizontal: 14,
        paddingVertical: 12,
        marginBottom: 12
    },
    optionList: {
        gap: 8
    },
    optionButton: {
        borderWidth: 1,
        borderColor: "#1E293B",
        backgroundColor: "#0F172A",
        borderRadius: 10,
        padding: 12
    },
    optionButtonActive: {
        borderColor: "#10B981",
        backgroundColor: "#064E3B"
    },
    optionText: {
        color: "#CBD5E1",
        fontWeight: "600"
    },
    optionTextActive: {
        color: "#FFFFFF"
    },
    pickerWrapper: {
        marginBottom: 12
    },
    pickerLabel: {
        color: "#94A3B8",
        fontSize: 12,
        marginBottom: 4,
        fontWeight: "600"
    },
    pickerButton: {
        backgroundColor: "#0F172A",
        borderColor: "#1E293B",
        borderWidth: 1,
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center"
    },
    pickerButtonText: {
        color: "#FFFFFF",
        fontSize: 14
    },
    pickerChevron: {
        color: "#94A3B8",
        fontSize: 16
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "flex-end"
    },
    modalSheet: {
        backgroundColor: "#0F172A",
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingVertical: 16,
        maxHeight: "70%"
    },
    modalTitle: {
        color: "#E2E8F0",
        fontSize: 14,
        fontWeight: "700",
        paddingHorizontal: 18,
        paddingBottom: 10
    },
    modalItem: {
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: "#1E293B"
    },
    modalItemActive: {
        backgroundColor: "#064E3B"
    },
    modalItemText: {
        color: "#CBD5E1",
        fontSize: 15
    },
    modalItemTextActive: {
        color: "#FFFFFF",
        fontWeight: "700"
    },
    error: {
        color: "#FCA5A5",
        marginTop: 12
    },
    saveButton: {
        backgroundColor: "#10B981",
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: "center",
        marginTop: 18,
        elevation: 4
    },
    saveText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800"
    }
});
