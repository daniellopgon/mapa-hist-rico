export interface Marcador {
    nombre: string;
    coordenadas: [number, number];
}

export interface DatosMapa {
    id: string;
    idCiudad: string;
    nombre: string;
    cliente: string;
    direccion: string;
    zoom: number;
    centroCiudad?: [number, number];
    marcadores: Marcador[];
    urlPmtiles?: string;
    rutaPrecalculada?: unknown;
}
