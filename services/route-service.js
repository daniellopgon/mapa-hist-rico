/**
 * @fileoverview Servicio para la generación de rutas universales y extracción de mapas.
 * Cumple con las 24 normas de desarrollo.
 */
'use strict';

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const geoUtils = require('../utils/geo-utils');
const storage = require('./storage-service');


const ZOOM_MAXIMO_MAPA = 15;
const URL_ORIGEN_PMTILES = "https://build.protomaps.com/20241021.pmtiles";

/**
 * Procesa una ruta partiendo de puntos ya geocodificados.
 */
const crearRutaDesdePuntos = async (nombreRuta = "", puntos = []) => {
    try {
        console.info(`\n[INFO] >>> GENERANDO RUTA DESDE PUNTOS: ${nombreRuta.toUpperCase()}`);

        if (puntos.length < 2) {
            throw new Error("Se necesitan al menos 2 puntos.");
        }

        const idRuta = nombreRuta.toLowerCase().replace(/\s+/g, '-');
        const carpetaOffline = path.join(process.cwd(), 'offline');

        if (!fs.existsSync(carpetaOffline)) {
            fs.mkdirSync(carpetaOffline, { recursive: true });
        }

        const centro = { lat: puntos[0].lat, lng: puntos[0].lng };

        console.info(`[INFO] Calculando trazado peatonal...`);
        const datosRuta = await geoUtils.obtenerGeometriaRuta(puntos);

        const rutaSalidaMapa = path.join(carpetaOffline, `${idRuta}.pmtiles`);
        const areaLimite = geoUtils.calcularAreaLimite(puntos);
        const ejecutablePmtiles = path.join(process.cwd(), 'bin', 'pmtiles.exe');

        console.info(`[INFO] Extrayendo mapa PMTiles (BBox: ${areaLimite})...`);

        const comandoExtraccion = `"${ejecutablePmtiles}" extract "${URL_ORIGEN_PMTILES}" "${rutaSalidaMapa}" --bbox="${areaLimite}" --maxzoom=${ZOOM_MAXIMO_MAPA}`;

        try {
            console.info(`[INFO] Ejecutando comando pmtiles...`);
            execSync(comandoExtraccion, { stdio: 'inherit' });
            console.info(`[SUCCESS] Mapa generado con éxito en: ${rutaSalidaMapa}`);
        } catch (errorMapa) {
            console.error(`[ERROR] Fallo al extraer mapa: ${errorMapa.message}`);
            console.info(`[TIP] Verifica que tienes conexión a internet para descargar el segmento del mapa.`);
        }

        const nuevaEntrada = {
            id: idRuta,
            nombre: nombreRuta,
            centro: centro,
            marcadores: puntos.map(p => ({
                nombre: p.nombre,
                coordenadas: { lat: p.lat, lng: p.lng }
            })),
            rutaGeoJson: datosRuta,
            archivoMapa: `${idRuta}.pmtiles`
        };

        storage.actualizarEntradaEnTodosLosArchivos(nuevaEntrada);
        console.info(`[SUCCESS] <<< PROCESO FINALIZADO PARA "${nombreRuta}"\n`);

        return nuevaEntrada;

    } catch (error) {
        console.error(`[ERROR] Fallo en crearRutaDesdePuntos: ${error.message}`);
        throw error;
    }
};

module.exports = {
    crearRutaDesdePuntos
};
