import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Linking, Alert, ScrollView, TextInput } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface EmergencyContact {
    id: string;
    name: string;
    phone: string;
    role: string;
}

const CONTACTS_KEY = "@RC:emergency_contacts";

const DEFAULT_CONTACTS: EmergencyContact[] = [
    { id: "pc-ve", name: "Protección Civil", phone: "911", role: "Emergencia local" },
    { id: "fire", name: "Bomberos", phone: "911", role: "Rescate / incendio" },
    { id: "medical", name: "Emergencias médicas", phone: "911", role: "Atención médica" }
];

export default function CallsScreen() {
    const [contacts, setContacts] = useState<EmergencyContact[]>(DEFAULT_CONTACTS);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState("");

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(CONTACTS_KEY);
                setContacts(raw ? JSON.parse(raw) : DEFAULT_CONTACTS);
            } catch {
                setContacts(DEFAULT_CONTACTS);
            }
        })();
    }, []);

    useEffect(() => {
        AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts)).catch(() => {});
    }, [contacts]);

    const handleCall = async (phoneNumber: string) => {
        const url = `tel:${phoneNumber}`;
        const supported = await Linking.canOpenURL(url);

        if (!supported) {
            Alert.alert("No disponible", "El dispositivo no puede realizar llamadas telefónicas.");
            return;
        }

        Linking.openURL(url).catch(() => {
            Alert.alert("Error", "No se pudo iniciar la llamada.");
        });
    };

    const addContact = () => {
        if (!name.trim() || !phone.trim()) {
            Alert.alert("Datos faltantes", "Ingrese nombre y teléfono.");
            return;
        }

        setContacts(prev => [
            {
                id: `${Date.now()}`,
                name: name.trim(),
                phone: phone.trim(),
                role: role.trim() || "Contacto de emergencia"
            },
            ...prev
        ]);
        setName("");
        setPhone("");
        setRole("");
    };

    const removeContact = (id: string) => {
        setContacts(prev => prev.filter(contact => contact.id !== id));
    };

    const resetContacts = () => {
        setContacts(DEFAULT_CONTACTS);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Agenda de emergencias</Text>
            <Text style={styles.description}>
                Personalice estos contactos según el país, ciudad, brigada o mando operativo.
            </Text>

            <View style={styles.formCard}>
                <Text style={styles.formTitle}>Añadir contacto</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nombre" placeholderTextColor="#64748B" />
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Teléfono" placeholderTextColor="#64748B" keyboardType="phone-pad" />
                <TextInput style={styles.input} value={role} onChangeText={setRole} placeholder="Rol / institución" placeholderTextColor="#64748B" />
                <TouchableOpacity style={styles.addButton} onPress={addContact}>
                    <Text style={styles.buttonText}>GUARDAR CONTACTO</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetButton} onPress={resetContacts}>
                    <Text style={styles.buttonText}>RESTAURAR PREDETERMINADOS</Text>
                </TouchableOpacity>
            </View>

            {contacts.map(contact => (
                <View key={contact.id} style={styles.contactCard}>
                    <View style={styles.contactInfo}>
                        <Text style={styles.contactName} numberOfLines={2}>{contact.name}</Text>
                        <Text style={styles.contactRole}>{contact.role}</Text>
                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                    </View>
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.callButton} onPress={() => handleCall(contact.phone)}>
                            <Text style={styles.callText}>LLAMAR</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.deleteButton} onPress={() => removeContact(contact.id)}>
                            <Text style={styles.callText}>BORRAR</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827"
    },
    content: {
        padding: 16,
        paddingBottom: 28
    },
    title: {
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 8
    },
    description: {
        color: "#94A3B8",
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20
    },
    formCard: {
        backgroundColor: "#0F172A",
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#1E293B"
    },
    formTitle: {
        color: "#FFFFFF",
        fontWeight: "800",
        marginBottom: 10
    },
    input: {
        backgroundColor: "#111827",
        borderColor: "#1E293B",
        borderWidth: 1,
        borderRadius: 10,
        color: "#FFFFFF",
        paddingHorizontal: 12,
        paddingVertical: 10,
        marginBottom: 10
    },
    addButton: {
        backgroundColor: "#10B981",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 12,
        marginTop: 2
    },
    resetButton: {
        backgroundColor: "#334155",
        borderRadius: 10,
        alignItems: "center",
        paddingVertical: 11,
        marginTop: 8
    },
    buttonText: {
        color: "#FFFFFF",
        fontWeight: "800",
        fontSize: 12
    },
    contactCard: {
        backgroundColor: "#0F172A",
        padding: 16,
        borderRadius: 12,
        marginBottom: 14,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12
    },
    contactInfo: {
        flex: 1
    },
    contactName: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700"
    },
    contactRole: {
        color: "#94A3B8",
        fontSize: 12,
        marginTop: 4
    },
    contactPhone: {
        color: "#A5B4C3",
        fontSize: 12,
        marginTop: 2
    },
    actions: {
        gap: 8
    },
    callButton: {
        backgroundColor: "#10B981",
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 10,
        minWidth: 88,
        alignItems: "center"
    },
    deleteButton: {
        backgroundColor: "#EF4444",
        paddingVertical: 9,
        paddingHorizontal: 14,
        borderRadius: 10,
        minWidth: 88,
        alignItems: "center"
    },
    callText: {
        color: "#FFFFFF",
        fontWeight: "700",
        fontSize: 12
    }
});
