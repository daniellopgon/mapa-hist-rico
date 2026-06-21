import { VisitaCruda, MarcadorCrudo } from '../interfaces/interfaces';

/**
 * Decodifica un valor entero variable de una polilínea codificada.
 */
const decodificarValorVariable = (texto: string, indice: number): { valor: number, nuevoIndice: number } => {
    let byte;
    let desplazamiento = 0;
    let resultado = 0;
    let idx = indice;

    do {
        byte = texto.charCodeAt(idx++) - 63;
        resultado |= (byte & 0x1f) << desplazamiento;
        desplazamiento += 5;
    } while (byte >= 0x20);

    const valorFinal = ((resultado & 1) ? ~(resultado >> 1) : (resultado >> 1));
    return { valor: valorFinal, nuevoIndice: idx };
};

/**
 * Algoritmo de Google para decodificar geometrías comprimidas Encoded Polylines.
 */
export const decodificarPolilinea = (textoCodificado: string, precision: number = 5): Array<[number, number]> => {
    try {
        let indice = 0;
        let latitud = 0;
        let longitud = 0;
        const coordenadas: Array<[number, number]> = [];
        const factor = Math.pow(10, precision);

        while (indice < textoCodificado.length) {

            const resLat = decodificarValorVariable(textoCodificado, indice);
            latitud += resLat.valor;
            indice = resLat.nuevoIndice;


            const resLng = decodificarValorVariable(textoCodificado, indice);
            longitud += resLng.valor;
            indice = resLng.nuevoIndice;

            coordenadas.push([latitud / factor, longitud / factor]);
        }
        return coordenadas;
    } catch (error) {
        console.error('[Utils] Error al decodificar polilínea:', error);
        return [];
    }
};

/**
 * Extrae las coordenadas de un marcador independientemente del formato de entrada.
 */
const extraerCoordenadasMarcador = (m: any): [number, number] => {
    const rawCoords = m.coords || m.coordenadas;
    if (Array.isArray(rawCoords)) return [rawCoords[0], rawCoords[1]];
    if (rawCoords && typeof rawCoords === 'object') return [rawCoords.lat, rawCoords.lng];
    if (m.lat !== undefined && m.lng !== undefined) return [m.lat, m.lng];
    return [0, 0];
};

/**
 * Normaliza los marcadores POIs del backend.
 */
const normalizarMarcadores = (datos: any): MarcadorCrudo[] => {
    const lista = datos.markers || datos.waypoints || datos.marcadores || datos.lugar?.rutas?.[0]?.pasos || [];
    return lista.map((m: any) => ({
        nombre: m.nombre || m.name || m.title || 'Parada',
        coordenadas: extraerCoordenadasMarcador(m)
    }));
};

/**
 * Extrae la geometría de la ruta de diversas propiedades posibles.
 */
const extraerGeometriaRuta = (v: any): any => {
    let ruta = v.rutaPrecalculada || v.preCalculatedRoute || v.route || v.ruta || v.rutaGeoJson || v.lugar?.rutas?.[0]?.ruta_geometry;
    if (ruta && typeof ruta === 'object') {
        return ruta.geojson || ruta.geometry || ruta;
    }
    return ruta;
};

/**
 * Calcula el centro del mapa basándose en los datos disponibles.
 */
const calcularCentroCiudad = (v: any, marcadores: MarcadorCrudo[]): [number, number] => {
    const centro = v.centroCiudad || v.cityCenter || v.centro;
    if (centro) {
        return Array.isArray(centro) ? [centro[0], centro[1]] : [centro.lat, centro.lng];
    }
    return marcadores.length > 0 ? marcadores[0].coordenadas : [41.652, -4.728];
};

/**
 * Normaliza una visita completa del backend.
 */
export const normalizarVisita = (v: any): VisitaCruda => {
    try {
        if (!v) throw new Error('Visita inválida');

        const marcadores = normalizarMarcadores(v);
        const idCiudad = v.idCiudad || v.cityId || v.id || 'avila';
        const archivoMapa = v.archivoMapa || v.mapFile || `${idCiudad}.pmtiles`;

        return {
            ...v,
            id: v.id || idCiudad,
            idCiudad: idCiudad,
            nombre: v.nombre || v.name || v.titulo || 'Ruta',
            cliente: v.cliente || v.client || 'General',
            direccion: v.direccion || v.address || 'Ubicación',
            zoom: v.zoom || 15,
            marcadores,
            rutaPrecalculada: extraerGeometriaRuta(v),
            urlPmtiles: `/offline/${archivoMapa}`,
            centroCiudad: calcularCentroCiudad(v, marcadores)
        };
    } catch (error) {
        console.error('[Utils] Error:', error);
        return { id: 'error', idCiudad: 'error', nombre: 'Error', marcadores: [], urlPmtiles: '' } as any;
    }
};
