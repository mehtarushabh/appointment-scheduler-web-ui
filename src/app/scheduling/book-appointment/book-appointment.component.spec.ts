import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { BookAppointmentComponent } from './book-appointment.component';
import { AppointmentService } from '../appointments/appointment.service';
import { PatientOnboardingService } from '../../onboarding/patient-onboarding/patient-onboarding.service';
import { ClinicSettingsService } from '../../onboarding/clinic-onboarding/clinic-settings/clinic-settings.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { AppointmentResponse, ClinicResponse, DoctorSummaryResponse, WorkingHoursEntry } from '../../shared/models';

function clinic(id: string, name = 'Metropolis Clinic'): ClinicResponse {
  return {
    id,
    name,
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    registeredId: 'REG-1',
    firstClinicAdmin: null,
  };
}

function doctor(overrides: Partial<DoctorSummaryResponse> = {}): DoctorSummaryResponse {
  return { id: 'doc-1', firstName: 'Dana', lastName: 'Doc', specialty: 'Cardiology', ...overrides };
}

function defaultWorkingHours(): WorkingHoursEntry[] {
  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;
  return days.map((day) => {
    const open = day !== 'SATURDAY' && day !== 'SUNDAY';
    return { dayOfWeek: day, isOpen: open, startTime: open ? '08:00:00' : null, endTime: open ? '17:00:00' : null };
  });
}

