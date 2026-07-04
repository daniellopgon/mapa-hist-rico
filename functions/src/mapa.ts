import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { DatosMapa } from './models/datos-mapa';

export const obtenerMapa = onCall({ region: 'europe-west1' }, (request) => {

    const data: any = request.data;
    if (!data.idCiudad) {
        throw new HttpsError('invalid-argument', 'Parámetros inválidos');
    }

    return new Promise<DatosMapa>(async (resolve, reject) => {
        try {
            const ciudadId: string = data.idCiudad;

            const datosMapa = await getDatosMapa(ciudadId);

            resolve(datosMapa);

        } catch (error) {
            console.error('[map.functions.ts - obtenerMapa] ERROR general:', error);
            reject(error);
        }
    });
});

async function getDatosMapa(ciudadId: string): Promise<DatosMapa> {
   
    let mapaResultante: DatosMapa = {} as DatosMapa;

    
    const parametrosConsulta: string = `ciudad=${ciudadId}`;
    const urlApi: string = `https://api.tudominio.com/mapas?${parametrosConsulta}`;
    
    console.info(`[Backend API] Buscando mapa: Query="${parametrosConsulta}"`);

    
    const opcionesFetch: RequestInit = {
        method: "GET",
        headers: {
            "Accept": "application/json"
        }
    };

    const peticion = await fetch(urlApi, opcionesFetch);

    if (!peticion.ok) {
        console.error(`[Backend API] Fallo al consultar servidor externo: ${peticion.status}`);
    } else {
        
        const datosCrudos = await peticion.json() as { resultado: DatosMapa };
        
        if (datosCrudos && datosCrudos.resultado) {
            mapaResultante = datosCrudos.resultado;
            console.log('[Backend API] Mapa recuperado con éxito');
        }
    }

    return mapaResultante;
}