import { Component, inject } from '@angular/core';
import { MapStateService } from '../../services/map-state.service';
import { VisitCardComponent } from '../visit-card/visit-card.component';
import { VisitaCruda, Ruta, Visita } from '../../interfaces/interfaces';
import { descargarMapaCiudad } from '../../services/map-downloader.service';
import { CONFIG_MAPA } from '../../shared/constants';
import {
  guardarVisitaLocalmente,
  guardarRutaLocalmente,
  limpiarTodosLosMapas,
  limpiarTodasLasRutas,
  limpiarTodasLasVisitas
} from '../../shared/storage';

@Component({
  selector: 'app-visit-list',
  standalone: true,
  imports: [VisitCardComponent],
  templateUrl: './visit-list.component.html',
  styleUrl: './visit-list.component.css'
})
export class VisitListComponent {
  public mapState = inject(MapStateService);

  public async descargar(visita: VisitaCruda) {
    if (visita.rutaPrecalculada) {
      const ruta = this.crearObjetoRuta(visita);
      const objetoVisita = { ...this.prepararVisitaParaDescarga(visita), ruta };

      await guardarRutaLocalmente(objetoVisita as any); // cast for now if interfaces mismatch slightly
      await guardarVisitaLocalmente(visita);

      try {
        await descargarMapaCiudad(
          visita.idCiudad,
          visita.urlPmtiles || CONFIG_MAPA.URL_PMTILES
        );
      } catch (error) {
        console.error('Error al descargar PMTiles:', error);
      }
    }
  }

  public verMapa(visita: VisitaCruda) {
    this.mapState.seleccionarVisita(visita);
  }

  public async borrarTodo() {
    if (globalThis.confirm('¿Eliminar todos los datos locales?')) {
      try {
        await Promise.all([
          limpiarTodosLosMapas(),
          limpiarTodasLasRutas(),
          limpiarTodasLasVisitas()
        ]);
        globalThis.alert('Memoria local liberada.');
        globalThis.location.reload();
      } catch (error) {
        console.error('Error al borrar:', error);
      }
    }
  }

  private prepararVisitaParaDescarga(visita: VisitaCruda): Visita {
    return {
      id: visita.id,
      idCiudad: visita.idCiudad,
      cliente: visita.cliente,
      direccionDestino: visita.direccion,
      coordenadasDestino: {
        lat: visita.marcadores[0]?.coordenadas[0] ?? 0,
        lng: visita.marcadores[0]?.coordenadas[1] ?? 0,
      },
      puntosInteres: visita.marcadores.map(m => ({ lat: m.coordenadas[0], lng: m.coordenadas[1] })),
    };
  }

  private crearObjetoRuta(visita: VisitaCruda): Ruta {
    const puntosInteres = visita.marcadores.map((m, i) => ({
      lat: m.coordenadas[0],
      lng: m.coordenadas[1],
      titulo: m.nombre || `Parada ${i + 1}`,
      letra: String.fromCharCode(65 + i),
      distancia: 0
    }));

    return {
      geojson: visita.rutaPrecalculada,
      distanciaTotal: 0,
      tiempoEstimado: 0,
      pasos: puntosInteres
    };
  }
}
