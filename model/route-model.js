"use strict";

/**
 * MODELOS DE DATOS
 */

/**
 * @typedef {Object} Marker
 * @property {string} name - Nombre del monumento.
 * @property {{lat: number, lng: number}} coords - Coordenadas.
 */

/**
 * @typedef {Object} RouteEntry
 * @property {string} id - Identificador único.
 * @property {string} cityId - ID de la ciudad.
 * @property {string} name - Nombre de la ciudad.
 * @property {{lat: number, lon: number}} cityCenter - Centro geográfico.
 * @property {string} pmtilesUrl - Ruta al archivo de mapa.
 * @property {object} preCalculatedRoute - Geometría GeoJSON.
 * @property {Array<Marker>} markers - Lista de monumentos.
 */

/**
 * Crea una entrada de ruta consistente (Norma 5: Inicialización).
 * @param {Partial<RouteEntry>} data - Datos iniciales.
 * @returns {RouteEntry}
 */
const createRouteEntry = (data = {}) => {
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

module.exports = {
    createRouteEntry
};
