import { Injectable, signal, computed } from '@angular/core';
import { VisitaCruda } from '../interfaces/interfaces';
import { CONFIG_MAPA } from '../shared/constants';
import { normalizarVisita } from '../utils/utils';
import { guardarVisitaLocalmente, obtenerTodasLasVisitas, obtenerTodasLasRutas } from '../shared/storage';

@Injectable({
  providedIn: 'root'
})
export class MapStateService {
  // Estado privado con señales escribibles
  private readonly _visitas = signal<VisitaCruda[]>([]);
  private readonly _visitaSeleccionada = signal<VisitaCruda | null>(null);
  private readonly _estadoCarga = signal<'idle' | 'loading' | 'error'>('idle');

  // Estado público de solo lectura (Norma Angular Signals: Proteger el estado interno)
  public readonly visitas = this._visitas.asReadonly();
  public readonly visitaSeleccionada = this._visitaSeleccionada.asReadonly();
  public readonly estadoCarga = this._estadoCarga.asReadonly();

  // Estado derivado (Norma Angular Signals: Derivar estado con computed)
  public readonly hayVisitas = computed(() => this._visitas().length > 0);

  constructor() {
    this.cargarDatosIniciales();
  }

  public seleccionarVisita(visita: VisitaCruda | null): void {
    this._visitaSeleccionada.set(visita);
  }

  private async cargarDatosIniciales(): Promise<void> {
    this._estadoCarga.set('loading');
    
    try {
      const respuesta = await fetch(CONFIG_MAPA.URL_DATOS);
      if (!respuesta.ok) throw new Error(`Error al obtener ${CONFIG_MAPA.URL_DATOS}`);
      
      const datos = await respuesta.json();
      const visitasProcesadas = (Array.isArray(datos) ? datos : [datos]).map(normalizarVisita);
      
      // Guardar en local
      visitasProcesadas.forEach((v: VisitaCruda) => guardarVisitaLocalmente(v));
      
      this._visitas.set(visitasProcesadas);
      this._estadoCarga.set('idle');
    } catch (error) {
      console.warn('Fallo red, intentando offline...', error);
      await this.cargarDatosOffline();
    }
  }

  private async cargarDatosOffline(): Promise<void> {
    try {
      const visitasOffline = await obtenerTodasLasVisitas();
      const visitas = visitasOffline.map(normalizarVisita);
      
      if (visitas.length > 0) {
        this._visitas.set(visitas);
        this._estadoCarga.set('idle');
      } else {
        const rutasLocales = await obtenerTodasLasRutas();
        if (rutasLocales.length > 0) {
          const visitasReconstruidas = rutasLocales.map((v: any) => ({
            id: v.id,
            nombre: `${v.cliente} (Offline)`,
            idCiudad: v.idCiudad || 'avila',
            cliente: v.cliente,
            direccion: v.direccionDestino,
            zoom: CONFIG_MAPA.ZOOM_POR_DEFECTO,
            marcadores: v.puntosInteres?.map((p: { lat: number; lng: number }, i: number) => ({
              nombre: `Paso ${i + 1}`,
              coordenadas: [p.lat, p.lng] as [number, number]
            })) || []
          }));
          this._visitas.set(visitasReconstruidas as unknown as VisitaCruda[]);
          this._estadoCarga.set('idle');
        } else {
          this._estadoCarga.set('error');
        }
      }
    } catch (e) {
      this._estadoCarga.set('error');
    }
  }
}
