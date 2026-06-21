import { Component, input, output } from '@angular/core';
import { VisitaCruda } from '../../interfaces/interfaces';
import { INFO_CIUDADES } from '../../shared/constants';

@Component({
  selector: 'app-visit-card',
  standalone: true,
  templateUrl: './visit-card.component.html',
  styleUrl: './visit-card.component.css' // We leave the styles to be managed globally or in this file if we extract them later
})
export class VisitCardComponent {
  public visita = input.required<VisitaCruda>();
  
  public descargar = output<void>();
  public verMapa = output<void>();

  get infoCiudad() {
    const idCiudad = this.visita().idCiudad;
    return INFO_CIUDADES[idCiudad as keyof typeof INFO_CIUDADES] ?? {
        nombre: idCiudad.charAt(0).toUpperCase() + idCiudad.slice(1),
        imagen: null
    };
  }

  get esConImagen() {
    return !!this.infoCiudad.imagen;
  }
}
