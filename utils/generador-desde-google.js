/**
 * @fileoverview Script puente para generar rutas a partir de un archivo JSON de Google Maps.
 * Uso: node utils/generador-desde-google.js "Nombre de la Ruta"
 */
'use strict';

const fs = require('fs');
const path = require('path');
const parserGoogle = require('./google-parser');
const servicioRutas = require('../services/route-service');

const RUTA_ARCHIVO_ENTRADA = path.join(process.cwd(), 'google-input.json');

const ejecutarProcesamientoGoogle = async () => {
    try {
        const argumentos = process.argv.slice(2);
        const nombreRuta = argumentos[0] || "Nueva Ruta Google";

        // 1. Validar existencia del archivo
        if (!fs.existsSync(RUTA_ARCHIVO_ENTRADA)) {
            console.error(`[ERROR] No se encuentra el archivo: ${RUTA_ARCHIVO_ENTRADA}`);
            console.info(`[TIP] Crea el archivo 'google-input.json' en la raíz y pega el contenido de Google Maps.`);
            process.exit(1);
        }

        // 2. Leer y parsear el JSON de entrada
        console.info(`[INFO] Leyendo datos de: ${RUTA_ARCHIVO_ENTRADA}...`);
        const contenido = fs.readFileSync(RUTA_ARCHIVO_ENTRADA, 'utf8');
        const datosJson = JSON.parse(contenido);

        // 3. Extraer puntos usando el parser profesional
        const puntosExtraidos = parserGoogle.procesarPeticionGoogle(datosJson);

        if (puntosExtraidos.length === 0) {
            throw new Error("No se pudieron extraer puntos válidos del JSON de Google.");
        }

        // 4. Lanzar el proceso completo (Trazado + Mapa + Persistencia)
        console.info(`[INFO] Procesando ${puntosExtraidos.length} puntos extraídos...`);
        await servicioRutas.crearRutaDesdePuntos(nombreRuta, puntosExtraidos);

        console.info(`[SUCCESS] ¡Proceso completado con éxito!`);
        process.exit(0);

    } catch (error) {
        console.error(`[ERROR] Fallo en el generador desde Google: ${error.message}`);
        process.exit(1);
    }
};

ejecutarProcesamientoGoogle();
