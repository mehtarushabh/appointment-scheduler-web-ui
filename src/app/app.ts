import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingOverlayComponent } from './shared/loading/loading-overlay.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, LoadingOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('appointment-scheduler-web-ui');
}
