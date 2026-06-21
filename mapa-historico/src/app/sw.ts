/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { RangeRequestsPlugin } from 'workbox-range-requests';

declare let self: ServiceWorkerGlobalScope;

// Tomar control inmediato
self.skipWaiting();
clientsClaim();

// Precache resources generados por Vite
precacheAndRoute(self.__WB_MANIFEST);

// Limpiar caches viejos automáticamente
cleanupOutdatedCaches();

// ==========================================
// Estrategia Offline para Archivos PMTiles
// ==========================================
// Los archivos .pmtiles son descargados y almacenados en caché.
// Como Leaflet-Protomaps usa HTTP Range Requests (206 Partial Content) para leer solo 
// ciertas partes del archivo gigante, el RangeRequestsPlugin asegura que el Service Worker 
// "trocee" el archivo del caché correctamente para responder al mapa sin gastar RAM.
registerRoute(
  ({ request, url }) => {
    // Solo interceptamos peticiones locales (mismo servidor) que terminen en .pmtiles
    // Esto evita que el SW bloquee la descarga inicial desde el servidor externo R2/GitHub
    const isLocal = url.origin === self.location.origin;
    const isPmtiles = url.pathname.endsWith('.pmtiles') || request.url.endsWith('.pmtiles');
    return isLocal && isPmtiles;
  },
  new CacheFirst({
    cacheName: 'pmtiles-cache',
    plugins: [
      new RangeRequestsPlugin(), // ¡CRÍTICO para PMTiles offline!
    ],
  })
);

// Estrategia para data.json: Siempre intentar red primero
registerRoute(
  ({ url }) => url.pathname.endsWith('data.json'),
  new NetworkFirst({
    cacheName: 'data-cache'
  })
);
