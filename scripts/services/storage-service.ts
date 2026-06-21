import * as fs from 'fs';
import * as path from 'path';

const RUTA_DATA_JSON = path.join(process.cwd(), 'data.json');
const RUTA_CONSTANTS_JS = path.join(process.cwd(), 'constants.js');

import { MarcadorData, RouteData } from './interfaces/interfaces';

/**
 * Carga los datos desde el archivo JSON principal.
 */
export const cargarDatos = (): RouteData[] => {
    try {
        if (!fs.existsSync(RUTA_DATA_JSON)) {
            return [];
        }
        const contenido = fs.readFileSync(RUTA_DATA_JSON, 'utf8');
        return JSON.parse(contenido) as RouteData[];
    } catch (error) {
        if (error instanceof Error) {
            console.error(`[ERROR] Error al leer data.json: ${error.message}`);
        }
        return [];
    }
};

/**
 * Guarda el array de datos en data.json.
 */
export const guardarDatos = (datos: RouteData[] = []): void => {
    try {
        fs.writeFileSync(RUTA_DATA_JSON, JSON.stringify(datos, null, 4), 'utf8');
        console.info(`[SUCCESS] data.json actualizado correctamente.`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`[ERROR] No se pudo escribir en data.json: ${error.message}`);
        }
    }
};

/**
 * Exporta los datos a un archivo .js como una constante para consumo directo en el frontend.
 */
export const guardarEnConstanteJs = (datos: RouteData[] = []): void => {
    try {
        const contenidoJs = `export const SOURCE_DATA = ${JSON.stringify(datos, null, 4)};`;
        fs.writeFileSync(RUTA_CONSTANTS_JS, contenidoJs, 'utf8');
        console.info(`[SUCCESS] constants.js generado para el frontend.`);
    } catch (error) {
        if (error instanceof Error) {
            console.error(`[ERROR] Error al generar constants.js: ${error.message}`);
        }
    }
};

/**
 * Actualiza o inserta una nueva entrada en ambos sistemas de persistencia.
 */
export const actualizarEntradaEnTodosLosArchivos = (nuevaEntrada: RouteData): void => {
    const todosLosDatos = cargarDatos();
    const indiceExistente = todosLosDatos.findIndex(item => item.id === nuevaEntrada.id);

    if (indiceExistente !== -1) {
        todosLosDatos[indiceExistente] = nuevaEntrada;
        console.info(`[INFO] Actualizando entrada existente: ${nuevaEntrada.nombre}`);
    } else {
        todosLosDatos.unshift(nuevaEntrada);
        console.info(`[INFO] Añadiendo nueva entrada al principio: ${nuevaEntrada.nombre}`);
    }

    guardarDatos(todosLosDatos);
    guardarEnConstanteJs(todosLosDatos);
};
