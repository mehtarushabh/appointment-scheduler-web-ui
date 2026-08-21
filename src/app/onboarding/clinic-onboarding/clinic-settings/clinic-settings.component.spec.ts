import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ClinicSettingsComponent } from './clinic-settings.component';
import { ClinicSettingsService } from './clinic-settings.service';
import { NotificationService } from '../../../shared/notification/notification.service';
import { AuthService } from '../../../core/auth.service';
import { ClinicResponse, DayOfWeek, WorkingHoursEntry } from '../../../shared/models';

const DAY_ORDER: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

function workingHours(): WorkingHoursEntry[] {
  return DAY_ORDER.map((day) => {
    const open = day !== 'SATURDAY' && day !== 'SUNDAY';
    return { dayOfWeek: day, isOpen: open, startTime: open ? '08:00:00' : null, endTime: open ? '17:00:00' : null };
  });
}

function clinic(overrides: Partial<ClinicResponse> = {}): ClinicResponse {
  return {
    id: 'clinic-1',
    name: 'Metropolis Clinic',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    registeredId: 'REG-1',
    firstClinicAdmin: null,
    ...overrides,
  };
}

describe('ClinicSettingsComponent', () => {
  let getProfileSpy: ReturnType<typeof vi.fn>;
  let updateProfileSpy: ReturnType<typeof vi.fn>;
  let getWorkingHoursSpy: ReturnType<typeof vi.fn>;
  let updateWorkingHoursSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function setup() {
    getProfileSpy = vi.fn().mockReturnValue(of(clinic()));
    updateProfileSpy = vi.fn().mockReturnValue(of(clinic()));
    getWorkingHoursSpy = vi.fn().mockReturnValue(of(workingHours()));
    updateWorkingHoursSpy = vi.fn().mockReturnValue(of(workingHours()));
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ClinicSettingsComponent],
      providers: [
        {
          provide: ClinicSettingsService,
          useValue: {
            getProfile: getProfileSpy,
            updateProfile: updateProfileSpy,
            getWorkingHours: getWorkingHoursSpy,
            updateWorkingHours: updateWorkingHoursSpy,
          },
        },
        { provide: NotificationService, useValue: notificationServiceStub },
        { provide: AuthService, useValue: { currentUser: () => ({ clinicId: 'clinic-1', role: 'CLINIC_ADMIN', token: 't' }) } },
      ],
    });
    const fixture = TestBed.createComponent(ClinicSettingsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('loads and displays the clinic profile, read-only Registered ID, and 7-day working-hours table on init', () => {
    const fixture = setup();

    expect(getProfileSpy).toHaveBeenCalled();
    expect(getWorkingHoursSpy).toHaveBeenCalledWith('clinic-1');
    expect(fixture.componentInstance.registeredId()).toBe('REG-1');
    expect(fixture.componentInstance.profileForm.getRawValue().name).toBe('Metropolis Clinic');
    expect(fixture.componentInstance.dayGroups.length).toBe(7);
    expect(fixture.componentInstance.dayGroups[1].getRawValue().dayOfWeek).toBe('TUESDAY');
    expect(fixture.componentInstance.dayGroups[1].getRawValue().startTime).toBe('08:00:00');
  });

  it("disables a day's time inputs when its checkbox is unchecked", () => {
    const fixture = setup();
    const mondayGroup = fixture.componentInstance.dayGroups[0];
    expect(mondayGroup.get('startTime')!.disabled).toBe(false);

    mondayGroup.get('isOpen')!.setValue(false);

    expect(mondayGroup.get('startTime')!.disabled).toBe(true);
    expect(mondayGroup.get('endTime')!.disabled).toBe(true);
  });

  it('saves the profile with the entered values', () => {
    const fixture = setup();
    fixture.componentInstance.profileForm.patchValue({ name: 'Renamed Clinic' });

    fixture.componentInstance.saveProfile();

    expect(updateProfileSpy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Renamed Clinic' }));
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('saves working hours with the current table values', () => {
    const fixture = setup();
    const tuesdayGroup = fixture.componentInstance.dayGroups[1];
    tuesdayGroup.patchValue({ startTime: '09:00', endTime: '18:00' });

    fixture.componentInstance.saveHours();

    expect(updateWorkingHoursSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        days: expect.arrayContaining([expect.objectContaining({ dayOfWeek: 'TUESDAY', startTime: '09:00', endTime: '18:00' })]),
      })
    );
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it("surfaces the server's field error when an invalid time range is saved", () => {
    const fixture = setup();
    updateWorkingHoursSpy.mockReturnValue(
      throwError(() => ({ error: { message: "TUESDAY's end time must be after its start time." } }))
    );

    fixture.componentInstance.saveHours();

    expect(notificationServiceStub.error).toHaveBeenCalledWith("TUESDAY's end time must be after its start time.");
  });
});
