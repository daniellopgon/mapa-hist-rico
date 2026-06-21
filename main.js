/**
 * @fileoverview Orquestador principal del servidor de rutas.
 * Cumple con las 24 normas (Español, Strict Mode, No Globales).
 */
'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const servicioRutas = require('./services/route-service');

const servidorExpress = express();
const PUERTO = process.env.PORT || 3000;

// --- CONFIGURACIÓN ---
servidorExpress.use(cors());
servidorExpress.use(express.json());

// Servir la aplicación frontend (carpeta raíz o según estructura)
servidorExpress.use(express.static(path.join(process.cwd())));

// --- ENDPOINTS (API ESPAÑOL) ---

/**
 * Endpoint para crear una nueva ciudad con monumentos y mapa.
 * Body esperado: { ciudad: "Nombre", monumentos: ["M1", "M2"] }
 */
servidorExpress.post('/api/crear-ruta-ciudad', async (solicitud, respuesta) => {
    try {
        const { ciudad, monumentos } = solicitud.body;

        if (!ciudad || !Array.isArray(monumentos)) {
            return respuesta.status(400).json({
                error: 'Faltan parámetros obligatorios: ciudad (string) y monumentos (array).'
            });
        }

        const resultado = await servicioRutas.crearRutaCompletaCiudad(ciudad, monumentos);
        
        return respuesta.status(200).json({
            mensaje: `Ruta de ${ciudad} generada con éxito`,
            datos: resultado
        });

    } catch (error) {
        console.error(`[ERROR] Fallo en /api/crear-ruta-ciudad: ${error.message}`);
        return respuesta.status(500).json({
            error: 'Ocurrió un error interno al generar la ruta.',
            detalle: error.message
        });
    }
});

/**
 * Redirección de SPA: Cualquier ruta no encontrada sirve el index.html
 */
servidorExpress.get('*', (solicitud, respuesta) => {
    respuesta.sendFile(path.join(process.cwd(), 'index.html'));
});

// --- INICIO DEL SERVIDOR ---
servidorExpress.listen(PUERTO, () => {
    console.info(`\n[INFO] Servidor de Rutas iniciado satisfactoriamente.`);
    console.info(`[INFO] Escuchando en: http://localhost:${PUERTO}`);
    console.info(`[INFO] API disponible en: http://localhost:${PUERTO}/api/crear-ruta-ciudad\n`);
});
