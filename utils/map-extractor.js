"use strict";

/**
 * UTILIDAD DE EXTRACCIÓN MASIVA DE MAPAS
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const storage = require('../services/storage-service');
const geoUtils = require('./geo-utils');

const CITY_RADIUS = 0.065;
const GLOBAL_PMTILES_URL = 'https://build.protomaps.com/20260421.pmtiles';
const PMTILES_EXE = path.join(storage.paths.PROJECT_ROOT, 'pmtiles.exe');

/**
 * Extrae mapas PMTiles para todas las ciudades en data.json.
 */
const extractAllMaps = () => {
    let visits = [];
    const cities = {};

    try {
        visits = storage.readData(storage.paths.DATA_PATH) || [];
        if (!Array.isArray(visits)) throw new Error("Formato de datos inválido");
    } catch (error) {
        console.error(`[ERROR] Error al leer visitas: ${error.message}`);
        return;
    }

    visits.forEach(visit => {
        if (visit.cityId && visit.cityCenter) {
            cities[visit.cityId] = visit.cityCenter;
        }
    });

    const cityIds = Object.keys(cities);
    console.info(`[INFO] Iniciando extracción masiva (${cityIds.length} ciudades)...`);

    cityIds.forEach((cityId, index) => {
        const center = cities[cityId];
        const lat = Number(center.lat || 0);
        const lon = Number(center.lng || center.lon || 0);
        const output = path.join(storage.paths.MAPS_DIR, `${cityId}.pmtiles`);

        console.info(`[PROCESO] [${index + 1}/${cityIds.length}] Ciudad: ${cityId}`);

        const bbox = [
            (lon - CITY_RADIUS).toFixed(4),
            (lat - CITY_RADIUS).toFixed(4),
            (lon + CITY_RADIUS).toFixed(4),
            (lat + CITY_RADIUS).toFixed(4)
        ].join(',');

        try {
            if (fs.existsSync(output)) fs.unlinkSync(output);
            const command = `"${PMTILES_EXE}" extract "${GLOBAL_PMTILES_URL}" "${output}" --bbox="${bbox}" --maxzoom=18`;
            execSync(command, { stdio: 'inherit' });
            console.info(`[SUCCESS] Mapa generado: ${output}`);
        } catch (error) {
            console.error(`[ERROR] Fallo en extracción de ${cityId}:`, error.message);
        }
    });
};

if (require.main === module) {
    extractAllMaps();
}

module.exports = { extractAllMaps };
