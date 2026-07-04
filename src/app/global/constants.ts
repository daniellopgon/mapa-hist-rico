/**
 * Configuración general del mapa
 */
export const CONFIG_MAPA = {
    URL_DATOS: '/data.json?v=' + Date.now(),
    ZOOM_POR_DEFECTO: 15,
    WMS_URL: 'https://www.ign.es/wms/primera-edicion-mtn',
    WMS_CAPAS: 'MTN25-1edition-c',
    ATRIBUCION: '© Instituto Geográfico Nacional de España'
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
 * Información visual de las ciudades (nombres e imágenes)
 */
export const INFO_CIUDADES: Record<string, { nombre: string; imagen: string | null }> = {
    avila: { nombre: 'Ávila', imagen: '/avila.png' },
    salamanca: { nombre: 'Salamanca', imagen: '/salamanca.jpg' },
    madrid: { nombre: 'Madrid', imagen: '/madrid.png' },
    'madrid-arte': { nombre: 'Madrid Arte', imagen: '/madrid-arte.png' },
    'ruta-salamanca-google': { nombre: 'Salamanca', imagen: '/salamanca.jpg' },
};
