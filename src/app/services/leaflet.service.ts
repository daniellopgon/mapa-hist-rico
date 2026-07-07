import { Injectable, EnvironmentInjector, createComponent, ApplicationRef, inject } from '@angular/core';
import L from 'leaflet';
import { DatosMapa, Marcador } from '../models/datos-mapa';
import { CONFIG_MAPA, CONFIG_ICONO } from '../global/constants';
import { MapaPinComponent } from '../components/mapa-pin/mapa-pin.component';
import { MapaPopupComponent } from '../components/mapa-popup/mapa-popup.component';

@Injectable({
  providedIn: 'root'
})
export class ServicioVisorMapa {
  private mapaInstancia: L.Map | null = null;
  
  // Inyectores necesarios para instanciar Componentes de Angular (y su HTML) dinámicamente 
  // desde un Servicio (que normalmente no tiene acceso directo a pintar en la pantalla).
  private environmentInjector = inject(EnvironmentInjector);
  private appRef = inject(ApplicationRef);

  /**
   * Carga los pines y el mapa.
   */
  public cargarPinesYMapa(datosMapa: DatosMapa): void {
    console.info('[leaflet.service] cargarPinesYMapa() llamado con:', datosMapa);
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
    console.info('[leaflet.service] inicializarMapaIGN() creando instancia en DOM...');

    this.mapaInstancia = new L.Map(contenedor, {
      center: CONFIG_MAPA.CENTRO_AVILA,
      zoomSnap: 0.1,
      maxZoom: CONFIG_MAPA.MAX_ZOOM,
      maxBoundsViscosity: 1.0
    });

    // L.tileLayer carga las imágenes del mapa (las "baldosas" o tiles) desde un servidor externo,
    // en este caso, descarga nuestro plano histórico estático alojado en ArcGIS.
    L.tileLayer(CONFIG_MAPA.ARCGIS_URL, {
      attribution: CONFIG_MAPA.ATRIBUCION,
      noWrap: true
    }).addTo(this.mapaInstancia);

    this.ajustarZoomCobertura();

    window.addEventListener('resize', () => {
      this.ajustarZoomCobertura();
    });
    
    console.info('[leaflet.service] Capa tileLayer añadida al mapa.');
  }

  /**
   * Calcula el nivel de zoom mínimo exacto para que la imagen histórica
   * cubra completamente la pantalla actual (object-fit: cover) y aplica límites.
   */
  private ajustarZoomCobertura(): void {
    if (!this.mapaInstancia) return;

    const mapSize = this.mapaInstancia.getSize();
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
    
    // Le damos un margen del 10% extra al muro invisible (maxBounds) 
    // para que la cámara pueda subir lo suficiente como para mostrar el popup superior
    this.mapaInstancia.setMaxBounds(limitesAvila.pad(0.1));
    
    // Solo forzamos el zoom de la cámara si el actual se ha quedado "pequeño"
    if (isNaN(this.mapaInstancia.getZoom()) || this.mapaInstancia.getZoom() < zoomOptimo) {
      this.mapaInstancia.setZoom(zoomOptimo);
    }
  }

  /**
   * Elimina todas las capas del mapa ya sean pines o lineas de rutas.
   */
  public limpiarCapasAntiguas(): void {
    // Iteramos por todas las capas actuales del mapa. Si la capa es de tipo L.Marker (un pin),
    // la eliminamos del mapa para limpiar la pantalla y no duplicar iconos si recargamos.
    if (this.mapaInstancia) {
      this.mapaInstancia.eachLayer((capa) => {
        const isUnPin: boolean = capa instanceof L.Marker;
        if (isUnPin && this.mapaInstancia) {
          this.mapaInstancia.removeLayer(capa);
        }
      });
    }
  }

  /**
   * Genera el icono visual (la chincheta) instanciando un componente de Angular en memoria.
   * @param marcador Datos del PDI (nombre, foto, coordenadas).
   * @param isGray Indica si la chincheta debe salir atenuada (gris).
   * @returns L.DivIcon compatible con Leaflet que contiene nuestro HTML.
   */
  private createIcon(marcador: Marcador, isGray: boolean): L.DivIcon {
    // 1. Fabricamos el componente MapaPinComponent "al vuelo" en la memoria de Angular.
    const componentRef = createComponent(MapaPinComponent, {
      environmentInjector: this.environmentInjector
    });

    // 2. Le inyectamos los datos a los @Input() del componente. OJO: No se usa 'await' 
    // porque esto no es una Promesa asíncrona. La función 'setInput' inyecta el valor en la 
    // memoria de Angular de forma síncrona e instantánea.
    componentRef.setInput('marcador', marcador);
    componentRef.setInput('isGray', isGray);

    // 3. Forzamos a Angular a leer las variables y "pintar" el HTML interno del componente.
    this.appRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();

    // 4. Extraemos el bloque <div> HTML resultante nativo. Leaflet no entiende de Angular, 
    // solo sabe leer código HTML estándar del navegador, así que le entregamos el nodo puro.
    const htmlElement = componentRef.location.nativeElement;

    // 5. Devolvemos el envoltorio de Leaflet con nuestro HTML ya cocinado y medidas centralizadas
    return L.divIcon({
        html: htmlElement,
        className: '',
        iconSize: CONFIG_ICONO.PUNTO_INTERES.tamano,
        iconAnchor: CONFIG_ICONO.PUNTO_INTERES.anclaje,
        popupAnchor: CONFIG_ICONO.PUNTO_INTERES.anclajePopup 
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

        marker.bindPopup(popupElement, { maxWidth: 450, minWidth: 420 });
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

  /**
   * Destruye la instancia del mapa y libera los recursos asociados.
   */
  public destruirMapa(): void {
    if (this.mapaInstancia) {
      this.mapaInstancia.remove();
      this.mapaInstancia = null;
    }
  }
}