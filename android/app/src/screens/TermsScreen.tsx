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

            <Text style={styles.sectionTitle}>Creadores y desarrollo híbrido</Text>
            <Text style={styles.paragraph}>RadarSuRo fue concebido y dirigido por su desarrollador humano, quien define el propósito, la arquitectura, los requisitos, las pruebas y las decisiones de producto. Durante su construcción se utilizaron herramientas de inteligencia artificial como apoyo al análisis, estructuración, programación, revisión, documentación y refinamiento del proyecto. Entre las herramientas utilizadas se encuentran ChatGPT, Codex, Gemini y Claude, según disponibilidad.</Text>
            <Text style={styles.paragraph}>Este proceso se entiende como desarrollo híbrido humano-IA: las herramientas de inteligencia artificial participaron como asistentes de desarrollo y refinamiento, mientras que la dirección, integración, validación, pruebas y responsabilidad de las decisiones sobre el producto corresponden al desarrollador. El proyecto fue construido utilizando los recursos disponibles, incluyendo modalidades gratuitas de estas herramientas, por lo que su desarrollo ha podido presentar pausas o limitaciones asociadas a cuotas, disponibilidad y capacidad de los servicios utilizados.</Text>
            <Text style={styles.paragraph}>Las herramientas de inteligencia artificial utilizadas durante el desarrollo no forman parte de un servicio de asistencia remota permanente de RadarSuRo ni determinan por sí mismas las decisiones operativas de una misión.</Text>

            <Text style={styles.sectionTitle}>Alcance real de la herramienta</Text>
            <Text style={styles.paragraph}>RadarSuRo fue desarrollado como una herramienta de apoyo para comunidades, brigadas, voluntarios y equipos de rescate. Su objetivo es aportar información de proximidad y registro operativo, especialmente en contextos donde los recursos son limitados.</Text>
            <Text style={styles.paragraph}>RadarSuRo no localiza personas por sí solo ni garantiza encontrar dispositivos. Los teléfonos modernos pueden ocultar señales, apagar radios, cambiar identificadores, limitar Bluetooth, bloquear escaneos WiFi o quedarse sin batería. La aplicación debe usarse como apoyo, no como única fuente de decisión.</Text>
            <Text style={styles.paragraph}>La información de Bluetooth, WiFi, GPS, sensores y mapa de calor es aproximada. Una señal fuerte puede sugerir cercanía, pero también puede verse afectada por paredes, concreto, metal, humedad, interferencia, posición del rescatista, potencia del dispositivo y condiciones del terreno.</Text>

            <Text style={styles.sectionTitle}>Uso operativo recomendado</Text>
            <Text style={styles.paragraph}>Antes de iniciar una misión, el operador debe registrar su nombre, documento, organización, país o zona, rol y tipo de rescate. Esa información será anexada al registro descargable. Al iniciar misión, RadarSuRo empieza a guardar ruta GPS, objetivos detectados, sensores, hora de inicio, hora de cierre, notas y señales fijadas con PIN.</Text>
            <Text style={styles.paragraph}>Si se fija una señal con PIN, el operador debe moverse con calma, observar si la intensidad sube o baja, revisar obstáculos y confirmar con otros métodos de rescate. El mapa de calor muestra dónde se observaron mejores señales, no la ubicación exacta del sobreviviente.</Text>

            <Text style={styles.sectionTitle}>Mapa gratuito</Text>
            <Text style={styles.paragraph}>El mapa usa OpenStreetMap cuando hay conexión a internet. No requiere API key de pago. Si no hay señal de datos, el mapa puede no cargar mosaicos, pero el radar, las lecturas, los registros y las coordenadas GPS pueden seguir aportando información según los permisos y sensores disponibles.</Text>

            <Text style={styles.sectionTitle}>Privacidad y datos</Text>
            <Text style={styles.paragraph}>En la arquitectura actual, RadarSuRo guarda localmente en el dispositivo información como el perfil del operador, contactos configurados, aceptación de términos, objetivos detectados, ruta GPS y registros de misión. El usuario es responsable de custodiar, compartir o eliminar esos registros.</Text>
            <Text style={styles.paragraph}>RadarSuRo no debe utilizarse para publicar o compartir información sensible de víctimas, rescatistas, ubicaciones operativas o terceros sin autorización. La instalación o utilización de la aplicación no autoriza automáticamente el tratamiento o divulgación de datos personales de otras personas.</Text>
            <Text style={styles.paragraph}>Si una futura versión incorpora servidores, cuentas, analítica, sincronización en la nube u otros servicios de tratamiento remoto de información, sus condiciones de privacidad deberán actualizarse antes de utilizar esas funciones.</Text>

            <Text style={styles.sectionTitle}>Uso indebido y responsabilidad del operador</Text>
            <Text style={styles.paragraph}>El operador es responsable de utilizar RadarSuRo de acuerdo con estos términos, la legislación aplicable y los protocolos de seguridad de su organización. No debe utilizar las lecturas de la aplicación como prueba única para tomar decisiones que puedan poner en riesgo vidas, estructuras, equipos o terceros.</Text>
            <Text style={styles.paragraph}>La modificación no autorizada de la aplicación, manipulación de sus registros, utilización para actividades ilícitas, invasión de la privacidad de terceros o interpretación deliberadamente fraudulenta de sus resultados queda fuera del uso previsto de RadarSuRo. El usuario será responsable de las consecuencias derivadas de su propio uso, configuración, modificación o distribución no autorizada, sin perjuicio de las responsabilidades que legalmente correspondan a cada parte.</Text>

            <Text style={styles.sectionTitle}>Inteligencia artificial y limitaciones</Text>
            <Text style={styles.paragraph}>La participación de herramientas de inteligencia artificial en el desarrollo no significa que el código, las recomendaciones o los resultados de dichas herramientas sean infalibles. Todo componente debe ser revisado, integrado y probado antes de considerarse parte funcional de RadarSuRo. La existencia de asistencia de IA no constituye certificación de seguridad, exactitud, idoneidad operativa ni garantía de funcionamiento en todos los dispositivos o escenarios.</Text>
            <Text style={styles.paragraph}>RadarSuRo no debe presentarse como un sistema certificado de localización de víctimas, un dispositivo médico, un sistema oficial de emergencias ni un sustituto de equipos profesionales de búsqueda y rescate. Las estimaciones producidas por sensores, Bluetooth, WiFi, GPS, mapas u otros componentes pueden contener errores.</Text>

            <Text style={styles.sectionTitle}>Responsabilidad</Text>
            <Text style={styles.paragraph}>La app no reemplaza servicios oficiales de emergencia, protocolos SAR, evaluación estructural, equipos térmicos, equipos acústicos, perros de búsqueda, drones, comunicaciones de radio ni criterio profesional. Cualquier decisión crítica debe confirmarse con el mando operativo y el contexto de seguridad.</Text>
            <Text style={styles.paragraph}>Estos términos buscan establecer claramente el uso previsto, sus limitaciones y las responsabilidades de cada usuario. No pretenden excluir derechos, garantías o responsabilidades que sean irrenunciables conforme a la legislación colombiana aplicable.</Text>

            <Text style={styles.sectionTitle}>Marco legal aplicable</Text>
            <Text style={styles.paragraph}>RadarSuRo se desarrolla para su utilización respetando, según corresponda, la legislación colombiana aplicable en materia de protección de datos personales, privacidad, derechos de los usuarios, propiedad intelectual, delitos informáticos y demás normas que resulten pertinentes. Entre ellas se consideran, cuando sean aplicables, la Ley 1581 de 2012 y sus normas reglamentarias sobre protección de datos personales, así como las normas colombianas sobre derecho de autor y protección de software.</Text>
            <Text style={styles.paragraph}>El cumplimiento normativo depende también del uso concreto que cada persona, organización o tercero haga de la aplicación. Ninguna cláusula de estos términos autoriza conductas contrarias a la ley ni sustituye el asesoramiento jurídico profesional cuando este sea necesario.</Text>

            <Text style={styles.sectionTitle}>Propiedad intelectual</Text>
            <Text style={styles.paragraph}>RadarSuRo, su código, diseño, documentación, identidad y demás elementos originales están sujetos a los derechos de propiedad intelectual que correspondan. La utilización de herramientas de inteligencia artificial durante el desarrollo no implica que dichas herramientas sean propietarias del proyecto ni concede a terceros autorización automática para copiar, distribuir, comercializar o modificar RadarSuRo.</Text>

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
