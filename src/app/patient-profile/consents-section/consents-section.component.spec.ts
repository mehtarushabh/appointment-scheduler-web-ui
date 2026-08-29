import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ConsentsSectionComponent } from './consents-section.component';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { ConsentDocumentContent, ConsentDocumentStatus, PatientDetailsResponse } from '../../shared/models';

const CONSENT_TO_TREAT: ConsentDocumentStatus = {
  documentType: 'CONSENT_TO_TREAT',
  title: 'Consent to Treat',
  currentVersion: 'v1',
  accepted: false,
  acceptedAt: null,
  acceptedVersion: null,
};

describe('ConsentsSectionComponent', () => {
  let getConsentDocumentSpy: ReturnType<typeof vi.fn>;
  let acceptConsentSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    getConsentDocumentSpy = vi.fn();
    acceptConsentSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ConsentsSectionComponent],
      providers: [
        { provide: PatientProfileService, useValue: { getConsentDocument: getConsentDocumentSpy, acceptConsent: acceptConsentSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('does not fetch the document until viewDocument is called (fetch-on-expand, research.md #7)', () => {
    const fixture = TestBed.createComponent(ConsentsSectionComponent);
    fixture.componentInstance.consentStatuses = [CONSENT_TO_TREAT];

    expect(getConsentDocumentSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.hasBeenViewed(CONSENT_TO_TREAT)).toBe(false);
  });

  it('fetches and splits the body text into paragraphs on view, and does not re-fetch on a second call', () => {
    const content: ConsentDocumentContent = {
      documentType: 'CONSENT_TO_TREAT',
      version: 'v1',
      title: 'Consent to Treat',
      bodyText: 'First paragraph.\n\nSecond paragraph.',
    };
    getConsentDocumentSpy.mockReturnValue(of(content));
    const fixture = TestBed.createComponent(ConsentsSectionComponent);

    fixture.componentInstance.viewDocument(CONSENT_TO_TREAT);

    expect(getConsentDocumentSpy).toHaveBeenCalledWith('CONSENT_TO_TREAT');
    expect(fixture.componentInstance.paragraphsFor(CONSENT_TO_TREAT)).toEqual(['First paragraph.', 'Second paragraph.']);

    fixture.componentInstance.viewDocument(CONSENT_TO_TREAT);
    expect(getConsentDocumentSpy).toHaveBeenCalledTimes(1);
  });

  it('disables Accept until the document has been viewed and a signature is entered', () => {
    const fixture = TestBed.createComponent(ConsentsSectionComponent);

    expect(fixture.componentInstance.canAccept(CONSENT_TO_TREAT)).toBe(false);

    getConsentDocumentSpy.mockReturnValue(
      of({ documentType: 'CONSENT_TO_TREAT', version: 'v1', title: 'Consent to Treat', bodyText: 'Text.' })
    );
    fixture.componentInstance.viewDocument(CONSENT_TO_TREAT);
    expect(fixture.componentInstance.canAccept(CONSENT_TO_TREAT)).toBe(false);

    fixture.componentInstance.signatureForm.setValue({ signatureText: 'Pat Ient' });
    expect(fixture.componentInstance.canAccept(CONSENT_TO_TREAT)).toBe(true);
  });

  it('does not call acceptConsent when canAccept is false', () => {
    const fixture = TestBed.createComponent(ConsentsSectionComponent);

    fixture.componentInstance.accept(CONSENT_TO_TREAT);

    expect(acceptConsentSpy).not.toHaveBeenCalled();
  });

  it('accepts the document, shows a success toast, and emits the updated profile', () => {
    getConsentDocumentSpy.mockReturnValue(
      of({ documentType: 'CONSENT_TO_TREAT', version: 'v1', title: 'Consent to Treat', bodyText: 'Text.' })
    );
    const updated = { profileComplete: true } as PatientDetailsResponse;
    acceptConsentSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(ConsentsSectionComponent);
    fixture.componentInstance.viewDocument(CONSENT_TO_TREAT);
    fixture.componentInstance.signatureForm.setValue({ signatureText: 'Pat Ient' });
    const emitted: PatientDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((p) => emitted.push(p));

    fixture.componentInstance.accept(CONSENT_TO_TREAT);

    expect(acceptConsentSpy).toHaveBeenCalledWith({ documentType: 'CONSENT_TO_TREAT', signatureText: 'Pat Ient' });
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('shows an error toast when the document fails to load', () => {
    getConsentDocumentSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to load.' } })));
    const fixture = TestBed.createComponent(ConsentsSectionComponent);

    fixture.componentInstance.viewDocument(CONSENT_TO_TREAT);

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to load.');
    expect(fixture.componentInstance.hasBeenViewed(CONSENT_TO_TREAT)).toBe(false);
  });
});
