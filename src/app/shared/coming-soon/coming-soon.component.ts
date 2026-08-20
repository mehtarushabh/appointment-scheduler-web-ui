import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

/**
 * Generic placeholder for a nav destination that isn't built yet (FR-012), reused across
 * `/appointments`, `/schedule-appointment`, and `/doctor/patients` (research.md #6) rather than
 * three near-duplicate components.
 */
@Component({
  selector: 'app-coming-soon',
  standalone: true,
  templateUrl: './coming-soon.component.html',
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);

  readonly featureName = this.route.snapshot.data['featureName'] as string;
}
