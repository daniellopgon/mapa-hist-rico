import { Component, input } from '@angular/core';
import { Marcador } from '../../models/datos-mapa';

@Component({
  selector: 'app-mapa-popup',
  standalone: true,
  templateUrl: './mapa-popup.component.html'
})
export class MapaPopupComponent {
  public marcador = input.required<Marcador>();
}
