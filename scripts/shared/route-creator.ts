/**
 * Script puente para generar rutas a partir de un archivo JSON de Google Maps.
 * Funciona leyendo un archivo local `google-input.json`, extrayendo las coordenadas 
 * mediante un parser y enviando esos puntos a un servicio creador de rutas.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as parserGoogle from '../parser-gjson';
import * as servicioRutas from '../route-service';
import { PuntoRuta } from '../interfaces/interfaces';

/**
 * Ruta absoluta del archivo de entrada que contiene el JSON exportado de Google Maps.
 */
const RUTA_ARCHIVO_ENTRADA = path.join(process.cwd(), 'google-input.json');

/**
 * Obtiene el nombre de la ruta desde los argumentos de la línea de comandos.
 */
const obtenerNombreRuta = (): string => {
    const argumentos = process.argv.slice(2);
    return argumentos[0] || "Nueva Ruta Google";
};

/**
 * Lee el archivo JSON de entrada.
 */
const leerDatosEntrada = (ruta: string): unknown => {
    if (!fs.existsSync(ruta)) {
        console.error(`[ERROR] No se encuentra el archivo: ${ruta}`);
        console.info(`[TIP] Crea el archivo 'google-input.json' en la raíz y pega el contenido de Google Maps.`);
        process.exit(1);
    }
    console.info(`[INFO] Leyendo datos de: ${ruta}...`);
    const contenido = fs.readFileSync(ruta, 'utf8');
    return JSON.parse(contenido);
};



/**
 * Procesa los datos JSON y extrae los puntos formateados.
 */
const prepararPuntosParaEnvio = (datosJson: unknown): PuntoRuta[] => {
    const puntosExtraidos = parserGoogle.procesarPeticionGoogle(datosJson);

    if (puntosExtraidos.length === 0) {
        throw new Error("No se pudieron extraer puntos válidos del JSON de Google.");
    }

    console.info(`[INFO] Procesando ${puntosExtraidos.length} puntos extraídos...`);

    return puntosExtraidos.map(p => ({
        nombre: p.nombre,
        lat: p.lat,
        lng: p.lng
    }));
};

/**
 * Función principal asíncrona que coordina la lectura, parseo y creación de la ruta.
 * 
 */
const ejecutarProcesamientoGoogle = async (): Promise<void> => {
    try {
        const nombreRuta = obtenerNombreRuta();
        const datosJson = leerDatosEntrada(RUTA_ARCHIVO_ENTRADA);
        const puntosAEnviar = prepararPuntosParaEnvio(datosJson);

        await servicioRutas.crearRutaDesdePuntos(nombreRuta, puntosAEnviar);

        console.info(`[SUCCESS] ¡Proceso completado con éxito!`);
        process.exit(0);

    } catch (error) {
        const err = error as Error;
        console.error(`[ERROR] Fallo en el generador desde Google: ${err.message}`);
        process.exit(1);
    }
};

// Comprueba si este script se está ejecutando directamente desde Node.js
if (process.argv[1] && process.argv[1].includes('generador-desde-google')) {
    ejecutarProcesamientoGoogle();
}
