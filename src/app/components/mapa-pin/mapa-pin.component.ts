import { Component, Input } from '@angular/core';
import { Marcador } from '../../models/datos-mapa';

@Component({
  selector: 'app-mapa-pin',
  standalone: true,
  templateUrl: './mapa-pin.component.html'
})
export class MapaPinComponent {
  @Input({ required: true }) marcador!: Marcador;
  @Input() isGray: boolean = false;
}
