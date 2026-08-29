import { Component, EventEmitter, Input, Output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { ConsentDocumentStatus, ConsentDocumentType, PatientDetailsResponse } from '../../shared/models';

/**
 * Section 5 (Legal Consents &amp; Policy Acknowledgments, FR-016, FR-017) — a self-contained,
 * independently-saved panel. Each document's full text is fetched on demand when the Patient
 * expands it to view (`getConsentDocument`), not pre-loaded with the rest of the profile
 * (research.md #7), and displayed as plain paragraphs — split on blank lines, no
 * markdown-rendering dependency (research.md #7). Accept is disabled until the document has
 * actually been viewed and a typed-full-name signature is entered.
 */
@Component({
  selector: 'app-consents-section',
  standalone: true,
  imports: [ReactiveFormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCardModule],
  templateUrl: './consents-section.component.html',
})
export class ConsentsSectionComponent {
  private readonly fb = inject(FormBuilder);
  private readonly patientProfileService = inject(PatientProfileService);
  private readonly notification = inject(NotificationService);

  @Input() consentStatuses: ConsentDocumentStatus[] = [];
  @Output() readonly sectionSaved = new EventEmitter<PatientDetailsResponse>();

  private readonly viewedParagraphs = signal<ReadonlyMap<ConsentDocumentType, string[]>>(new Map());
  private readonly loadingType = signal<ConsentDocumentType | null>(null);

  readonly signatureForm = this.fb.group({
    signatureText: ['', Validators.required],
  });

  paragraphsFor(status: ConsentDocumentStatus): string[] | null {
    return this.viewedParagraphs().get(status.documentType) ?? null;
  }

  isLoading(status: ConsentDocumentStatus): boolean {
    return this.loadingType() === status.documentType;
  }

  hasBeenViewed(status: ConsentDocumentStatus): boolean {
    return this.viewedParagraphs().has(status.documentType);
  }

  viewDocument(status: ConsentDocumentStatus): void {
    if (this.hasBeenViewed(status)) {
      return;
    }
    this.loadingType.set(status.documentType);
    this.patientProfileService.getConsentDocument(status.documentType).subscribe({
      next: (content) => {
        const paragraphs = content.bodyText.split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 0);
        const next = new Map(this.viewedParagraphs());
        next.set(status.documentType, paragraphs);
        this.viewedParagraphs.set(next);
        this.loadingType.set(null);
      },
      error: (err) => {
        this.notification.error(err?.error?.message ?? 'Failed to load document.');
        this.loadingType.set(null);
      },
    });
  }

  canAccept(status: ConsentDocumentStatus): boolean {
    return this.hasBeenViewed(status) && this.signatureForm.valid;
  }

  accept(status: ConsentDocumentStatus): void {
    if (!this.canAccept(status)) {
      return;
    }
    const signatureText = this.signatureForm.getRawValue().signatureText!;
    this.patientProfileService.acceptConsent({ documentType: status.documentType, signatureText }).subscribe({
      next: (profile) => {
        this.notification.success(`${status.title} accepted.`);
        this.sectionSaved.emit(profile);
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'Failed to record acceptance.'),
    });
  }
}
