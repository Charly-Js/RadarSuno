import React from "react";
import { Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";

interface TermsScreenProps {
    onAccept?: () => void;
    accepted?: boolean;
}

export default function TermsScreen({ onAccept, accepted = false }: TermsScreenProps) {
    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>Términos, condiciones y protocolo de uso</Text>
            <Text style={styles.subtitle}>RadarSuRo - Herramienta comunitaria de apoyo a búsqueda</Text>
            <Text style={styles.sectionTitle}>Creadores</Text>
            <Text style={styles.paragraph}>RadarSuRo fue desarrollado como una herramienta de apoyo para comunidades, brigadas, voluntarios y equipos de rescate. Su objetivo es aportar información de proximidad y registro operativo, especialmente en contextos donde los recursos son limitados.</Text>
            <Text style={styles.sectionTitle}>Alcance real de la herramienta</Text>
            <Text style={styles.paragraph}>RadarSuRo no localiza personas por sí solo ni garantiza encontrar dispositivos. Los teléfonos modernos pueden ocultar señales, apagar radios, cambiar identificadores, limitar Bluetooth, bloquear escaneos WiFi o quedarse sin batería. La aplicación debe usarse como apoyo, no como única fuente de decisión.</Text>
            <Text style={styles.paragraph}>La información de Bluetooth, WiFi, GPS, sensores y mapa de calor es aproximada. Una señal fuerte puede sugerir cercanía, pero también puede verse afectada por paredes, concreto, metal, humedad, interferencia, posición del rescatista, potencia del dispositivo y condiciones del terreno.</Text>
            <Text style={styles.sectionTitle}>Uso operativo recomendado</Text>
            <Text style={styles.paragraph}>Antes de iniciar una misión, el operador debe registrar su nombre, documento, organización, país o zona, rol y tipo de rescate. Esa información será anexada al registro descargable. Al iniciar misión, RadarSuRo empieza a guardar ruta GPS, objetivos detectados, sensores, hora de inicio, hora de cierre, notas y señales fijadas con PIN.</Text>
            <Text style={styles.paragraph}>Si se fija una señal con PIN, el operador debe moverse con calma, observar si la intensidad sube o baja, revisar obstáculos y confirmar con otros métodos de rescate. El mapa de calor muestra dónde se observaron mejores señales, no la ubicación exacta del sobreviviente.</Text>
            <Text style={styles.sectionTitle}>Mapa gratuito</Text>
            <Text style={styles.paragraph}>El mapa usa OpenStreetMap cuando hay conexión a internet. No requiere API key de pago. Si no hay señal de datos, el mapa puede no cargar mosaicos, pero el radar, las lecturas, los registros y las coordenadas GPS pueden seguir aportando información según los permisos y sensores disponibles.</Text>
            <Text style={styles.sectionTitle}>Privacidad y datos</Text>
            <Text style={styles.paragraph}>RadarSuRo guarda datos localmente en el dispositivo: perfil del operador, contactos configurados, aceptación de términos, objetivos detectados, ruta GPS y registros de misión. El usuario es responsable de custodiar, compartir o eliminar esos registros. No se debe publicar información sensible de víctimas o rescatistas sin autorización.</Text>
            <Text style={styles.sectionTitle}>Responsabilidad</Text>
            <Text style={styles.paragraph}>La app no reemplaza servicios oficiales de emergencia, protocolos SAR, evaluación estructural, equipos térmicos, equipos acústicos, perros de búsqueda, drones, comunicaciones de radio ni criterio profesional. Cualquier decisión crítica debe confirmarse con el mando operativo y el contexto de seguridad.</Text>
            <Text style={styles.sectionTitle}>Condición obligatoria</Text>
            <Text style={styles.paragraph}>Para usar RadarSuRo debe aceptar estos términos. Si no acepta, no tendrá acceso a las funciones de misión, radar, registros, llamadas o dispositivos. Al aceptar, declara que entiende las limitaciones, riesgos y responsabilidades del uso.</Text>
            <Text style={styles.sectionTitle}>Contacto</Text>
            <Text style={styles.paragraph}>Para reportar errores, mejoras o dudas, escriba a: Youbriefsoft@gmail.com.</Text>
            {onAccept ? (
                <TouchableOpacity
                    style={[styles.acceptButton, accepted && styles.acceptedButton]}
                    onPress={onAccept}
                    disabled={accepted}
                >
                    <Text style={styles.acceptText}>{accepted ? "Términos aceptados" : "Acepto y continuar"}</Text>
                </TouchableOpacity>
            ) : null}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#111827"
    },
    content: {
        padding: 24
    },
    title: {
        color: "#FFFFFF",
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 8
    },
    subtitle: {
        color: "#94A3B8",
        fontSize: 14,
        marginBottom: 20
    },
    sectionTitle: {
        color: "#10B981",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 16,
        marginBottom: 8
    },
    paragraph: {
        color: "#E5E7EB",
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 12
    },
    acceptButton: {
        backgroundColor: "#10B981",
        borderRadius: 12,
        alignItems: "center",
        paddingVertical: 14,
        marginTop: 18
    },
    acceptedButton: {
        backgroundColor: "#475569"
    },
    acceptText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "800"
    }
});
