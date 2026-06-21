# Mapa Leaflet Offline con Vite

Este proyecto implementa un mapa interactivo con soporte offline utilizando Leaflet y el plugin `leaflet.offline`.

## 🚀 Tecnologías
- **Vite**: Bundler rápido para desarrollo web.
- **TypeScript**: Tipado estático para evitar errores comunes.
- **Leaflet**: Librería líder para mapas interactivos.
- **Leaflet.offline**: Gestión de tiles guardados en IndexedDB.
- **Vite PWA**: Soporte para Progressive Web App (instalable y offline).

## 📁 Estructura del Proyecto
- `src/main.ts`: Lógica principal del mapa y gestión de caché.
- `src/style.css`: Estilos del contenedor del mapa.
- `src/vite-env.d.ts`: Declaraciones de tipos para assets e iconos.
- `public/`: Assets estáticos (iconos de la PWA).

## 🛠️ Instalación y Uso
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Ejecutar en desarrollo:
   ```bash
   npm run dev
   ```
3. Construir para producción:
   ```bash
   npm run build
   ```

## 📝 Notas de Implementación
- Se ha configurado un `tileloadstart` manual en `main.ts` para interceptar las peticiones y servirlas desde la caché local si están disponibles.
- El archivo `vite-env.d.ts` incluye declaraciones para archivos `.png` y el módulo `leaflet.offline` para evitar errores de compilación en TS.
