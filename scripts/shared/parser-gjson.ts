/**
 * Analizador parser para convertir datos de Google Maps al formato del sistema GJSON.
 * Interpreta la respuesta JSON rutas de Google y extrae las coordenadas estructuradas.
 */

/**
 * Interfaz estándar para los puntos ya parseados y listos para nuestro sistema.
 */
export interface PuntoExtraido {
    nombre: string;
    lat: number;
    lng: number;
}

import { UbicacionGoogle, PuntoPasoGoogle, DatosGoogleEstructura } from './interfaces/interfaces';

/**
 * Añade un punto validado a la lista de puntos.
 */
const agregarPunto = (lista: PuntoExtraido[], nombre: string, ubicacion?: UbicacionGoogle): void => {
    if (ubicacion && ubicacion.lat !== undefined && ubicacion.lng !== undefined) {
        lista.push({ nombre, lat: Number(ubicacion.lat), lng: Number(ubicacion.lng) });
    }
};

/**
 * Extrae el punto de origen de la petición.
 */
const extraerOrigen = (peticion: NonNullable<DatosGoogleEstructura['request']>, lista: PuntoExtraido[]): void => {
    if (peticion.origin?.location) {
        agregarPunto(lista, "INICIO_RUTA", peticion.origin.location);
    }
};

/**
 * Extrae los puntos intermedios waypoints de la petición.
 */
const extraerIntermedios = (peticion: NonNullable<DatosGoogleEstructura['request']>, lista: PuntoExtraido[]): void => {
    if (peticion.waypoints && Array.isArray(peticion.waypoints)) {
        peticion.waypoints.forEach((puntoPaso: PuntoPasoGoogle, indice: number) => {
            const ubicacion = (puntoPaso.location && 'location' in puntoPaso.location)
                ? (puntoPaso.location as { location: UbicacionGoogle }).location
                : (puntoPaso.location as UbicacionGoogle | undefined);

            agregarPunto(lista, `PUNTO_INTERMEDIO_${indice + 1}`, ubicacion);
        });
    }
};

/**
 * Extrae el punto de destino final de la petición.
 */
const extraerDestino = (peticion: NonNullable<DatosGoogleEstructura['request']>, lista: PuntoExtraido[]): void => {
    if (peticion.destination?.location) {
        agregarPunto(lista, "FIN_RUTA", peticion.destination.location);
    }
};

/**
 * Procesa un objeto de petición JSON generalmente exportado o capturado desde Google Maps
 * y extrae ordenadamente el inicio, los puntos intermedios y el final de la ruta.
 * 
 */
export const procesarPeticionGoogle = (datosCrudos: unknown): PuntoExtraido[] => {
    try {
        // Convertimos de forma segura tras recibir un 'unknown'
        const datosGoogle = datosCrudos as DatosGoogleEstructura;

        // Validamos la estructura principal del objeto JSON
        if (!datosGoogle || !datosGoogle.request) {
            console.error("[ERROR] El JSON de Google no tiene el formato esperado (falta 'request')");
            return [];
        }

        const peticion = datosGoogle.request;
        const listaPuntos: PuntoExtraido[] = [];

        // Extraemos cada componente de la ruta de forma secuencial
        extraerOrigen(peticion, listaPuntos);
        extraerIntermedios(peticion, listaPuntos);
        extraerDestino(peticion, listaPuntos);

        console.info(`[INFO] Se han extraído ${listaPuntos.length} puntos correctamente.`);
        return listaPuntos;

    } catch (error) {
        // Maneja cualquier excepción no controlada al acceder a las propiedades del objeto
        const err = error as Error;
        console.error(`[ERROR] Fallo crítico al procesar datos de Google: ${err.message}`);
        return [];
    }
};

/**
 * Imprime por consola los puntos extraídos de forma legible. 
 * Muy útil para realizar depuración o para copiarlos fácilmente en otro sistema.
 * 
 */
export const imprimirPuntosParaGenerador = (puntos: PuntoExtraido[] = []): void => {
    // Si no hay puntos, interrumpimos la ejecución prematuramente
    if (puntos.length === 0) return;

    console.info("\n--- LISTA DE PUNTOS PARA GENERADOR-UNIVERSAL ---");
    // Concatenamos únicamente los nombres de los puntos para tener un resumen rápido
    const nombres = puntos.map(p => p.nombre).join(", ");
    console.info(`Puntos: ${nombres}\n`);

    // Mostramos el objeto completo formateado en JSON con indentación de 2 espacios
    console.info(JSON.stringify(puntos, null, 2));
};
