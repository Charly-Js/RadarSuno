# RADARSUR

## Radar de apoyo para búsqueda y rescate

RADARSUR es una aplicación Android desarrollada con React Native y TypeScript como herramienta de apoyo para operaciones de búsqueda y rescate.

El proyecto integra detección inalámbrica, GPS, sensores de orientación, representación visual tipo radar, alertas sonoras y registro local de misiones. Su objetivo es proporcionar información de apoyo al operador directamente desde un dispositivo Android, reduciendo la dependencia de un computador durante una misión.

> **Estado:** versión Release compilable y firmada, en etapa de pruebas y validación en dispositivo físico.

> **Importante:** RADARSUR es una herramienta de apoyo. Las distancias y posiciones obtenidas mediante señales inalámbricas y sensores son aproximadas y no sustituyen equipos profesionales de localización ni los protocolos oficiales de búsqueda y rescate.

---

## Plataforma y tecnología

- Android
- React Native
- TypeScript
- React Native 0.86.x
- React 19.x
- Hermes
- Gradle
- Android SDK 36
- Build Tools 36.0.0
- Kotlin 2.1.20
- NDK 27.1.12297006
- Minimum SDK 24
- Target SDK 36

Configuración principal del proyecto:

```text
compileSdkVersion = 36
targetSdkVersion = 36
minSdkVersion = 24
buildToolsVersion = 36.0.0
```

---

## Arquitectura actual

El código principal se encuentra organizado por responsabilidades:

```text
android/app/src/
│
├── algorithms/
│   └── RadarEngine.ts
│
├── components/
│   ├── BottomPanel.tsx
│   ├── Header.tsx
│   └── RadarView.tsx
│
├── controllers/
│   └── RadarController.ts
│
├── interfaces/
│   ├── MissionRecord.ts
│   ├── OperatorProfile.ts
│   └── RadarTarget.ts
│
├── main/
│   └── RadarApp.tsx
│
├── mission/
│   └── MissionEngine.ts
│
├── screens/
│   ├── HistoryScreen.tsx
│   ├── OperatorSetupScreen.tsx
│   ├── PermissionScreen.tsx
│   └── RadarScreen.tsx
│
└── services/
    ├── BluetoothService.ts
    ├── GPSService.ts
    ├── MissionFileService.ts
    ├── MissionLogService.ts
    ├── PermissionService.ts
    ├── SensorService.ts
    └── WifiService.ts
```

---

## Funcionalidades actuales

### Radar

La interfaz principal representa los objetivos detectados alrededor del operador mediante una vista tipo radar.

Los componentes principales son:

- `RadarView.tsx`
- `RadarEngine.ts`
- `RadarController.ts`
- `RadarScreen.tsx`

La aplicación procesa los objetivos detectados y los representa de acuerdo con la información disponible de las fuentes inalámbricas, GPS y sensores.

### Bluetooth

RADARSUR dispone de un servicio dedicado a la detección de dispositivos Bluetooth:

```text
BluetoothService.ts
```

### Wi-Fi

RADARSUR dispone de un servicio para trabajar con información de redes/dispositivos Wi-Fi detectados:

```text
WifiService.ts
```

La intensidad de señal y otros datos inalámbricos no constituyen por sí solos un sistema de posicionamiento exacto. Por esta razón, la distancia y ubicación mostradas por RADARSUR deben interpretarse como aproximaciones.

### GPS

El servicio `GPSService.ts` proporciona información de ubicación del dispositivo y sirve como parte de la información de contexto de la misión.

### Sensores

`SensorService.ts` gestiona información de orientación y movimiento del dispositivo, incluyendo datos utilizados por la interfaz del radar como:

- Azimuth
- Pitch
- Roll
- Giroscopio

La orientación del dispositivo se utiliza para que la representación del radar pueda responder al movimiento del operador.

### Alertas sonoras

El sistema incorpora alertas sonoras asociadas a los objetivos detectados y su proximidad aproximada. El sonido funciona como complemento de la representación visual y no como único mecanismo de localización.

---

## Misiones y almacenamiento local

La aplicación cuenta con una estructura para gestionar y registrar misiones mediante:

```text
MissionEngine.ts
MissionLogService.ts
MissionFileService.ts
```

El proyecto está orientado a conservar los datos operativos en el propio dispositivo Android, permitiendo utilizar la aplicación sin mantener una conexión con el computador de desarrollo.

La información de una misión puede incluir datos del operador, eventos, objetivos y datos disponibles durante la operación.

### Historial

`HistoryScreen.tsx` proporciona acceso al historial de misiones almacenadas localmente.

### Perfil del operador

RADARSUR incluye una estructura de perfil de operador mediante:

```text
OperatorProfile.ts
OperatorSetupScreen.tsx
```

### Permisos

Los permisos de Android se gestionan mediante:

```text
PermissionService.ts
PermissionScreen.tsx
```

