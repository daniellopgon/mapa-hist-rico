import { openDB } from 'idb';
import { Visita, VisitaCruda } from './interfaces';


const DB_NOMBRE = 'VisitasOfflineDB';
const ALMACEN_RUTAS = 'routes';
const ALMACEN_VISITAS = 'visits';
const ALMACEN_MAPAS = 'maps';
const VERSION_DB = 4;

/**
 * Promesa que inicializa y abre la base de datos IndexedDB.
 * Maneja la creación de almacenes y migraciones de versión.
 */
const promesaDB = openDB(DB_NOMBRE, VERSION_DB, {
    upgrade(db, oldVersion) {
        if (oldVersion < VERSION_DB) {
            if (db.objectStoreNames.contains('visits')) {
                db.deleteObjectStore('visits');
            }
            if (db.objectStoreNames.contains('guides')) {
                db.deleteObjectStore('guides');
            }
            db.createObjectStore(ALMACEN_RUTAS, { keyPath: 'id' });
            db.createObjectStore(ALMACEN_VISITAS, { keyPath: 'id' });

            if (!db.objectStoreNames.contains(ALMACEN_MAPAS)) {
                db.createObjectStore(ALMACEN_MAPAS);
            }
        }
    },
});


/**
 * Guarda una ruta procesada en el almacenamiento local.
 */
export const guardarRutaLocalmente = async (ruta: Visita): Promise<void> => {
    try {
        const db = await promesaDB;
        await db.put(ALMACEN_RUTAS, ruta);
    } catch (error) {
        console.error('[Storage] Error al guardar ruta:', error);
    }
};

/**
 * Recupera todas las rutas almacenadas localmente.
 */
export const obtenerTodasLasRutas = async (): Promise<Visita[]> => {
    try {
        const db = await promesaDB;
        return await db.getAll(ALMACEN_RUTAS);
    } catch (error) {
        console.error('[Storage] Error al obtener rutas:', error);
        return [];
    }
};

/**
 * Elimina todas las rutas del almacenamiento local.
 */
export const limpiarTodasLasRutas = async (): Promise<void> => {
    try {
        const db = await promesaDB;
        await db.clear(ALMACEN_RUTAS);
    } catch (error) {
        console.error('[Storage] Error al limpiar rutas:', error);
    }
};

/**
 * Guarda el archivo binario de un mapa (.pmtiles) localmente.
 */
export const guardarMapaLocalmente = async (id: string, mapaBlob: Blob): Promise<void> => {
    try {
        const db = await promesaDB;
        await db.put(ALMACEN_MAPAS, mapaBlob, id);
    } catch (error) {
        console.error('[Storage] Error al guardar mapa:', error);
    }
};

/**
 * Recupera el archivo binario de un mapa almacenado localmente.
 */
export const obtenerMapaLocalmente = async (id: string): Promise<Blob | undefined> => {
    try {
        const db = await promesaDB;
        return await db.get(ALMACEN_MAPAS, id);
    } catch (error) {
        console.error('[Storage] Error al obtener mapa:', error);
        return undefined;
    }
};

/**
 * Elimina todos los mapas descargados localmente.
 */
export const limpiarTodosLosMapas = async (): Promise<void> => {
    try {
        const db = await promesaDB;
        await db.clear(ALMACEN_MAPAS);
    } catch (error) {
        console.error('[Storage] Error al limpiar mapas:', error);
    }
};


/**
 * Guarda la información básica de una visita en el catálogo local.
 */
export const guardarVisitaLocalmente = async (visita: VisitaCruda): Promise<void> => {
    try {
        const db = await promesaDB;
        await db.put(ALMACEN_VISITAS, visita);
    } catch (error) {
        console.error('[Storage] Error al guardar visita:', error);
    }
};

/**
 * Recupera el catálogo completo de visitas almacenadas localmente.
 */
export const obtenerTodasLasVisitas = async (): Promise<VisitaCruda[]> => {
    try {
        const db = await promesaDB;
        return await db.getAll(ALMACEN_VISITAS);
    } catch (error) {
        console.error('[Storage] Error al obtener catálogo de visitas:', error);
        return [];
    }
};

/**
 * Elimina todo el catálogo de visitas del almacenamiento local.
 */
export const limpiarTodasLasVisitas = async (): Promise<void> => {
    try {
        const db = await promesaDB;
        await db.clear(ALMACEN_VISITAS);
    } catch (error) {
        console.error('[Storage] Error al limpiar catálogo de visitas:', error);
    }
};
