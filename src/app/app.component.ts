import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { VisitListComponent } from './components/visit-list/visit-list.component';
import { MapViewerComponent } from './components/map-viewer/map-viewer.component';
import { MapStateService } from './services/map-state.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, VisitListComponent, MapViewerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  public mapState = inject(MapStateService);
}