---

## Funcionamiento independiente

La versión Release está configurada para generar un APK Android que puede instalarse directamente en un dispositivo físico.

Durante el funcionamiento normal de la aplicación no es necesario ejecutar Metro, React Native CLI, VS Code ni mantener el teléfono conectado al computador.

El dispositivo contiene la aplicación y puede utilizar sus propios recursos de:

```text
GPS
Bluetooth
Wi-Fi
Sensores
Almacenamiento local
```

---

## Compilación Release

RADARSUR cuenta con configuración de firma para versiones Release mediante un keystore privado.

Los archivos de firma utilizados localmente son:

```text
android/app/radarsur-release.keystore
android/keystore.properties
```

Estos archivos son privados y están excluidos del repositorio mediante `.gitignore`.

**Nunca publicar el keystore ni las contraseñas de firma.** El keystore debe conservarse con copias de seguridad seguras, ya que es necesario para futuras actualizaciones firmadas de la aplicación.

### Generar el APK

Desde la carpeta `android`:

```powershell
.\gradlew.bat assembleRelease
```

El APK se genera en:

```text
android/app/build/outputs/apk/release/app-release.apk
```

La configuración Release ya fue compilada correctamente en el entorno de desarrollo.

---

## Instalación mediante ADB

Con un dispositivo Android conectado y autorizado:

```powershell
& "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe" devices
```

Para instalar la versión Release:

```powershell
& "$env:ANDROID_SDK_ROOT\platform-tools\adb.exe" install ".\app\build\outputs\apk\release\app-release.apk"
```

Si existe una instalación anterior de `com.rc` firmada con una clave diferente, Android puede mostrar `INSTALL_FAILED_UPDATE_INCOMPATIBLE`. En ese escenario, durante las pruebas se debe desinstalar la versión anterior o instalar una actualización firmada con la misma clave.

---

## Estado del proyecto

### Implementado

- [x] Aplicación Android React Native
- [x] Interfaz principal de radar
- [x] Representación de objetivos
- [x] Detección Bluetooth
- [x] Detección Wi-Fi
- [x] GPS
- [x] Sensores de orientación
- [x] Alertas sonoras
- [x] Gestión de permisos
- [x] Perfil del operador
- [x] Gestión de misiones
- [x] Registro de misión
- [x] Historial de misiones
- [x] Almacenamiento local de información de misión
- [x] Configuración de Release
- [x] Keystore privado para firma Release
- [x] Generación del APK Release
- [x] Código sincronizado con GitHub

### En validación

- [ ] Precisión de distancia de objetivos Bluetooth/Wi-Fi en diferentes entornos
- [ ] Precisión de la posición relativa de los objetivos
- [ ] Comportamiento del radar durante el desplazamiento del operador
- [ ] Rotación fluida del radar según la orientación
- [ ] Representación correcta de objetivos y señales visuales
- [ ] Indicador visual de aproximación al objetivo
- [ ] Validación de la experiencia de usuario en movimiento
- [ ] Pruebas prolongadas de misión en campo

---

## Próxima etapa: equipos de rescate

Está prevista una funcionalidad de coordinación de equipos de búsqueda mediante identificadores de operador.

La etapa futura contempla:

- Creación de equipos.
- Equipos de hasta cinco operadores.
- Identificación de integrantes.
- Asignación coordinada de objetivos.
- Evitar que dos operadores trabajen simultáneamente sobre el mismo objetivo.
- Canal de voz para comunicación entre integrantes del equipo.
- Registro de actividades de la misión.
- Coordinación de operadores durante la búsqueda.
- Finalización y disolución del equipo al terminar la misión.

Esta funcionalidad pertenece a una etapa posterior y no debe considerarse parte del alcance actual de la Release.

---

## Seguridad y privacidad

RADARSUR está diseñado para mantener información operacional de las misiones en el dispositivo.

Las credenciales y material criptográfico de firma no forman parte del repositorio público.

No deben subirse a GitHub:

```text
*.keystore
keystore.properties
```

El `.gitignore` del proyecto contempla la exclusión del material de firma.

---

## Repositorio

Repositorio oficial:

https://github.com/pinzonc1/RadarSuno

Rama principal:

```text
main
```

---

## Advertencia operacional

RADARSUR es una herramienta de apoyo tecnológico para operaciones de búsqueda y rescate.

Las señales Bluetooth y Wi-Fi pueden verse afectadas por obstáculos, interferencias, potencia de transmisión, características del dispositivo, arquitectura del entorno y condiciones de radiofrecuencia. GPS y sensores también presentan limitaciones propias.

Por lo tanto, las distancias y posiciones mostradas deben considerarse **aproximadas**. RADARSUR no debe utilizarse como único medio para determinar la ubicación de una persona u objetivo en una situación real de emergencia.

La aplicación debe complementar los protocolos, procedimientos y equipos profesionales correspondientes.
