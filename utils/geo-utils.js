/**
 * @fileoverview Utilidades geográficas en español.
 */
'use strict';

const axios = require('axios');
const Openrouteservice = require('openrouteservice-js');

// --- CONSTANTES ---
const CLAVE_API_ORS = process.env.ORS_API_KEY || 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjZmMGQ3OTMwNmI3MjQ2OWRiM2NiNjdlMDFiNTI1YjI3IiwiaCI6Im11cm11cjY0In0=';
const GRADO_TIERRA_KM = 111.1;

const direccionesORS = new Openrouteservice.Directions({ api_key: CLAVE_API_ORS });

/**
 * Obtiene coordenadas (latitud y longitud) para una dirección dada.
 */
const obtenerCoordenadas = async (direccion = "") => {
    if (!direccion) return null;

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(direccion)}`;

    try {
        const respuesta = await axios.get(url, { headers: { 'User-Agent': 'AntigravityRouter/1.0' } });

        if (respuesta.data && respuesta.data.length > 0) {
            return {
                lat: Number(respuesta.data[0].lat),
                lon: Number(respuesta.data[0].lon)
            };
        }
    } catch (error) {
        console.error(`[ERROR] Fallo en geocodificación para ${direccion}:`, error.message);
    }
    return null;
};

/**
 * Obtiene la geometría GeoJSON de una ruta peatonal.
 */
const obtenerGeometriaRuta = async (listaPuntos = []) => {
    if (listaPuntos.length < 2) return null;

    const puntos = listaPuntos.map(p => [
        Number(p.lng || p.coordenadas?.lng || p.lon),
        Number(p.lat || p.coordenadas?.lat)
    ]);

    try {
        const respuesta = await direccionesORS.calculate({
            coordinates: puntos,
            profile: 'foot-walking',
            format: 'geojson'
        });
        return respuesta?.features?.[0]?.geometry || null;
    } catch (error) {
        console.error("[ERROR] Error al calcular ruta en ORS:", error.message);
        return null;
    }
};

/**
 * Calcula el área de encuadre (Bounding Box) con un margen de seguridad.
 */
const calcularAreaLimite = (puntos = [], margenKm = 7) => {
    const latitudes = puntos.map(p => Number(p.lat || p.coordenadas?.lat));
    const longitudes = puntos.map(p => Number(p.lng || p.coordenadas?.lng || p.lon));

    const latMin = Math.min(...latitudes);
    const latMax = Math.max(...latitudes);
    const lonMin = Math.min(...longitudes);
    const lonMax = Math.max(...longitudes);

    const bufferLat = Number(margenKm) / GRADO_TIERRA_KM;
    const latMedia = (latMin + latMax) / 2;
    const bufferLon = Number(margenKm) / (GRADO_TIERRA_KM * Math.cos((Number(latMedia) * Math.PI) / 180));

    return [
        (lonMin - bufferLon).toFixed(4),
        (latMin - bufferLat).toFixed(4),
        (lonMax + bufferLon).toFixed(4),
        (latMax + bufferLat).toFixed(4)
    ].join(',');
};

module.exports = {
    obtenerCoordenadas,
    obtenerGeometriaRuta,
    calcularAreaLimite
};
