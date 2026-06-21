/**
 * Servicio encargado de la orquestación y creación de nuevas rutas.
 * Gestiona el cálculo del trazado, la descarga de mapas offline y el almacenamiento.
 */

import { execSync } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';

import * as geoUtils from '../utils/geo-utils';
import * as storage from '../storage-service';
import { RouteData } from '../interfaces/interfaces';

/**
 * Nivel de zoom máximo utilizado para descargar los mapas PMTiles.
 * Afecta directamente al peso del archivo final.
 */
const ZOOM_MAXIMO_MAPA = 15;

/**
 * URL de origen desde donde se descarga el mosaico base mundial.
 */
const URL_ORIGEN_PMTILES = "https://build.protomaps.com/20241021.pmtiles";

/**
 * Interfaz que define los puntos con coordenadas exactas extraídos y listos para ser procesados.
 */
export interface PuntoGeocodificado {
    nombre: string;
    lat: number;
    lng: number;
}

/**
 * Crea la carpeta 'offline' si no existe y genera un identificador seguro basado en el nombre.
 * 
 */
const prepararEntorno = (nombreRuta: string): { idRuta: string, carpetaOffline: string } => {
    // Genera un ID amigable a partir del nombre
    const idRuta = nombreRuta.toLowerCase().replace(/\s+/g, '-');
    const carpetaOffline = path.join(process.cwd(), 'offline');

    // Garantiza que la carpeta de mapas offline esté creada
    if (!fs.existsSync(carpetaOffline)) {
        fs.mkdirSync(carpetaOffline, { recursive: true });
    }

    return { idRuta, carpetaOffline };
};

/**
 * Descarga y extrae la porción del mapa necesaria para visualizar la ruta sin conexión.
 * Utiliza la herramienta de línea de comandos 'pmtiles'.
 * 
 */
const extraerMapaOffline = (carpetaOffline: string, idRuta: string, puntos: PuntoGeocodificado[]): void => {
    const rutaSalidaMapa = path.join(carpetaOffline, `${idRuta}.pmtiles`);
    const areaLimite = geoUtils.calcularAreaLimite(puntos);
    const ejecutablePmtiles = path.join(process.cwd(), 'bin', 'pmtiles.exe');

    console.info(`[INFO] Extrayendo mapa PMTiles (BBox: ${areaLimite})...`);

    // Comando para recortar el mapa global ajustándolo al Bounding Box (BBox) de la ruta
    const comandoExtraccion = `"${ejecutablePmtiles}" extract "${URL_ORIGEN_PMTILES}" "${rutaSalidaMapa}" --bbox="${areaLimite}" --maxzoom=${ZOOM_MAXIMO_MAPA}`;

    try {
        console.info(`[INFO] Ejecutando comando pmtiles...`);
        // Ejecuta el proceso de forma síncrona mostrando la salida estándar en consola
        execSync(comandoExtraccion, { stdio: 'inherit' });
        console.info(`[SUCCESS] Mapa generado con éxito en: ${rutaSalidaMapa}`);
    } catch (errorMapa) {
        if (errorMapa instanceof Error) {
            console.error(`[ERROR] Fallo al extraer mapa: ${errorMapa.message}`);
            console.info(`[TIP] Verifica que tienes conexión a internet para descargar el segmento del mapa.`);
        }
    }
};

/**
 * Empaqueta toda la información generada en un objeto y la guarda en la base de datos JSON local.
 * 
 */
const construirYGuardarRuta = (
    idRuta: string,
    nombreRuta: string,
    puntos: PuntoGeocodificado[],
    datosRuta: unknown
): RouteData => {
    // Establecemos el primer punto de la ruta como el centro inicial del mapa
    const centro = { lat: puntos[0].lat, lng: puntos[0].lng };

    const nuevaEntrada: RouteData = {
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

    // Almacena físicamente el objeto en todos los ficheros del sistema
    storage.actualizarEntradaEnTodosLosArchivos(nuevaEntrada);
    return nuevaEntrada;
};

/**
 * Función principal que procesa y ensambla una ruta completa partiendo de una lista
 * de coordenadas iniciales. Calcula el trazado, descarga el mapa y actualiza la base de datos local.
 * 
 */
export const crearRutaDesdePuntos = async (nombreRuta: string = "", puntos: PuntoGeocodificado[] = []): Promise<RouteData> => {
    try {
        console.info(`\n[INFO] >>> GENERANDO RUTA DESDE PUNTOS: ${nombreRuta.toUpperCase()}`);

        // Validación inicial estricta
        if (puntos.length < 2) {
            throw new Error("Se necesitan al menos 2 puntos para generar una ruta válida.");
        }

        // 1. Preparación de variables e infraestructura de directorios
        const { idRuta, carpetaOffline } = prepararEntorno(nombreRuta);

        // 2. Cálculo geométrico del camino real utilizando servicios externos
        console.info(`[INFO] Calculando trazado peatonal...`);
        const datosRuta = await geoUtils.obtenerGeometriaRuta(puntos);

        // 3. Obtención y recorte del mapa cartográfico offline
        extraerMapaOffline(carpetaOffline, idRuta, puntos);

        // 4. Compilación del resultado y guardado persistente en disco
        const nuevaEntrada = construirYGuardarRuta(idRuta, nombreRuta, puntos, datosRuta);

        console.info(`[SUCCESS] <<< PROCESO FINALIZADO PARA "${nombreRuta}"\n`);
        return nuevaEntrada;

    } catch (error) {
        if (error instanceof Error) {
            console.error(`[ERROR] Fallo en crearRutaDesdePuntos: ${error.message}`);
        }
        throw error;
    }
};
