/**
 * Definición de interfaces compartidas para los scripts.
 */

export interface PuntoRuta {
    nombre: string;
    lat: number;
    lng: number;
}

/**
 * Interfaces para tipar la estructura anidada que suele devolver Google Maps.
 */
export interface UbicacionGoogle {
    lat?: string | number;
    lng?: string | number;
}

export interface PuntoPasoGoogle {
    location?: UbicacionGoogle | { location?: UbicacionGoogle };
}

export interface DatosGoogleEstructura {
    request?: {
        origin?: { location?: UbicacionGoogle };
        destination?: { location?: UbicacionGoogle };
        waypoints?: PuntoPasoGoogle[];
    };
}

/**
 * Interfaces de almacenamiento de rutas y marcadores.
 */
export interface MarcadorData {
    nombre: string;
    coordenadas: { lat: number; lng: number };
}

export interface RouteData {
    id: string;
    nombre: string;
    centro?: { lat: number; lng: number };
    marcadores?: MarcadorData[];
    rutaGeoJson?: unknown;
    archivoMapa?: string;
}
