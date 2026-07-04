import { Injectable } from "@angular/core";
import { getFunctions, httpsCallable } from "firebase/functions";
import { Functions, HttpsCallable, HttpsCallableResult } from "@firebase/functions";
const REGION = 'europe-west1';
import { DatosMapa } from "../models/datos-mapa";

@Injectable({
    providedIn: 'root'
})
export class MapaService {
    private cache = new Map<string, DatosMapa>();

    constructor() { }

    /**
     * Devuelve el mapa desde la caché si existe, si no, lo pide al backend
     */
    public async obtenerMapa(ciudadId: string): Promise<DatosMapa | null> {
        let mapaResultante: DatosMapa | null = null;

        if (this.cache.has(ciudadId)) {

            mapaResultante = this.cache.get(ciudadId) as DatosMapa;
            console.info(`[MapaService] Mapa recuperado de caché: ${ciudadId}`);
        } else {

            mapaResultante = await this.buscarMapaBackend(ciudadId);

            if (mapaResultante) {
                this.cache.set(ciudadId, mapaResultante);
            }
        }

        return mapaResultante;
    }

    /**
 * Conecta con Firebase Cloud Functions con tipado estricto
 */
    private async buscarMapaBackend(ciudadId: string): Promise<DatosMapa | null> {
        let mapaResultante: DatosMapa | null = null;

        try {
            const functions: Functions = getFunctions(undefined, REGION);

            const llamadaBackend: HttpsCallable<{ idCiudad: string }, DatosMapa> = httpsCallable(functions, 'obtenerMapa');

            const result: HttpsCallableResult<DatosMapa> = await llamadaBackend({ idCiudad: ciudadId });

            mapaResultante = result.data;
            console.log(`[MapaService] Mapa descargado exitosamente para: ${ciudadId}`);

        } catch (error) {
            console.error('@[mapa.service.ts - buscarMapaBackend] Error llamando a Firebase:', error);
        }

        return mapaResultante;
    }


}