import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapaComponent } from './components/mapa/mapa.component';
import { DatosMapa } from './models/datos-mapa';
import { MAPA_AVILA_MOCK } from './global/constants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MapaComponent],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  public datosDelMapa: DatosMapa | null = null;

  ngOnInit() {
    console.info('[AppComponent] Inicializando y cargando constante...');
    this.datosDelMapa = MAPA_AVILA_MOCK;
    console.info('[AppComponent] Datos cargados:', this.datosDelMapa);
  }
}
