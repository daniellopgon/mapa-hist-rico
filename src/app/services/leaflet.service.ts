import { Injectable } from '@angular/core';
import L from 'leaflet';
import { DatosMapa, Marcador } from '../models/datos-mapa';
import { CONFIG_MAPA } from '../global/constants';

@Injectable({
  providedIn: 'root'
})
export class ServicioVisorMapa {
  private mapaInstancia: L.Map | null = null;
  private capasMarcadores: L.LayerGroup = new L.LayerGroup();

  /**
   * Carga los pines y el mapa.
   */
  public cargarPinesYMapa(datosMapa: DatosMapa): void {
    console.info('[ServicioVisorMapa] cargarPinesYMapa() llamado con:', datosMapa);
    this.limpiarCapasAntiguas();

    if (datosMapa.centroCiudad) {
      this.centrarCamara(datosMapa.centroCiudad, datosMapa.zoom || 13);
    }

    if (datosMapa.marcadores) {
      this.dibujarPines(datosMapa.marcadores);
    }
  }

  /**
   * Crea un mapa, le da unas coordenadas un zoom y una capa del ign de España
   */
  public inicializarMapaIGN(contenedor: HTMLElement): void {
    console.info('[ServicioVisorMapa] inicializarMapaIGN() creando instancia en DOM...');

    // Creamos el mapa permitiendo zoom con decimales para un ajuste perfecto
    this.mapaInstancia = new L.Map(contenedor, {
      center: CONFIG_MAPA.CENTRO_AVILA,
      zoomSnap: 0.1, // Permite zooms fraccionados
      maxZoom: CONFIG_MAPA.MAX_ZOOM,
      maxBoundsViscosity: 1.0 // CRÍTICO: Esto hace que el borde del mapa sea un muro sólido y no elástico al arrastrar
    });

    // Mapa histórico
    L.tileLayer(CONFIG_MAPA.ARCGIS_URL, {
      attribution: CONFIG_MAPA.ATRIBUCION,
      noWrap: true
    }).addTo(this.mapaInstancia);

    // Ajustamos la pantalla la primera vez de forma síncrona
    this.ajustarZoomCobertura();

    // Si el usuario redimensiona la ventana o gira el móvil, recalculamos la caja
    window.addEventListener('resize', () => {
      this.ajustarZoomCobertura();
    });

    // Evento de zoom para ocultar/mostrar textos
    this.mapaInstancia.on('zoomend', () => {
      if (this.mapaInstancia) {
        const currentZoom = this.mapaInstancia.getZoom();
        // Umbral adaptado al mapa histórico (zoom min 15 - max 19)
        if (currentZoom < 16.2) {
          contenedor.classList.add('zoom-far');
        } else {
          contenedor.classList.remove('zoom-far');
        }
      }
    });
    
    console.info('[ServicioVisorMapa] Capa tileLayer añadida al mapa.');
  }

  /**
   * Forma limpia de calcular matemáticamente el zoom exacto para el efecto 'cover'
   * sin depender de un timeout.
   */
  private ajustarZoomCobertura(): void {
    if (!this.mapaInstancia) return;
    
    this.mapaInstancia.invalidateSize();
    const mapSize = this.mapaInstancia.getSize();
    
    // Si el div todavía mide 0, esperamos al siguiente ciclo de renderizado
    if (mapSize.x === 0 || mapSize.y === 0) {
      requestAnimationFrame(() => this.ajustarZoomCobertura());
      return;
    }

    const limitesAvila = L.latLngBounds(CONFIG_MAPA.LIMITES_AVILA);

    let zoomOptimo = CONFIG_MAPA.MIN_ZOOM_LOD;
    for (let z = CONFIG_MAPA.MIN_ZOOM_LOD; z <= CONFIG_MAPA.MAX_ZOOM; z += 0.1) {
      const p1 = this.mapaInstancia.project(limitesAvila.getNorthWest(), z);
      const p2 = this.mapaInstancia.project(limitesAvila.getSouthEast(), z);
      const width = Math.abs(p2.x - p1.x);
      const height = Math.abs(p2.y - p1.y);

      if (width >= mapSize.x && height >= mapSize.y) {
        zoomOptimo = z;
        break;
      }
    }

    this.mapaInstancia.setMinZoom(zoomOptimo);
    this.mapaInstancia.setMaxBounds(limitesAvila);
    
    // Solo forzamos el zoom de la cámara si el actual se ha quedado "pequeño"
    if (isNaN(this.mapaInstancia.getZoom()) || this.mapaInstancia.getZoom() < zoomOptimo) {
      this.mapaInstancia.setZoom(zoomOptimo);
    }
  }

