export interface Paso {
    lat: number;
    lng: number;
    titulo: string;
    letra: string;
    distancia: number;
}

export interface Ruta {
    geojson?: any;
    distanciaTotal: number;
    tiempoEstimado: number;
    pasos: Paso[];
}

export interface Visita {
    id: string;
    idCiudad: string;
    cliente: string;
    direccionDestino: string;
    coordenadasDestino: { lat: number; lng: number };
    puntosInteres?: { lat: number; lng: number }[];
    ruta?: Ruta;
}

export interface MarcadorCrudo {
    nombre: string;
    coordenadas: [number, number];
}

export interface VisitaCruda {
    id: string;
    idCiudad: string;
    nombre: string;
    cliente: string;
    direccion: string;
    zoom: number;
    centroCiudad?: [number, number];
    marcadores: MarcadorCrudo[];
    urlPmtiles?: string;
    rutaPrecalculada?: any;
}

export interface Marker {
    name: string;
    coords: { lat: number; lng: number };
}

export interface RouteEntry {
    id: string;
    cityId: string;
    name: string;
    cityCenter: { lat: number; lon: number };
    pmtilesUrl: string;
    preCalculatedRoute: Record<string, unknown>;
    markers: Marker[];
}

/**
 * Crea una entrada de ruta consistente.
 */
export const createRouteEntry = (data: Partial<RouteEntry> = {}): RouteEntry => {
    return {
        id: data.id || `route-${Date.now()}`,
        cityId: data.cityId || "",
        name: data.name || "",
        cityCenter: data.cityCenter || { lat: 0, lon: 0 },
        pmtilesUrl: data.pmtilesUrl || "",
        preCalculatedRoute: data.preCalculatedRoute || {},
        markers: data.markers || []
    };
};
