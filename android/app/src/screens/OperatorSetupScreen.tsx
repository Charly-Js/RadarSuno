import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { OperatorProfile } from "../interfaces/OperatorProfile";

interface OperatorSetupScreenProps {
    initialProfile?: OperatorProfile | null;
    onSave: (profile: OperatorProfile) => void;
}

const RESCUE_TYPES = [
    "Terremoto / colapso estructural",
    "Inundación",
    "Deslizamiento",
    "Búsqueda urbana",
    "Búsqueda rural",
    "Apoyo comunitario"
];

export default function OperatorSetupScreen({ initialProfile = null, onSave }: OperatorSetupScreenProps) {
    const [fullName, setFullName] = useState(initialProfile?.fullName ?? "");
    const [documentId, setDocumentId] = useState(initialProfile?.documentId ?? "");
    const [organization, setOrganization] = useState(initialProfile?.organization ?? "");
    const [country, setCountry] = useState(initialProfile?.country ?? "Venezuela");
    const [role, setRole] = useState(initialProfile?.role ?? "Rescatista");
    const [rescueType, setRescueType] = useState(initialProfile?.rescueType ?? RESCUE_TYPES[0]);
    const [error, setError] = useState("");

    const save = () => {
        if (!fullName.trim() || !documentId.trim() || !country.trim()) {
            setError("Nombre, documento y país/zona son obligatorios.");
            return;
        }

        onSave({
            fullName: fullName.trim(),
            documentId: documentId.trim(),
            organization: organization.trim() || "No especificada",
            country: country.trim(),
            role: role.trim() || "Operador",
            rescueType,
            createdAt: initialProfile?.createdAt ?? Date.now()
        });
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Registro del operador</Text>
            <Text style={styles.description}>
                Este registro se anexará a cada misión y a los PDF de evidencia.
            </Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Nombre completo" placeholderTextColor="#64748B" />
            <TextInput style={styles.input} value={documentId} onChangeText={setDocumentId} placeholder="Documento / identificación" placeholderTextColor="#64748B" />
            <TextInput style={styles.input} value={organization} onChangeText={setOrganization} placeholder="Organización / brigada" placeholderTextColor="#64748B" />
            <TextInput style={styles.input} value={country} onChangeText={setCountry} placeholder="País / zona" placeholderTextColor="#64748B" />
            <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="Rol operativo" placeholderTextColor="#64748B" />

            <Text style={styles.sectionTitle}>Tipo de rescate</Text>
            <View style={styles.optionList}>
                {RESCUE_TYPES.map(type => (
                    <TouchableOpacity
                        key={type}
                        style={[styles.optionButton, rescueType === type && styles.optionButtonActive]}
                        onPress={() => setRescueType(type)}
                    >
                        <Text style={[styles.optionText, rescueType === type && styles.optionTextActive]}>{type}</Text>
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
        marginBottom: 18
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
    sectionTitle: {
        color: "#E2E8F0",
        fontWeight: "700",
        marginTop: 6,
        marginBottom: 10
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
    error: {
        color: "#FCA5A5",
        marginTop: 12
    },
    saveButton: {
        backgroundColor: "#10B981",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        marginTop: 18
    },
    saveText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800"
    }
});

