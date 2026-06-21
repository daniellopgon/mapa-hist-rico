import L, { Map, Icon, geoJSON as leafletGeoJSON, GeoJSON, Marker, marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as protomapsL from 'protomaps-leaflet';
import { PMTiles } from "pmtiles";
import {
  guardarVisitaLocalmente,
  obtenerTodasLasVisitas,
  obtenerMapaLocalmente,
  obtenerTodasLasRutas
} from './core/storage';
import { VisitaCruda, MarcadorCrudo } from './core/interfaces';
import { CONFIG_MAPA, CONFIG_ICONO, VALORES_VISITA_DEFECTO, CONFIG_UI } from './core/constants';
import { renderizarTarjetasVisita } from './ui/map-controls';
import { FuenteDeBlob } from './services/map-downloader';
import { decodificarPolilinea, normalizarVisita } from './core/utils';
import './map/style.css';

// Configuración de iconos de Leaflet
Icon.Default.mergeOptions({
  iconUrl: CONFIG_ICONO.ESTANDAR.urlIcono,
  iconRetinaUrl: CONFIG_ICONO.ESTANDAR.urlIconoRetina,
  shadowUrl: CONFIG_ICONO.ESTANDAR.urlSombra,
});

delete (Icon.Default.prototype as any)._getIconUrl;

const mapaLeaflet = new Map(CONFIG_MAPA.ID_CONTENEDOR);
let capaVectorialActual: any = null;

/**
 * Alterna la visibilidad de elementos usando clases CSS.
 */
const alternarVisibilidad = (selector: string, mostrar: boolean) => {
  const elemento = document.getElementById(selector) || document.querySelector(selector);
  if (!elemento) return;
  if (mostrar) {
    elemento.classList.remove(CONFIG_UI.CLASE_OCULTO);
  } else {
    elemento.classList.add(CONFIG_UI.CLASE_OCULTO);
  }
};

/**
 * Inicializa la capa de Protomaps (vectorial) ya sea desde una URL o un Blob local.
 */
const inicializarCapaVectorial = async (urlOBlobPmtiles?: string | Blob) => {
  const fuente = urlOBlobPmtiles || CONFIG_MAPA.URL_PMTILES;
  if (!fuente) return;

  if (capaVectorialActual) {
    mapaLeaflet.removeLayer(capaVectorialActual);
  }

  let configuracionCapa: any = {
    flavor: 'light',
    attribution: CONFIG_MAPA.ATRIBUCION
  };

  if (fuente instanceof Blob) {
    const fuenteBlob = new FuenteDeBlob(fuente);
    const instanciaPmtiles = new PMTiles(fuenteBlob);
    configuracionCapa.url = instanciaPmtiles;
  } else {
    configuracionCapa.url = fuente;
  }

  capaVectorialActual = protomapsL.leafletLayer(configuracionCapa);
  capaVectorialActual.addTo(mapaLeaflet);
};

/**
 * Carga los datos de una visita seleccionada en el mapa.
 */
const cargarVisitaSeleccionada = async (datosVisita: VisitaCruda) => {
  mapaLeaflet.eachLayer(capa => {
    if (capa instanceof Marker || capa instanceof GeoJSON || capa instanceof L.Polyline) {
      if (!(capa as any)._url) {
        mapaLeaflet.removeLayer(capa);
      }
    }
  });

  const blobLocal = await obtenerMapaLocalmente(datosVisita.idCiudad);

  if (blobLocal) {
    await inicializarCapaVectorial(blobLocal);
  } else {
    let urlRemota = datosVisita.urlPmtiles || CONFIG_MAPA.URL_PMTILES;
    urlRemota = urlRemota.replace('{idCiudad}', datosVisita.idCiudad);
    await inicializarCapaVectorial(urlRemota);
  }

  const puntosInteres = datosVisita.marcadores.map((m: MarcadorCrudo) => ({
    lat: m.coordenadas[0],
    lng: m.coordenadas[1],
    titulo: m.nombre
  }));

  puntosInteres.forEach((p: { lat: number; lng: number; titulo: string }) => {
    marker([p.lat, p.lng]).addTo(mapaLeaflet).bindPopup(p.titulo);
  });

  if (datosVisita.rutaPrecalculada) {
    let capaRuta: any;
    let coordenadas: [number, number][] = [];
    const ruta = datosVisita.rutaPrecalculada;

    if (ruta.type === 'LineString' && Array.isArray(ruta.coordinates)) {
      coordenadas = ruta.coordinates.map((p: number[]) => [p[1], p[0]] as [number, number]);
      capaRuta = L.polyline(coordenadas, { color: '#1a73e8', weight: 5, opacity: 0.9 });
    } else if (ruta.type === 'FeatureCollection' || ruta.type === 'Feature') {
      capaRuta = leafletGeoJSON(ruta, { style: { color: '#1a73e8', weight: 5, opacity: 0.9 } });
    } else if (ruta.coordinates && Array.isArray(ruta.coordinates) && ruta.coordinates[0]?.lat !== undefined) {
      coordenadas = ruta.coordinates.map((p: any) => [p.lat, p.lng] as [number, number]);
      capaRuta = L.polyline(coordenadas, { color: '#1a73e8', weight: 5, opacity: 0.9 });
    } else if (typeof ruta === 'string') {
      coordenadas = decodificarPolilinea(ruta);
      capaRuta = L.polyline(coordenadas, { color: '#1a73e8', weight: 5, opacity: 0.9 });
    } else {
      capaRuta = leafletGeoJSON(ruta, { style: { color: '#1a73e8', weight: 5, opacity: 0.9 } });
    }

    if (capaRuta) {
      capaRuta.addTo(mapaLeaflet);
      if (coordenadas.length > 0) {
        mapaLeaflet.fitBounds(L.latLngBounds(coordenadas), { padding: [50, 50] });
      } else if (capaRuta.getBounds && capaRuta.getBounds().isValid()) {
        mapaLeaflet.fitBounds(capaRuta.getBounds(), { padding: [50, 50] });
      }
    }
  } else if (puntosInteres.length > 0) {
    mapaLeaflet.setView([puntosInteres[0].lat, puntosInteres[0].lng], 14);
  }

  alternarVisibilidad('map', true);
  alternarVisibilidad('visit-list', false);
};

/**
 * Añade el botón para volver a la lista de visitas desde el mapa.
 */
const añadirBotonVolver = () => {
  const idBoton = 'back-to-list';
  if (document.getElementById(idBoton)) return;

  const botonVolver = document.createElement('button');
  botonVolver.id = idBoton;
  botonVolver.className = 'btn-volver-mapa';
  botonVolver.innerHTML = '<span>←</span> Volver a la lista';

  botonVolver.onclick = () => {
    alternarVisibilidad('map', false);
    alternarVisibilidad('visit-list', true);
  };

  document.getElementById('map')?.appendChild(botonVolver);
};

/**
 * Gestiona la carga inicial de datos de visitas.
 */
const gestionarConfiguracionInicial = () => {
  fetch(CONFIG_MAPA.URL_DATOS)
    .then(respuesta => respuesta.ok ? respuesta.json() : Promise.reject(new Error(`Error al obtener ${CONFIG_MAPA.URL_DATOS}`)))
    .then(datos => {
      const visitas = (Array.isArray(datos) ? datos : [datos]).map(normalizarVisita);
      visitas.forEach((v: VisitaCruda) => guardarVisitaLocalmente(v));

      renderizarTarjetasVisita(visitas, (visitaSeleccionada: VisitaCruda) => {
        cargarVisitaSeleccionada(visitaSeleccionada);
        mapaLeaflet.invalidateSize();
      });
      añadirBotonVolver();
    })
    .catch(() => {
      obtenerTodasLasVisitas().then(visitasOffline => {
        const visitas = visitasOffline.map(normalizarVisita);
        if (visitas.length > 0) {
          renderizarTarjetasVisita(visitas, (visitaSeleccionada: VisitaCruda) => {
            cargarVisitaSeleccionada(visitaSeleccionada);
            mapaLeaflet.invalidateSize();
          });
          añadirBotonVolver();
        } else {
          obtenerTodasLasRutas().then(rutasLocales => {
            if (rutasLocales.length > 0) {
              const visitasReconstruidas = rutasLocales.map(v => ({
                id: v.id,
                nombre: `${v.cliente} ${VALORES_VISITA_DEFECTO.SUFIJO_OFFLINE}`,
                idCiudad: v.idCiudad || 'avila',
                cliente: v.cliente,
                direccion: v.direccionDestino,
                zoom: CONFIG_MAPA.ZOOM_POR_DEFECTO,
                marcadores: v.puntosInteres?.map((p: { lat: number; lng: number }, i: number) => ({
                  nombre: `Paso ${i + 1}`,
                  coordenadas: [p.lat, p.lng] as [number, number]
                })) || []
              }));
              renderizarTarjetasVisita(visitasReconstruidas as unknown as VisitaCruda[], (visitaSeleccionada: VisitaCruda) => {
                cargarVisitaSeleccionada(visitaSeleccionada);
                mapaLeaflet.invalidateSize();
              });
              añadirBotonVolver();
            }
          });
        }
      });
    });
};

let configuracionFinalizada = false;
const gestionarConfiguracionInicialUnica = () => {
  if (configuracionFinalizada) return;
  configuracionFinalizada = true;
  gestionarConfiguracionInicial();
};

const iniciarAplicacion = () => {
  setTimeout(() => {
    gestionarConfiguracionInicialUnica();
  }, CONFIG_MAPA.TIEMPO_AGOTADO_GPS_MS);
};

mapaLeaflet.on('locationerror', gestionarConfiguracionInicialUnica);
mapaLeaflet.locate(CONFIG_MAPA.OPCIONES_LOCALIZACION);
iniciarAplicacion();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(registro => console.info('Service Worker registrado:', registro.scope))
      .catch(error => console.error('Error al registrar Service Worker:', error));
  });
}
