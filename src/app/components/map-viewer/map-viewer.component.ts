import { Component, effect, inject, viewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { MapStateService } from '../../services/map-state.service';
import L, { Icon, geoJSON as leafletGeoJSON, GeoJSON, Marker, marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as protomapsL from 'protomaps-leaflet';
import { PMTiles } from "pmtiles";
import { CONFIG_MAPA, CONFIG_ICONO } from '../../shared/constants';
import { obtenerMapaLocalmente } from '../../shared/storage';
import { FuenteDeBlob } from '../../services/map-downloader.service';
import { decodificarPolilinea } from '../../utils/utils';
import { VisitaCruda, MarcadorCrudo } from '../../interfaces/interfaces';

@Component({
  selector: 'app-map-viewer',
  standalone: true,
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.css'
})
export class MapViewerComponent implements AfterViewInit, OnDestroy {
  public mapState = inject(MapStateService);
  private mapContainer = viewChild.required<ElementRef>('mapContainer');

  private mapaLeaflet: any = null;
  private capaVectorialActual: any = null;

  constructor() {
    Icon.Default.mergeOptions({
      iconUrl: CONFIG_ICONO.ESTANDAR.urlIcono,
      iconRetinaUrl: CONFIG_ICONO.ESTANDAR.urlIconoRetina,
      shadowUrl: CONFIG_ICONO.ESTANDAR.urlSombra,
    });
    // Eliminar el prototipo para forzar nuestras rutas
    delete (Icon.Default.prototype as any)._getIconUrl;

    effect(() => {
      const visita = this.mapState.visitaSeleccionada();
      if (visita && this.mapaLeaflet) {
        this.cargarVisita(visita);
      }
    });
  }

  ngAfterViewInit() {
    this.mapaLeaflet = new Map(this.mapContainer().nativeElement);
    const visita = this.mapState.visitaSeleccionada();
    if (visita) {
      this.cargarVisita(visita);
    }
  }

  ngOnDestroy() {
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
      this.mapaLeaflet = null;
    }
  }

  volver() {
    this.mapState.seleccionarVisita(null);
  }

  private async inicializarCapaVectorial(urlOBlobPmtiles?: string | Blob) {
    if (!this.mapaLeaflet) return;
    const fuente = urlOBlobPmtiles || CONFIG_MAPA.URL_PMTILES;
    if (!fuente) return;

    if (this.capaVectorialActual) {
      this.mapaLeaflet.removeLayer(this.capaVectorialActual);
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

    this.capaVectorialActual = protomapsL.leafletLayer(configuracionCapa);
    this.capaVectorialActual.addTo(this.mapaLeaflet);
  }

  private async cargarVisita(datosVisita: VisitaCruda) {
    if (!this.mapaLeaflet) return;

    // Limpiar capas previas
    this.mapaLeaflet.eachLayer((capa: any) => {
      if (capa instanceof Marker || capa instanceof GeoJSON || capa instanceof L.Polyline) {
        if (!(capa as any)._url) {
          this.mapaLeaflet?.removeLayer(capa);
        }
      }
    });

    const blobLocal = await obtenerMapaLocalmente(datosVisita.idCiudad);

    if (blobLocal) {
      await this.inicializarCapaVectorial(blobLocal);
    } else {
      let urlRemota = datosVisita.urlPmtiles || CONFIG_MAPA.URL_PMTILES;
      urlRemota = urlRemota.replace('{idCiudad}', datosVisita.idCiudad);
      await this.inicializarCapaVectorial(urlRemota);
    }

    const puntosInteres = datosVisita.marcadores.map((m: MarcadorCrudo) => ({
      lat: m.coordenadas[0],
      lng: m.coordenadas[1],
      titulo: m.nombre
    }));

    puntosInteres.forEach(p => {
      marker([p.lat, p.lng]).addTo(this.mapaLeaflet!).bindPopup(p.titulo);
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
        capaRuta.addTo(this.mapaLeaflet!);
        if (coordenadas.length > 0) {
          this.mapaLeaflet!.fitBounds(L.latLngBounds(coordenadas), { padding: [50, 50] });
        } else if (capaRuta.getBounds && capaRuta.getBounds().isValid()) {
          this.mapaLeaflet!.fitBounds(capaRuta.getBounds(), { padding: [50, 50] });
        }
      }
    } else if (puntosInteres.length > 0) {
      this.mapaLeaflet!.setView([puntosInteres[0].lat, puntosInteres[0].lng], 14);
    }
  }
}
