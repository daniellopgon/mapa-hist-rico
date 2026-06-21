/**
 * @fileoverview Analizador parser para convertir datos de Google Maps al formato del sistema.
 */
'use strict';

/**
 * Procesa un objeto de petición de Google Maps y extrae los puntos de paso.
 */
const procesarPeticionGoogle = (datosGoogle = {}) => {
    try {
        if (!datosGoogle || !datosGoogle.request) {
            console.error("[ERROR] El JSON de Google no tiene el formato esperado (falta 'request')");
            return [];
        }

        const peticion = datosGoogle.request;
        const listaPuntos = [];

        if (peticion.origin && peticion.origin.location) {
            const { lat, lng } = peticion.origin.location;
            listaPuntos.push({
                nombre: "INICIO_RUTA",
                lat: Number(lat),
                lng: Number(lng)
            });
        }

        if (peticion.waypoints && Array.isArray(peticion.waypoints)) {
            peticion.waypoints.forEach((puntoPaso, indice) => {

                const ubicacion = puntoPaso.location.location || puntoPaso.location;
                const { lat, lng } = ubicacion;

                listaPuntos.push({
                    nombre: `PUNTO_INTERMEDIO_${indice + 1}`,
                    lat: Number(lat),
                    lng: Number(lng)
                });
            });
        }

        if (peticion.destination && peticion.destination.location) {
            const { lat, lng } = peticion.destination.location;
            listaPuntos.push({
                nombre: "FIN_RUTA",
                lat: Number(lat),
                lng: Number(lng)
            });
        }

        console.info(`[INFO] Se han extraído ${listaPuntos.length} puntos correctamente.`);
        return listaPuntos;

    } catch (error) {
        console.error(`[ERROR] Fallo crítico al procesar datos de Google: ${error.message}`);
        return [];
    }
};

/**
 * Función de utilidad para imprimir los puntos en formato JSON.
 */
const imprimirPuntosParaGenerador = (puntos = []) => {
    if (puntos.length === 0) return;

    console.info("\n--- LISTA DE PUNTOS PARA GENERADOR-UNIVERSAL ---");
    const nombres = puntos.map(p => p.nombre).join(", ");
    console.info(`Puntos: ${nombres}\n`);
    console.info(JSON.stringify(puntos, null, 2));
};

module.exports = {
    procesarPeticionGoogle,
    imprimirPuntosParaGenerador
};