describe('BookAppointmentComponent', () => {
  let listMyClinicsSpy: ReturnType<typeof vi.fn>;
  let listBookableDoctorsSpy: ReturnType<typeof vi.fn>;
  let getWorkingHoursSpy: ReturnType<typeof vi.fn>;
  let getAvailableSlotsSpy: ReturnType<typeof vi.fn>;
  let bookAppointmentSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };
  let navigateSpy: ReturnType<typeof vi.fn>;

  function setup(clinics: ClinicResponse[]) {
    listMyClinicsSpy = vi.fn().mockReturnValue(of(clinics));
    listBookableDoctorsSpy = vi.fn().mockReturnValue(of([doctor()]));
    getWorkingHoursSpy = vi.fn().mockReturnValue(of(defaultWorkingHours()));
    getAvailableSlotsSpy = vi.fn().mockReturnValue(of({ date: '2026-08-24', durationMinutes: 30, startTimes: ['09:00:00', '09:30:00'] }));
    bookAppointmentSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    navigateSpy = vi.fn();

    TestBed.configureTestingModule({
      imports: [BookAppointmentComponent],
      providers: [
        {
          provide: AppointmentService,
          useValue: { listBookableDoctors: listBookableDoctorsSpy, getAvailableSlots: getAvailableSlotsSpy, bookAppointment: bookAppointmentSpy },
        },
        { provide: PatientOnboardingService, useValue: { listMyClinics: listMyClinicsSpy } },
        { provide: ClinicSettingsService, useValue: { getWorkingHours: getWorkingHoursSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: Router, useValue: { navigateByUrl: navigateSpy } },
      ],
    });
    const fixture = TestBed.createComponent(BookAppointmentComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('skips the clinic dropdown and auto-selects when the Patient has exactly one clinic', () => {
    const fixture = setup([clinic('clinic-1')]);

    expect(fixture.componentInstance.showClinicDropdown()).toBe(false);
    expect(fixture.componentInstance.selectedClinicId()).toBe('clinic-1');
    expect(listBookableDoctorsSpy).toHaveBeenCalledWith('clinic-1');
  });

  it('shows the clinic dropdown when the Patient has more than one clinic', () => {
    const fixture = setup([clinic('clinic-1'), clinic('clinic-2', 'Riverside Clinic')]);

    expect(fixture.componentInstance.showClinicDropdown()).toBe(true);
    expect(fixture.componentInstance.selectedClinicId()).toBeNull();
  });

  it('lists doctors as "First Last - Specialty"', () => {
    const fixture = setup([clinic('clinic-1')]);

    expect(fixture.componentInstance.doctorLabel(doctor())).toBe('Dana Doc - Cardiology');
  });

  it('fetches and displays available start times when a duration is selected', () => {
    const fixture = setup([clinic('clinic-1')]);
    fixture.componentInstance.selectDoctor('doc-1');
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));

    fixture.componentInstance.selectDuration(30);

    expect(getAvailableSlotsSpy).toHaveBeenCalledWith('clinic-1', 'doc-1', '2026-08-24', 30);
    expect(fixture.componentInstance.availableStartTimes()).toEqual(['09:00:00', '09:30:00']);
  });

  it('visually marks the selected start time distinctly from the others (bugfix)', () => {
    const fixture = setup([clinic('clinic-1')]);
    fixture.componentInstance.selectDoctor('doc-1');
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));
    fixture.componentInstance.selectDuration(30);
    fixture.detectChanges();

    const buttons = () => Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('.start-times button'));
    expect(buttons().some((b) => b.classList.contains('app-time-slot-selected'))).toBe(false);

    fixture.componentInstance.selectStartTime('09:00:00');
    fixture.detectChanges();

    const selected = buttons().filter((b) => b.classList.contains('app-time-slot-selected'));
    expect(selected.length).toBe(1);
    expect(selected[0].textContent?.trim()).toBe('09:00:00');
  });

  it('books the appointment, shows a success toast, and navigates home', () => {
    const created = { id: 'appt-1', state: 'SCHEDULED' } as AppointmentResponse;
    const fixture = setup([clinic('clinic-1')]);
    bookAppointmentSpy.mockReturnValue(of(created));
    fixture.componentInstance.selectDoctor('doc-1');
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));
    fixture.componentInstance.selectDuration(30);
    fixture.componentInstance.selectStartTime('09:00:00');

    fixture.componentInstance.confirm();

    expect(bookAppointmentSpy).toHaveBeenCalledWith({
      clinicId: 'clinic-1',
      doctorId: 'doc-1',
      date: '2026-08-24',
      startTime: '09:00:00',
      durationMinutes: 30,
    });
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith('/home');
  });

  it('shows a failure toast and stays on the page when booking returns a 409', () => {
    const fixture = setup([clinic('clinic-1')]);
    bookAppointmentSpy.mockReturnValue(throwError(() => ({ error: { message: 'The requested time is no longer available.' } })));
    fixture.componentInstance.selectDoctor('doc-1');
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));
    fixture.componentInstance.selectDuration(30);
    fixture.componentInstance.selectStartTime('09:00:00');

    fixture.componentInstance.confirm();

    expect(notificationServiceStub.error).toHaveBeenCalledWith('The requested time is no longer available.');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('offers a direct link to complete the profile specifically when booking is blocked by an incomplete profile (Feature 016 FR-020)', () => {
    const fixture = setup([clinic('clinic-1')]);
    bookAppointmentSpy.mockReturnValue(
      throwError(() => ({
        status: 403,
        error: { message: 'Your profile must be fully complete before you can schedule an appointment.' },
      }))
    );
    fixture.componentInstance.selectDoctor('doc-1');
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));
    fixture.componentInstance.selectDuration(30);
    fixture.componentInstance.selectStartTime('09:00:00');

    fixture.componentInstance.confirm();

    expect(fixture.componentInstance.blockedByIncompleteProfile()).toBe(true);

    fixture.componentInstance.goToEditProfile();
    expect(navigateSpy).toHaveBeenCalledWith('/edit-profile');
  });

  it('does not offer the profile link for an unrelated 403 (not associated with this clinic)', () => {
    const fixture = setup([clinic('clinic-1')]);
    bookAppointmentSpy.mockReturnValue(
      throwError(() => ({ status: 403, error: { message: 'You are not associated with this clinic.' } }))
    );
    fixture.componentInstance.selectDoctor('doc-1');
    fixture.componentInstance.selectDate(new Date(2026, 7, 24));
    fixture.componentInstance.selectDuration(30);
    fixture.componentInstance.selectStartTime('09:00:00');

    fixture.componentInstance.confirm();

    expect(fixture.componentInstance.blockedByIncompleteProfile()).toBe(false);
  });
});
