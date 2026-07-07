import { DatosMapa } from '../models/datos-mapa';

export const CONFIG_MAPA = {
    LIMITES_AVILA: [
        [40.6481, -4.7111],
        [40.6616, -4.6852]
    ] as [[number, number], [number, number]],
    
    CENTRO_AVILA: [40.656, -4.700] as [number, number],
    
    ZOOM_INICIAL: 16,
    MIN_ZOOM_LOD: 15,
    MAX_ZOOM: 18,

    ARCGIS_URL: 'https://tiles.arcgis.com/tiles/tIcvkZLogWoN4oaH/arcgis/rest/services/Benito_Chías_y_Carbó_1932/MapServer/tile/{z}/{y}/{x}',
    ATRIBUCION: 'Plano de Ávila por Benito Chías y Carbó, 1932 (JCYL / IGN)'
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

export const MAPA_AVILA_MOCK: DatosMapa = {
    id: 'avila-001',
    idCiudad: 'avila',
    nombre: 'Ávila Monumental',
    cliente: 'Demo Local',
    direccion: 'Centro histórico',
    zoom: 16,
    centroCiudad: [40.656, -4.700],
    marcadores: [
        { 
            nombre: 'Casa de los Verdugo', 
            coordenadas: [40.6581, -4.6966],
            imagen: 'assets/casa-de-los-verdugo.jpg',
            descripcion: 'Casa señorial del siglo XVI, famosa por su imponente fachada plateresca y su patio interior.'
        },
        { 
            nombre: 'Muralla - Puerta de San Segundo', 
            coordenadas: [40.6575, -4.7072],
            imagen: 'assets/muralla-puerta-del-puente-o-de-san-segundo.jpg',
            descripcion: 'Una de las nueve puertas de acceso de la muralla, situada junto a la ermita de San Segundo y el río Adaja.'
        },
        { 
            nombre: 'Muralla - Puerta del Rastro', 
            coordenadas: [40.6542, -4.6995],
            imagen: 'assets/muralla-puerta-del-rastro.jpg',
            descripcion: 'Puerta flanqueada por un robusto torreón, conectada con el histórico palacio renacentista de los Dávila.'
        },
        { 
            nombre: 'Iglesia de San Pedro', 
            coordenadas: [40.6555, -4.6935],
            imagen: 'assets/san-pedro.jpg',
            descripcion: 'Impresionante templo románico del siglo XII situado extramuros en la Plaza de Santa Teresa.'
        }
    ]
};
