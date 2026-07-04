import { Injectable } from '@angular/core';
import L from 'leaflet';
import { DatosMapa, Marcador } from '../models/datos-mapa';

@Injectable({
  providedIn: 'root'
})
export class ServicioVisorMapa {
  private mapaInstancia: L.Map | null = null;
  private readonly coordenadasAvila: [number, number] = [40.656, -4.700];

  /**
   * Carga los pines y el mapa.
   */
  public cargarPinesYMapa(datosMapa: DatosMapa): void {
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
    this.mapaInstancia = new L.Map(contenedor, {
      center: this.coordenadasAvila,
      zoom: 13,
    });

    L.tileLayer.wms('https://www.ign.es/wms/primera-edicion-mtn', {
      layers: 'MTN25-1edition-c',
      format: 'image/png',
      transparent: true,
      attribution: '© Instituto Geográfico Nacional de España'
    }).addTo(this.mapaInstancia);
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
        const nombreLugar: string = marcador.nombre;

        L.marker([latitud, longitud])
          .addTo(this.mapaInstancia!)
          .bindPopup(nombreLugar);
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