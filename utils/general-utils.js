/**
 * @fileoverview Utilidades genéricas del sistema.
 */
'use strict';

/**
 * Detiene la ejecución durante el tiempo especificado.
 */
const esperar = (milisegundos = 1000) => {
    return new Promise(resolver => setTimeout(resolver, milisegundos));
};

/**
 * Normaliza un nombre para convertirlo en un identificador válido (slug).
 */
const normalizarIdentificador = (nombre = "") => {
    return nombre.toLowerCase().trim().replace(/\s+/g, '_');
};

module.exports = {
    esperar,
    normalizarIdentificador
};
