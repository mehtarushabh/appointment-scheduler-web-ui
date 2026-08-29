import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PersonalPhoneSectionComponent } from './personal-phone-section.component';
import { PatientProfileService } from '../patient-profile.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { PatientDetailsResponse } from '../../shared/models';

describe('PersonalPhoneSectionComponent', () => {
  let updatePersonalPhoneSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    updatePersonalPhoneSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [PersonalPhoneSectionComponent],
      providers: [
        { provide: PatientProfileService, useValue: { updatePersonalPhone: updatePersonalPhoneSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('pre-fills the form from the personalPhone input', () => {
    const fixture = TestBed.createComponent(PersonalPhoneSectionComponent);
    fixture.componentInstance.personalPhone = '555-0100';

    fixture.componentInstance.ngOnChanges();

    expect(fixture.componentInstance.form.getRawValue().personalPhone).toBe('555-0100');
  });

  it('does not save when personal phone is blank', () => {
    const fixture = TestBed.createComponent(PersonalPhoneSectionComponent);

    fixture.componentInstance.save();

    expect(updatePersonalPhoneSpy).not.toHaveBeenCalled();
  });

  it('saves the section and emits the updated details on success', () => {
    const updated = { personalPhone: '555-0200' } as PatientDetailsResponse;
    updatePersonalPhoneSpy.mockReturnValue(of(updated));
    const fixture = TestBed.createComponent(PersonalPhoneSectionComponent);
    fixture.componentInstance.form.setValue({ personalPhone: '555-0200' });
    const emitted: PatientDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((d) => emitted.push(d));

    fixture.componentInstance.save();

    expect(updatePersonalPhoneSpy).toHaveBeenCalledWith({ personalPhone: '555-0200' });
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual([updated]);
  });

  it('shows an error toast and does not emit on failure', () => {
    updatePersonalPhoneSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed.' } })));
    const fixture = TestBed.createComponent(PersonalPhoneSectionComponent);
    fixture.componentInstance.form.setValue({ personalPhone: '555-0200' });
    const emitted: PatientDetailsResponse[] = [];
    fixture.componentInstance.sectionSaved.subscribe((d) => emitted.push(d));

    fixture.componentInstance.save();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed.');
    expect(emitted).toEqual([]);
  });
});
