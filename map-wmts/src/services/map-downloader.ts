import { Source } from 'pmtiles';
import { guardarMapaLocalmente } from '../core/storage';
import { CONFIG_MAPA } from '../core/constants';

/**
 * Adaptador para que Protomaps lea fragmentos de un Blob local.
 * Implementa la interfaz 'Source' de PMTiles.
 */
export class FuenteDeBlob implements Source {
    private datos: Blob;

    constructor(datos: Blob) {
        this.datos = datos;
    }

    getKey() {
        return "fuente-local-blob";
    }

    /** 
     * Obtiene un rango de bytes del Blob.
     * Requerido por la interfaz Source.
     */
    async getBytes(desplazamiento: number, longitud: number): Promise<{ data: ArrayBuffer }> {
        const trozo = this.datos.slice(desplazamiento, desplazamiento + longitud);
        const bufferDeArray = await trozo.arrayBuffer();
        return { data: bufferDeArray };
    }
}

/**
 * Lee un stream de respuesta y reporta el progreso de la descarga.
 */
const leerStreamConProgreso = async (
    lector: ReadableStreamDefaultReader<Uint8Array>,
    total: number,
    alProgresar: (c: number, t: number) => void
): Promise<Blob> => {
    const fragmentos: Uint8Array[] = [];
    let cargado = 0;

    while (true) {
        const { done, value } = await lector.read();
        if (done) break;

        fragmentos.push(value);
        cargado += value.length;
        alProgresar(cargado, total);
    }
    return new Blob(fragmentos);
};

/**
 * Obtiene los datos del mapa, intentando usar streams para el progreso si es posible.
 */
const obtenerDatosDelMapa = async (
    respuesta: Response,
    alProgresar?: (c: number, t: number) => void
): Promise<Blob> => {
    const longitudContenido = respuesta.headers.get('content-length');
    const total = longitudContenido ? Number.parseInt(longitudContenido, 10) : 0;

    if (total > 0 && respuesta.body && alProgresar) {
        try {
            return await leerStreamConProgreso(respuesta.body.getReader(), total, alProgresar);
        } catch (error) {
            console.warn('[Downloader] Fallo en Stream, reintentando descarga directa...', error);
            throw error;
        }
    }

    return await respuesta.blob();
};

/**
 * Función principal para descargar el paquete de mapas de una ciudad.
 */
export const descargarMapaCiudad = async (
    idCiudad: string,
    urlBase: string = CONFIG_MAPA.URL_PMTILES,
    alProgresar?: (c: number, t: number) => void
): Promise<Blob> => {
    try {
        const urlFinal = urlBase.replace('{idCiudad}', idCiudad);
        console.info(`[Downloader] Descargando: ${urlFinal}`);

        const respuesta = await fetch(urlFinal);
        if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);

        const mapaBlob = await obtenerDatosDelMapa(respuesta, alProgresar);

        if (alProgresar) alProgresar(mapaBlob.size, mapaBlob.size);
        await guardarMapaLocalmente(idCiudad, mapaBlob);

        return mapaBlob;
    } catch (error) {
        console.error('[Downloader] Fallo crítico:', error);
        throw error;
    }
};

/** Alias para mantener compatibilidad con nombres antiguos si se prefiere */
export const autodescargarMapa = descargarMapaCiudad;
