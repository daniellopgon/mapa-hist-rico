/**
 * Configuración general del mapa
 */
export const CONFIG_MAPA = {
    URL_SATELITE: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    ID_CONTENEDOR: 'map',
    URL_PMTILES: '/offline/{idCiudad}.pmtiles',
    ATRIBUCION: '&copy; OpenStreetMap contributors',
    URL_DATOS: '/data.json?v=' + Date.now(),
    OPCIONES_LOCALIZACION: { setView: true, maxZoom: 16, watch: true, enableHighAccuracy: true },
    ZOOM_POR_DEFECTO: 14,
    CAPAS: {
        CALLES: 'Callejero',
        SATELITE: 'Satélite'
    },
    TIEMPO_AGOTADO_GPS_MS: 5000
};

/**
 * Configuración de iconos para marcadores
 */
export const CONFIG_ICONO = {
    ESTANDAR: {
        urlIcono: 'marker-icon.png',
        urlIconoRetina: 'marker-icon-2x.png',
        urlSombra: 'marker-shadow.png',
        tamanoIcono: [25, 41] as [number, number],
        anclajeIcono: [12, 41] as [number, number]
    },
    PUNTO_INTERES: {
        tamano: [30, 30] as [number, number],
        anclaje: [15, 15] as [number, number]
    }
};

/**
 * Valores por defecto para visitas y paradas
 */
export const VALORES_VISITA_DEFECTO = {
    DIRECCION: 'Dirección Desconocida',
    CLIENTE: 'Cliente General',
    NOMBRE_PARADA: 'Parada',
    SUFIJO_OFFLINE: '(Offline)'
};

/**
 * Información visual de las ciudades (nombres e imágenes)
 */
export const INFO_CIUDADES: Record<string, { nombre: string; imagen: string | null }> = {
    avila: { nombre: 'Ávila', imagen: '/avila.png' },
    salamanca: { nombre: 'Salamanca', imagen: '/salamanca.jpg' },
    madrid: { nombre: 'Madrid', imagen: '/madrid.png' },
    'madrid-arte': { nombre: 'Madrid Arte', imagen: '/madrid-arte.png' },
    'ruta-salamanca-google': { nombre: 'Salamanca', imagen: '/salamanca.jpg' },
};

/**
 * Configuración de elementos de la interfaz de usuario
 */
export const CONFIG_UI = {
    CLASE_SELECTOR_RUTA: 'route-selector',
    ID_SELECTOR_RUTA: 'route-select',
    TEXTO_GUARDANDO: 'Guardando mapa offline...',
    TEXTO_FINALIZADO: 'Mapa offline listo',
    TEXTO_DESCARGAR: 'Descargar',
    TEXTO_VER_MAPA: 'VER MAPA',
    TEXTO_ACTUALIZAR: 'Actualizar',
    TEXTO_BORRAR_TODO: 'Borrar todos los mapas descargados',
    RETRASO_OCULTAR_MS: 3000,
    CLASE_OCULTO: 'u-oculto'
};
