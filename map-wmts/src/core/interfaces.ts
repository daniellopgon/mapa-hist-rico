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
