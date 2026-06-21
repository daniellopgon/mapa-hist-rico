import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as storage from './storage-service';
import { RouteData } from '../interfaces/interfaces';

const CITY_RADIUS = 0.065;
const GLOBAL_PMTILES_URL = 'https://build.protomaps.com/20260421.pmtiles';
const PMTILES_EXE = path.join(process.cwd(), 'bin', 'pmtiles.exe');

/**
 * Analiza los datos guardados y extrae una lista única de ciudades con su centro.
 */
const cargarCiudadesUnicas = (): Record<string, { lat: number, lng: number }> => {
    let visits: RouteData[] = [];
    const cities: Record<string, { lat: number, lng: number }> = {};

    try {
        visits = storage.cargarDatos() || [];
        if (!Array.isArray(visits)) throw new Error("Formato de datos inválido");
    } catch (error) {
        const err = error as Error;
        console.error(`[ERROR] Error al leer visitas: ${err.message}`);
        return cities;
    }

    visits.forEach((visit: RouteData) => {
        if (visit.id && visit.centro) {
            cities[visit.id] = visit.centro;
        }
    });

    return cities;
};

/**
 * Calcula el BBox de una ciudad y descarga su mapa base local mediante pmtiles.
 */
const extraerMapaCiudad = (cityId: string, lat: number, lon: number): void => {
    const outputDir = path.join(process.cwd(), 'offline');

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const output = path.join(outputDir, `${cityId}.pmtiles`);

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
        const err = error as Error;
        console.error(`[ERROR] Fallo en extracción de ${cityId}:`, err.message);
    }
};

/**
 * Extrae mapas PMTiles para todas las ciudades detectadas en los datos del storage.
 */
export const extractAllMaps = (): void => {
    const cities = cargarCiudadesUnicas();
    const cityIds = Object.keys(cities);

    if (cityIds.length === 0) {
        console.warn("[WARN] No se encontraron ciudades para procesar.");
        return;
    }

    console.info(`[INFO] Iniciando extracción masiva (${cityIds.length} ciudades)...`);

    cityIds.forEach((cityId, index) => {
        console.info(`[PROCESO] [${index + 1}/${cityIds.length}] Ciudad: ${cityId}`);
        const center = cities[cityId];
        const lat = Number(center.lat || 0);
        const lon = Number(center.lng || 0);

        extraerMapaCiudad(cityId, lat, lon);
    });
};

if (process.argv[1] && process.argv[1].includes('map-extractor')) {
    extractAllMaps();
}