  /**
   * Elimina todas las capas del mapa ya sean pines o lineas de rutas.
   */
  public limpiarCapasAntiguas(): void {
    if (this.mapaInstancia) {
      this.mapaInstancia.eachLayer((capa) => {
        const isUnPin: boolean = capa instanceof L.Marker;
        if (isUnPin && this.mapaInstancia) {
          this.mapaInstancia.removeLayer(capa);
        }
      });
    }
  }

  private createIcon(marcador: Marcador, isGray: boolean): L.DivIcon {
    const html = `
        <div class="smartguide-marker ${isGray ? 'sg-marker-gray' : 'sg-marker-color'}">
            <div class="sg-pin">
                <div class="sg-photo" style="background-image: url('${marcador.imagen || ''}');"></div>
            </div>
            <div class="sg-star">★</div>
            <div class="sg-label">${marcador.nombre}</div>
        </div>
    `;

    return L.divIcon({
        html: html,
        className: '',
        iconSize: [250, 160],
        iconAnchor: [125, 120]
    });
  }

  /**
   * Recorre la lista de marcadores y añade un pin en el mapa por cada uno.
   * Devuelve la cantidad de pines añadidos con éxito.
   */
  public dibujarPines(marcadores: Marcador[]): number {
    let cantidadPinesAñadidos: number = 0;

    if (this.mapaInstancia) {
      const markersData: { marker: L.Marker, marcador: Marcador }[] = [];
      let initialMarker: L.Marker | null = null;

      const resetMarkers = () => {
          markersData.forEach(m => m.marker.setIcon(this.createIcon(m.marcador, true)));
          if (initialMarker && marcadores.length > 0) {
              initialMarker.setIcon(this.createIcon(marcadores[0], false));
          }
      };

      marcadores.forEach((marcador: Marcador, index: number) => {
        const latitud: number = marcador.coordenadas[0];
        const longitud: number = marcador.coordenadas[1];
        const isFirst = index === 0;

        const marker = L.marker([latitud, longitud], { 
            icon: this.createIcon(marcador, !isFirst),
            title: marcador.nombre,
            riseOnHover: true,
            zIndexOffset: isFirst ? 100 : 0
        }).addTo(this.mapaInstancia!);

        if (isFirst) initialMarker = marker;
        markersData.push({ marker, marcador });

        marker.on('mouseover', (e) => {
            markersData.forEach(m => m.marker.setIcon(this.createIcon(m.marcador, true)));
            (e.target as L.Marker).setIcon(this.createIcon(marcador, false));
        });

        marker.on('mouseout', () => {
            resetMarkers();
        });
      });

      cantidadPinesAñadidos = marcadores.length;
    }

    return cantidadPinesAñadidos;
  }

  /**
   * Centra la cámara del mapa matemáticamente en unas coordenadas exactas
   */
  private centrarCamara(coordenadasCentro: [number, number], nivelZoom: number): void {
    if (this.mapaInstancia) {
      this.mapaInstancia.setView(coordenadasCentro, nivelZoom);
    }
  }

  public destruirMapa(): void {
    if (this.mapaInstancia) {
      this.mapaInstancia.remove();
      this.mapaInstancia = null;
    }
  }
}