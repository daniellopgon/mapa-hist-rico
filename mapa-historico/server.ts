import express, { Request, Response } from 'express';
import cors from 'cors';
import * as path from 'path';
import * as dotenv from 'dotenv';
import * as servicioRutas from './scripts/route-service';
import * as geoUtils from './scripts/utils/geo-utils';

dotenv.config();

const servidorExpress = express();
const PUERTO = process.env['PORT'] || 3000;

servidorExpress.use(cors());
servidorExpress.use(express.json());
servidorExpress.use(express.static(path.join(process.cwd())));

servidorExpress.post('/api/crear-ruta-ciudad', async (solicitud: Request, respuesta: Response): Promise<void> => {
    try {
        const { ciudad, monumentos } = solicitud.body;

        if (!ciudad || !Array.isArray(monumentos)) {
            respuesta.status(400).json({ error: 'Faltan parámetros obligatorios: ciudad (string) y monumentos (array).' });
            return;
        }

        const puntos = [];
        for (const monumento of monumentos) {
            const coords = await geoUtils.obtenerCoordenadas(`${monumento}, ${ciudad}`);
            if (coords) {
                puntos.push({ nombre: monumento, lat: coords.lat, lng: coords.lon });
            }
        }

        if (puntos.length < 2) {
            respuesta.status(400).json({ error: 'No se encontraron suficientes coordenadas para generar la ruta.' });
            return;
        }

        const resultado = await servicioRutas.crearRutaDesdePuntos(ciudad, puntos);

        respuesta.status(200).json({
            mensaje: `Ruta de ${ciudad} generada con éxito`,
            datos: resultado
        });
    } catch (error) {
        const err = error as Error;
        console.error(`[ERROR] Fallo en /api/crear-ruta-ciudad: ${err.message}`);
        respuesta.status(500).json({
            error: 'Ocurrió un error interno al generar la ruta.',
            detalle: err.message
        });
    }
});

servidorExpress.get('*', (solicitud: Request, respuesta: Response) => {
    respuesta.sendFile(path.join(process.cwd(), 'index.html'));
});

servidorExpress.listen(PUERTO, () => {
    console.info(`\n[INFO] Servidor de Rutas iniciado satisfactoriamente.`);
    console.info(`[INFO] Escuchando en: http://localhost:${PUERTO}`);
    console.info(`[INFO] API disponible en: http://localhost:${PUERTO}/api/crear-ruta-ciudad\n`);
});
