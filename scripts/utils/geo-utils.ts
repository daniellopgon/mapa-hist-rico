/**
 * Funciones utilitarias para geolocalización, cálculo de rutas 
 * y operaciones matemáticas sobre coordenadas geográficas.
 */

import axios from 'axios';
import Openrouteservice from 'openrouteservice-js';

/**
 * Clave API de OpenRouteService. Utiliza una variable de entorno o un valor por defecto.
 */
const CLAVE_API_ORS = process.env['ORS_API_KEY'] || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZmMGQ3OTMwNmI3MjQ2OWRiM2NiNjdlMDFiNTI1YjI3IiwiaCI6Im11cm11cjY0In0=';

/**
 * Aproximación de cuántos kilómetros representa un grado de latitud en la Tierra.
 */
const GRADO_TIERRA_KM = 111.1;

/**
 * Cliente de direcciones de ORS configurado con nuestra clave de acceso
 */
const direccionesORS = new Openrouteservice.Directions({ api_key: CLAVE_API_ORS });

/**
 * Geocodifica una dirección física transformándola en coordenadas latitud y longitud
 * haciendo uso de la API gratuita Nominatim de OpenStreetMap.
 * 
 */
export const obtenerCoordenadas = async (direccion: string = ""): Promise<{ lat: number, lon: number } | null> => {
    if (!direccion) return null;

    // Construye la URL codificando el texto de la dirección para que sea válido en la petición HTTP
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;

    try {
        // Se envía un 'User-Agent' personalizado ya que las políticas de Nominatim lo exigen
        const respuesta = await axios.get(url, { headers: { 'User-Agent': 'AntigravityRouter/1.0' } });

        // Si existen resultados, extrae la latitud y longitud de la primera coincidencia
        if (respuesta.data && respuesta.data.length > 0) {
            return {
                lat: Number(respuesta.data[0].lat),
                lon: Number(respuesta.data[0].lon)
            };
        }
    } catch (error) {
        const err = error as Error;
        console.error(`[ERROR] Fallo en geocodificación para ${direccion}:`, err.message);
    }
    return null;
};

/**
 * Interfaz genérica para adaptar los distintos formatos de coordenadas que podemos recibir.
 */
export interface PuntoEntradaGeo {
    lat?: number | string;
    lng?: number | string;
    lon?: number | string;
    coordenadas?: {
        lat?: number | string;
        lng?: number | string;
    };
}

/**
 * Consulta el servicio de rutas ORS para calcular el trazado real a pie
 * entre una serie de puntos geográficos ordenados.
 * 
*/
export const obtenerGeometriaRuta = async (listaPuntos: PuntoEntradaGeo[] = []): Promise<unknown | null> => {
    // Se requiere al menos un punto de inicio y uno de fin para trazar una ruta
    if (listaPuntos.length < 2) return null;

    // Extrae y estandariza las coordenadas al formato longitud, latitud que pide OpenRouteService
    const puntos = listaPuntos.map(p => [
        Number(p.lng || p.coordenadas?.lng || p.lon),
        Number(p.lat || p.coordenadas?.lat)
    ]);

    try {
        // Calcula la ruta utilizando el perfil peatonal 'foot-walking'y solicitando formato GeoJSON
        const respuesta = await direccionesORS.calculate({
            coordinates: puntos,
            profile: 'foot-walking',
            format: 'geojson'
        });

        // Retorna exclusivamente la geometría del primer resultado la ruta óptima encontrada
        return respuesta?.features?.[0]?.geometry || null;
    } catch (error) {
        const err = error as Error;
        console.error("[ERROR] Error al calcular ruta en ORS:", err.message);
        return null;
    }
};

/**
 * Calcula un cuadro delimitador Bounding Box alrededor de un conjunto de puntos,
 * añadiendo un margen de seguridad especificado en kilómetros.
 * 
 */
export const calcularAreaLimite = (puntos: PuntoEntradaGeo[] = [], margenKm: number = 7): string => {
    // Obtiene todas las latitudes y longitudes de forma independiente
    const latitudes = puntos.map(p => Number(p.lat || p.coordenadas?.lat));
    const longitudes = puntos.map(p => Number(p.lng || p.coordenadas?.lng || p.lon));

    // Encuentra los extremos geográficos absolutos de los puntos proporcionados
    const latMin = Math.min(...latitudes);
    const latMax = Math.max(...latitudes);
    const lonMin = Math.min(...longitudes);
    const lonMax = Math.max(...longitudes);

    // Convierte el margen de kilómetros a grados de latitud 1 grado son ~111.1km siempre
    const bufferLat = Number(margenKm) / GRADO_TIERRA_KM;
    const latMedia = (latMin + latMax) / 2;

    // Convierte el margen de kilómetros a grados de longitud 
    // Ajustado por la latitud media, ya que la distancia entre paralelos se estrecha cerca de los polos
    const bufferLon = Number(margenKm) / (GRADO_TIERRA_KM * Math.cos((Number(latMedia) * Math.PI) / 180));

    // Retorna las 4 esquinas del cuadro calculadas, ajustadas a un máximo de 4 decimales
    return [
        (lonMin - bufferLon).toFixed(4),
        (latMin - bufferLat).toFixed(4),
        (lonMax + bufferLon).toFixed(4),
        (latMax + bufferLat).toFixed(4)
    ].join(',');
};
