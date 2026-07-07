# Mapa Histórico de Ávila 🏰

Aplicación web interactiva desarrollada con **Angular 21** y **Leaflet** que permite explorar el plano histórico de Ávila dibujado por Benito Chías y Carbó en 1932. La aplicación superpone puntos de interés (PDIs) interactivos sobre la cartografía original servida por el Instituto Geográfico Nacional (IGN) mediante ArcGIS.

<p align="center">
  <!-- ESPACIO PARA SCREENSHOT GENERAL -->
  <img src="docs/screenshots/mapa-general.jpg" alt="Vista general del Mapa Histórico de Ávila" width="800">
</p>

## ✨ Características Principales

*   **Cartografía Histórica:** Integración fluida del plano de 1932 mediante *TileLayers* de ArcGIS.
*   **Puntos de Interés Interactivos:** Chinchetas personalizadas con fotografías integradas de cada monumento.
*   **Arquitectura Desacoplada (Clean Architecture):** Uso del paradigma *Dumb Component* (Componentes Presentacionales) de Angular inyectados de forma dinámica (`createComponent()`) dentro del ecosistema Canvas de Leaflet.
*   **Renderizado de Pop-ups Nativos:** Ventanas emergentes programadas 100% en HTML/CSS desde componentes de Angular (sin HTML incrustado en strings).
*   **Zoom y Cámara Inteligente:** Límites de navegación (Max Bounds) ajustados dinámicamente según la resolución de la pantalla para evitar que el usuario se salga del plano histórico.

## 📸 Capturas de Pantalla

### Detalle de Marcadores y Pop-ups
<!-- ESPACIO PARA SCREENSHOT DEL POPUP -->
![Detalle de Pop-up interactivo](docs/screenshots/detalle-popup.jpg)

### Vista en Dispositivos Móviles
<!-- ESPACIO PARA SCREENSHOT MÓVIL -->
![Vista Responsive](docs/screenshots/vista-movil.jpg)

## 🛠️ Tecnologías y Patrones

*   **Framework:** Angular (Standalone Components).
*   **Mapas:** Leaflet.js Vanilla.
*   **Tipado:** TypeScript con interfaces estrictas (`DatosMapa`, `Marcador`).
*   **Estilos:** Vanilla CSS (evitando frameworks externos para máximo rendimiento y control gráfico), tipografía Inter.
*   **Inyección de dependencias:** Uso intensivo de `EnvironmentInjector` y `ApplicationRef` para integrar el ciclo de vida de Angular con librerías externas que gestionan su propio DOM.

## 🚀 Instalación y Despliegue

Sigue estos pasos para arrancar el proyecto en tu entorno local:

1. **Clona el repositorio:**
   ```bash
   git clone [TU_URL_DE_GITHUB]
   cd mapa_avila
   ```

2. **Instala las dependencias:**
   ```bash
   npm install
   ```

3. **Inicia el servidor de desarrollo:**
   ```bash
   ng serve
   ```

4. **Abre la aplicación:**
   Navega a `http://localhost:4200/` en tu navegador. El proyecto se recargará automáticamente si haces cambios en el código fuente.

## 📁 Estructura del Proyecto

*   `src/app/components/mapa/`: Componente central envoltorio de Angular.
*   `src/app/components/mapa-pin/`: Componente visual presentacional para las chinchetas.
*   `src/app/components/mapa-popup/`: Componente visual presentacional para las ventanas emergentes.
*   `src/app/services/leaflet.service.ts`: Orquestador que conecta Leaflet con el compilador de Angular.
*   `src/app/global/constants.ts`: Constantes de configuración, URL del IGN, límites de cámara y tamaños de UI.
*   `src/app/models/`: Interfaces estrictas de TypeScript.
