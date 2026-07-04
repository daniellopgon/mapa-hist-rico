import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ServicioVisorMapa } from '../../services/leaflet.service';
import { DatosMapa } from '../../models/datos-mapa';

@Component({
  selector: 'app-mapa',
  templateUrl: './map-viewer.component.html',
  styleUrl: './map-viewer.component.css'
})
export class MapaComponent implements OnInit, OnDestroy, OnChanges {

  @ViewChild('mapContainer', { static: true }) contenedorMapa!: ElementRef;
  @Input() datosMapa: DatosMapa | null = null;


  constructor(private servicioVisor: ServicioVisorMapa) { }

  ngOnInit(): void {
    this.servicioVisor.inicializarMapaIGN(this.contenedorMapa.nativeElement);
  }

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['datosMapa'] && this.datosMapa) {
      this.servicioVisor.cargarPinesYMapa(this.datosMapa);
    }
  }

  ngOnDestroy(): void {
    this.servicioVisor.destruirMapa();
  }


}