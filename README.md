# Mapa Histórico de Ávila

Aplicación web interactiva desarrollada con **Angular 21** y **Leaflet** que permite explorar el plano histórico de Ávila dibujado por Benito Chías y Carbó en 1932. La aplicación superpone puntos de interés interactivos sobre la cartografía original servida por el Instituto Geográfico Nacional IGN mediante ArcGIS.

<p align="center">
  <!-- ESPACIO PARA SCREENSHOT GENERAL -->
 <img width="1377" height="611" alt="1" src="https://github.com/user-attachments/assets/767eb242-8117-431a-8606-172f449160d3" />
</p>

## Características Principales

*   **Cartografía Histórica:** Integración fluida del plano de 1932 mediante *TileLayers* de ArcGIS.
*   **Puntos de Interés Interactivos:** Pines personalizados con fotografías integradas de cada monumento.
*   **Renderizado de Pop-ups Nativos:** Ventanas emergentes programadas 100% en HTML/CSS desde componentes de Angular.
*   **Zoom y Cámara Inteligente:** Límites de navegación ajustados dinámicamente según la resolución de la pantalla para evitar que el usuario se salga del plano histórico.

## Capturas de Pantalla

### Detalle de Marcadores y Pop-ups
<img width="1212" height="720" alt="2" src="https://github.com/user-attachments/assets/247285c0-10c2-4a0d-be6a-7909a394d3fc" />

<img width="1422" height="812" alt="3" src="https://github.com/user-attachments/assets/cb35b4e3-c2c4-4d5a-b863-ad275d703681" />


## Tecnologías y Patrones

*   **Framework:** Angular.
*   **Mapas:** Leaflet.js Vanilla.
*   **Tipado:** TypeScript .
*   **Estilos:** Vanilla CSS
*   **Inyección de dependencias:** Uso intensivo de `EnvironmentInjector` y `ApplicationRef` para integrar el ciclo de vida de Angular con librerías externas que gestionan su propio DOM.

## Estructura del Proyecto

*   `src/app/components/mapa/`: Componente central envoltorio de Angular.
*   `src/app/components/mapa-pin/`: Componente visual presentacional para las chinchetas.
*   `src/app/components/mapa-popup/`: Componente visual presentacional para las ventanas emergentes.
*   `src/app/services/leaflet.service.ts`: Orquestador que conecta Leaflet con el compilador de Angular.
*   `src/app/global/constants.ts`: Constantes de configuración, URL del IGN, límites de cámara y tamaños de UI.
*   `src/app/models/`: Interfaces estrictas de TypeScript.
