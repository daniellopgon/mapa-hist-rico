import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ServicioVisorMapa } from '../../services/leaflet.service';
import { DatosMapa } from '../../models/datos-mapa';

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrl: './mapa.component.css'
})
export class MapaComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('mapContainer', { static: true }) contenedorMapa!: ElementRef;
  @Input() datosMapa: DatosMapa | null = null;


  constructor(private servicioVisor: ServicioVisorMapa) { }

  ngOnInit() {
    console.info('[MapaComponent] ngOnInit() disparado. Inicializando mapa...');
    if (this.contenedorMapa && this.contenedorMapa.nativeElement) {
      this.servicioVisor.inicializarMapaIGN(this.contenedorMapa.nativeElement);
      console.info('[MapaComponent] Mapa inicializado correctamente en el div.');
      
      if (this.datosMapa) {
        console.info('[MapaComponent] Cargando datos retrasados tras inicializar el mapa.');
        this.servicioVisor.cargarPinesYMapa(this.datosMapa);
      }
    } else {
      console.error('[MapaComponent] ERROR: No se encuentra el div #mapContainer');
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.info('[MapaComponent] ngOnChanges() disparado:', changes);
    if (changes['datosMapa'] && this.datosMapa) {
      try {
        this.servicioVisor.cargarPinesYMapa(this.datosMapa);
      } catch(e) {
      }
    }
  }

  ngOnDestroy(): void {
    this.servicioVisor.destruirMapa();
  }


}