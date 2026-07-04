import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MapaComponent } from './components/map-viewer/mapa.component';
import { MapaService } from './services/mapa.service';
import { DatosMapa } from './models/datos-mapa';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MapaComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  public datosDelMapa: DatosMapa | null = null;

  constructor(private mapaService: MapaService) {}

  async ngOnInit() {
    // Pedimos los datos de 'avila' al backend
    this.datosDelMapa = await this.mapaService.obtenerMapa('avila');
  }
}
