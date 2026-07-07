import { Injectable, EnvironmentInjector, createComponent, ApplicationRef, inject } from '@angular/core';
import L from 'leaflet';
import { DatosMapa, Marcador } from '../models/datos-mapa';
import { CONFIG_MAPA } from '../global/constants';
import { MapaPinComponent } from '../components/mapa-pin/mapa-pin.component';
import { MapaPopupComponent } from '../components/mapa-popup/mapa-popup.component';

@Injectable({
  providedIn: 'root'
})
export class ServicioVisorMapa {
  private mapaInstancia: L.Map | null = null;
  
  private environmentInjector = inject(EnvironmentInjector);
  private appRef = inject(ApplicationRef);

  /**
   * Carga los pines y el mapa.
   */
  public cargarPinesYMapa(datosMapa: DatosMapa): void {
    console.info('[ServicioVisorMapa] cargarPinesYMapa() llamado con:', datosMapa);
    this.limpiarCapasAntiguas();

    if (datosMapa.centroCiudad) {
      this.centrarCamara(datosMapa.centroCiudad, datosMapa.zoom);
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

    this.mapaInstancia = new L.Map(contenedor, {
      center: CONFIG_MAPA.CENTRO_AVILA,
      zoomSnap: 0.1,
      maxZoom: CONFIG_MAPA.MAX_ZOOM,
      maxBoundsViscosity: 1.0
    });

    L.tileLayer(CONFIG_MAPA.ARCGIS_URL, {
      attribution: CONFIG_MAPA.ATRIBUCION,
      noWrap: true
    }).addTo(this.mapaInstancia);
    
    console.info('[ServicioVisorMapa] Capa tileLayer añadida al mapa.');
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
    // 1. Instanciamos el componente dinámicamente
    const componentRef = createComponent(MapaPinComponent, {
      environmentInjector: this.environmentInjector
    });

    // 2. Le pasamos los inputs con el nuevo formato de Signals
    componentRef.setInput('marcador', marcador);
    componentRef.setInput('isGray', isGray);

    // 3. Forzamos la detección de cambios inicial y enganchamos a la app
    this.appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();

    // 4. Extraemos el elemento HTML puro nativo
    const htmlElement = componentRef.location.nativeElement;

    return L.divIcon({
        html: htmlElement,
        className: '',
        iconSize: [150, 100],
        iconAnchor: [75, 72],
        popupAnchor: [0, -25] 
    });
  }

  /**
   * Recorre la lista de marcadores y añade un pin en el mapa por cada uno.
   * Devuelve la cantidad de pines añadidos con éxito.
   */
  public dibujarPines(marcadores: Marcador[]): number {
    let cantidadPinesAñadidos: number = 0;

    if (this.mapaInstancia) {
      marcadores.forEach((marcador: Marcador) => {
        const latitud: number = marcador.coordenadas[0];
        const longitud: number = marcador.coordenadas[1];
        const nombreLugar = marcador.nombre;

        // Construimos el HTML del "bocadillo" (popup) dinámicamente usando nuestro componente
        const popupRef = createComponent(MapaPopupComponent, {
          environmentInjector: this.environmentInjector
        });
        popupRef.setInput('marcador', marcador);
        this.appRef.attachView(popupRef.hostView);
        popupRef.changeDetectorRef.detectChanges();
        
        const popupElement = popupRef.location.nativeElement;

        const marker = L.marker([latitud, longitud], { 
            icon: this.createIcon(marcador, false),
            title: marcador.nombre,
            riseOnHover: true,
            zIndexOffset: 100
        }).addTo(this.mapaInstancia!);

        marker.bindPopup(popupElement, { maxWidth: 75, minWidth: 65, className: 'mini-popup' });
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