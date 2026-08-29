import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { PageEvent } from '@angular/material/paginator';
import { AppointmentsListComponent } from './appointments-list.component';
import { AppointmentService } from './appointment.service';
import { MultiSelectFilterComponent } from './multi-select-filter/multi-select-filter.component';
import { AuthService } from '../../core/auth.service';
import { NotificationService } from '../../shared/notification/notification.service';
import { DoctorOnboardingService } from '../../onboarding/doctor-onboarding/doctor-onboarding.service';
import { PatientOnboardingService } from '../../onboarding/patient-onboarding/patient-onboarding.service';
import { AppointmentResponse, DoctorSummaryResponse, PageResponse, UserResponse } from '../../shared/models';
import { toDateOnlyString } from '../../shared/date-utils';

function appointment(overrides: Partial<AppointmentResponse>): AppointmentResponse {
  return {
    id: '1',
    patientId: 'pat-1',
    patientName: 'Pat Ient',
    doctorId: 'doc-1',
    doctorName: 'Dana Doc',
    clinicId: 'clinic-1',
    clinicName: 'Metropolis Clinic',
    date: '2026-08-24',
    startTime: '09:00:00',
    durationMinutes: 30,
    state: 'SCHEDULED',
    ...overrides,
  };
}

function page(items: AppointmentResponse[], overrides: Partial<PageResponse<AppointmentResponse>> = {}): PageResponse<AppointmentResponse> {
  return { items, page: 0, size: 50, totalElements: items.length, totalPages: 1, ...overrides };
}

function doctorSummary(overrides: Partial<DoctorSummaryResponse>): DoctorSummaryResponse {
  return { id: 'doc-1', firstName: 'Dana', lastName: 'Doc', specialty: 'Cardiology', ...overrides };
}

function userResponse(overrides: Partial<UserResponse>): UserResponse {
  return {
    id: 'pat-1',
    firstName: 'Pat',
    lastName: 'Ient',
    email: 'pat@example.com',
    dateOfBirth: '1995-01-01',
    address: { addressLine1: '1 Main St', addressLine2: null, city: 'Metropolis', state: 'NY', zip: '10001', country: 'USA' },
    ...overrides,
  } as UserResponse;
}

function today(): string {
  return toDateOnlyString(new Date());
}

function todayPlusTwoMonths(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 2);
  return toDateOnlyString(date);
}

describe('AppointmentsListComponent', () => {
  let searchClinicAppointmentsSpy: ReturnType<typeof vi.fn>;
  let searchMyAppointmentsSpy: ReturnType<typeof vi.fn>;
  let cancelAppointmentSpy: ReturnType<typeof vi.fn>;
  let completeAppointmentSpy: ReturnType<typeof vi.fn>;
  let listDoctorsSpy: ReturnType<typeof vi.fn>;
  let listPatientsSpy: ReturnType<typeof vi.fn>;
  let listMyDoctorsSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  function setup(role: 'CLINIC_ADMIN' | 'DOCTOR' | 'PATIENT', items: AppointmentResponse[] = []) {
    searchClinicAppointmentsSpy = vi.fn().mockReturnValue(of(page(items)));
    searchMyAppointmentsSpy = vi.fn().mockReturnValue(of(page(items)));
    cancelAppointmentSpy = vi.fn();
    completeAppointmentSpy = vi.fn();
    listDoctorsSpy = vi.fn().mockReturnValue(of([doctorSummary({ id: 'doc-1', lastName: 'One' })]));
    listPatientsSpy = vi.fn().mockReturnValue(of([userResponse({ id: 'pat-1', lastName: 'One' })]));
    listMyDoctorsSpy = vi.fn().mockReturnValue(of([doctorSummary({ id: 'doc-1', lastName: 'One' })]));
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };

    TestBed.configureTestingModule({
      imports: [AppointmentsListComponent],
      providers: [
        {
          provide: AppointmentService,
          useValue: {
            searchClinicAppointments: searchClinicAppointmentsSpy,
            searchMyAppointments: searchMyAppointmentsSpy,
            cancelAppointment: cancelAppointmentSpy,
            completeAppointment: completeAppointmentSpy,
          },
        },
        { provide: DoctorOnboardingService, useValue: { listDoctors: listDoctorsSpy } },
        { provide: PatientOnboardingService, useValue: { listPatients: listPatientsSpy, listMyDoctors: listMyDoctorsSpy } },
        { provide: AuthService, useValue: { currentUser: () => ({ role, clinicId: 'clinic-1', token: 't' }) } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
    const fixture = TestBed.createComponent(AppointmentsListComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('requests page 0 with the default criteria on init: no states restriction, today through today + 2 months', () => {
    setup('CLINIC_ADMIN');

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledTimes(1);
    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { dateOnOrAfter: today(), dateOnOrBefore: todayPlusTwoMonths() },
      page: 0,
      size: 50,
    });
  });

  it("requests from the caller's-own endpoint for a Doctor session, not the clinic-scoped one", () => {
    setup('DOCTOR');
    expect(searchMyAppointmentsSpy).toHaveBeenCalledTimes(1);
    expect(searchClinicAppointmentsSpy).not.toHaveBeenCalled();
  });

  it('a Clinic Admin session fetches both Doctor and Patient filter options', () => {
    setup('CLINIC_ADMIN');
    expect(listDoctorsSpy).toHaveBeenCalled();
    expect(listPatientsSpy).toHaveBeenCalled();
    expect(listMyDoctorsSpy).not.toHaveBeenCalled();
  });

  it("a Doctor session fetches only Patient filter options, from the caller's-clinic-patients endpoint (it cannot call the Clinic-Admin-only doctors endpoint)", () => {
    setup('DOCTOR');
    expect(listPatientsSpy).toHaveBeenCalled();
    expect(listDoctorsSpy).not.toHaveBeenCalled();
  });

  it("a Patient session fetches only Doctor filter options, from the across-my-clinics endpoint (it cannot call the clinic-staff-only patients endpoint)", () => {
    setup('PATIENT');
    expect(listMyDoctorsSpy).toHaveBeenCalled();
    expect(listPatientsSpy).not.toHaveBeenCalled();
    expect(listDoctorsSpy).not.toHaveBeenCalled();
  });

  it('selecting a specific Status re-searches at page 0 with a matching single-element states array', () => {
    const fixture = setup('CLINIC_ADMIN');
    searchClinicAppointmentsSpy.mockClear();

    fixture.componentInstance.onStatusChange('SCHEDULED');

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { states: ['SCHEDULED'], dateOnOrAfter: today(), dateOnOrBefore: todayPlusTwoMonths() },
      page: 0,
      size: 50,
    });
  });

  it('changing the From date re-searches with the new lower bound', () => {
    const fixture = setup('CLINIC_ADMIN');
    searchClinicAppointmentsSpy.mockClear();
    // Constructed via the local (year, monthIndex, day) form, matching what MatDatepicker's own
    // DateAdapter hands back from a real calendar pick — a 'yyyy-MM-dd' string would parse as UTC
    // midnight and could land on the previous local day west of UTC.
    const newFrom = new Date(2026, 8, 1);

    fixture.componentInstance.onDateOnOrAfterChange(newFrom);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { dateOnOrAfter: '2026-09-01', dateOnOrBefore: todayPlusTwoMonths() },
      page: 0,
      size: 50,
    });
  });

  it('changing the To date re-searches with the new upper bound', () => {
    const fixture = setup('CLINIC_ADMIN');
    searchClinicAppointmentsSpy.mockClear();
    const newTo = new Date(2026, 9, 1);

    fixture.componentInstance.onDateOnOrBeforeChange(newTo);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { dateOnOrAfter: today(), dateOnOrBefore: '2026-10-01' },
      page: 0,
      size: 50,
    });
  });

  it('checking doctors in the Doctor filter re-searches with doctorIds populated', () => {
    const fixture = setup('CLINIC_ADMIN');
    searchClinicAppointmentsSpy.mockClear();

    fixture.componentInstance.onDoctorSelectionChange(['doc-1', 'doc-2']);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { dateOnOrAfter: today(), dateOnOrBefore: todayPlusTwoMonths(), doctorIds: ['doc-1', 'doc-2'] },
      page: 0,
      size: 50,
    });
  });

  it('unchecking every doctor back to none re-searches without doctorIds restricting anything', () => {
    const fixture = setup('CLINIC_ADMIN');
    fixture.componentInstance.onDoctorSelectionChange(['doc-1']);
    searchClinicAppointmentsSpy.mockClear();

    fixture.componentInstance.onDoctorSelectionChange([]);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { dateOnOrAfter: today(), dateOnOrBefore: todayPlusTwoMonths() },
      page: 0,
      size: 50,
    });
  });

  it('checking patients in the Patient filter re-searches with patientIds populated', () => {
    const fixture = setup('CLINIC_ADMIN');
    searchClinicAppointmentsSpy.mockClear();

    fixture.componentInstance.onPatientSelectionChange(['pat-1']);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: { dateOnOrAfter: today(), dateOnOrBefore: todayPlusTwoMonths(), patientIds: ['pat-1'] },
      page: 0,
      size: 50,
    });
  });

  it('combines every currently-set filter into one request, not just the most recently changed one', () => {
    const fixture = setup('CLINIC_ADMIN');

    fixture.componentInstance.onStatusChange('SCHEDULED');
    fixture.componentInstance.onDoctorSelectionChange(['doc-1']);
    searchClinicAppointmentsSpy.mockClear();

    fixture.componentInstance.onPatientSelectionChange(['pat-1']);

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
      criteria: {
        states: ['SCHEDULED'],
        dateOnOrAfter: today(),
        dateOnOrBefore: todayPlusTwoMonths(),
        doctorIds: ['doc-1'],
        patientIds: ['pat-1'],
      },
      page: 0,
      size: 50,
    });
  });

  it('changing a filter while on a later page resets the request to page 0', () => {
    const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
    searchClinicAppointmentsSpy.mockClear();
    searchClinicAppointmentsSpy.mockReturnValue(of(page([appointment({ id: 'page-2' })], { page: 1 })));
    fixture.componentInstance.onPage({ pageIndex: 1, pageSize: 50, length: 100 } as PageEvent);
    searchClinicAppointmentsSpy.mockClear();
    searchClinicAppointmentsSpy.mockReturnValue(of(page([])));

    fixture.componentInstance.onStatusChange('COMPLETED');

    expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
  });

  it('cancels a SCHEDULED appointment, removing it from the list and showing a success toast', () => {
    const scheduled = appointment({ id: '1' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    cancelAppointmentSpy.mockReturnValue(of({ ...scheduled, state: 'CANCELLED' as const }));

    fixture.componentInstance.cancel(scheduled);

    expect(cancelAppointmentSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.appointments()).toEqual([]);
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('completes a SCHEDULED appointment, removing it from the list and showing a success toast', () => {
    const scheduled = appointment({ id: '1' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    completeAppointmentSpy.mockReturnValue(of({ ...scheduled, state: 'COMPLETED' as const }));

    fixture.componentInstance.complete(scheduled);

    expect(completeAppointmentSpy).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.appointments()).toEqual([]);
    expect(notificationServiceStub.success).toHaveBeenCalled();
  });

  it('keeps the appointment in the list and shows an error toast when Cancel fails', () => {
    const scheduled = appointment({ id: '1' });
    const fixture = setup('CLINIC_ADMIN', [scheduled]);
    cancelAppointmentSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed to cancel appointment.' } })));

    fixture.componentInstance.cancel(scheduled);

    expect(fixture.componentInstance.appointments().map((a) => a.id)).toEqual(['1']);
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed to cancel appointment.');
  });

  it('offers no Cancel/Complete action for a CANCELLED or COMPLETED row', () => {
    const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1', state: 'CANCELLED' }), appointment({ id: '2', state: 'COMPLETED' })]);

    expect(fixture.componentInstance.canManage(fixture.componentInstance.appointments()[0])).toBe(false);
    expect(fixture.componentInstance.canManage(fixture.componentInstance.appointments()[1])).toBe(false);
  });

  it('shows a clear empty state when there are no matching appointments', () => {
    const fixture = setup('CLINIC_ADMIN', []);
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text.toLowerCase()).toContain('no appointments');
  });

  it("shows a Patient's own appointments, without the Patient column or Cancel/Complete actions", () => {
    const fixture = setup('PATIENT', [appointment({ id: '1', state: 'SCHEDULED' })]);

    expect(searchMyAppointmentsSpy).toHaveBeenCalled();
    expect(fixture.componentInstance.columns()).toEqual(['doctorName', 'date', 'startTime', 'state']);

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).not.toContain('Cancel');
    expect(text).not.toContain('Complete');
    const headers = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('th')).map((th) => th.textContent?.trim());
    expect(headers).not.toContain('Patient');
  });

  it('always includes an "actions" column for a Clinic Admin/Doctor session, letting per-row canManage() hide the buttons on a non-Scheduled row', () => {
    const fixture = setup('CLINIC_ADMIN', []);
    expect(fixture.componentInstance.columns()).toContain('actions');
  });

  describe('paging', () => {
    it('requests only the next page when the paginator advances, with the current filters preserved', () => {
      const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockImplementation((request) => of(page([appointment({ id: 'page-2' })], { page: request.page })));

      fixture.componentInstance.onPage({ pageIndex: 1, pageSize: 50, length: 100 } as PageEvent);

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledTimes(1);
      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 1 }));
      expect(fixture.componentInstance.appointments().map((a) => a.id)).toEqual(['page-2']);
    });

    it("reflects the response's totalElements as the paginator's length", () => {
      const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockImplementation((request) => of(page([appointment({ id: '1' })], { totalElements: 237, page: request.page })));

      fixture.componentInstance.onPage({ pageIndex: 0, pageSize: 50, length: 0 } as PageEvent);

      expect(fixture.componentInstance.totalElements()).toBe(237);
    });
  });

  describe('per-role filter visibility (User Story 2)', () => {
    function filterLabels(fixture: ReturnType<typeof setup>): string[] {
      return fixture.debugElement
        .queryAll(By.directive(MultiSelectFilterComponent))
        .map((el) => (el.componentInstance as MultiSelectFilterComponent).label);
    }

    it('shows both the Doctor and Patient filters for a Clinic Admin', () => {
      const fixture = setup('CLINIC_ADMIN');
      expect(filterLabels(fixture).sort()).toEqual(['Doctor', 'Patient']);
    });

    it('shows only the Patient filter for a Doctor — a Doctor never filters by doctor, since every row is already theirs', () => {
      const fixture = setup('DOCTOR');
      expect(filterLabels(fixture)).toEqual(['Patient']);
    });

    it('shows only the Doctor filter for a Patient — a Patient never filters by patient, since every row is already theirs', () => {
      const fixture = setup('PATIENT');
      expect(filterLabels(fixture)).toEqual(['Doctor']);
    });
  });

  describe('sorting (feature 020)', () => {
    it('clicking a column heading sends sortBy/sortDirection ASC, at page 0', () => {
      const fixture = setup('CLINIC_ADMIN');
      searchClinicAppointmentsSpy.mockClear();

      fixture.componentInstance.onSortChange({ active: 'patientName', direction: 'asc' });

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith({
        criteria: { dateOnOrAfter: today(), dateOnOrBefore: todayPlusTwoMonths() },
        page: 0,
        size: 50,
        sortBy: 'PATIENT_NAME',
        sortDirection: 'ASC',
      });
    });

    it('clicking the active sort heading again sends DESC', () => {
      const fixture = setup('CLINIC_ADMIN');
      fixture.componentInstance.onSortChange({ active: 'doctorName', direction: 'asc' });
      searchClinicAppointmentsSpy.mockClear();

      fixture.componentInstance.onSortChange({ active: 'doctorName', direction: 'desc' });

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'DOCTOR_NAME', sortDirection: 'DESC' }));
    });

    it('clicking a different heading switches the active sort to it, ascending', () => {
      const fixture = setup('CLINIC_ADMIN');
      fixture.componentInstance.onSortChange({ active: 'status', direction: 'asc' });
      searchClinicAppointmentsSpy.mockClear();

      fixture.componentInstance.onSortChange({ active: 'doctorName', direction: 'asc' });

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'DOCTOR_NAME', sortDirection: 'ASC' }));
    });

    it('the Date and Time headings share one sort — clicking toggles the same DATE_TIME state either way (research.md #3/#4)', () => {
      const fixture = setup('CLINIC_ADMIN');
      searchClinicAppointmentsSpy.mockClear();

      fixture.componentInstance.onDateTimeSortClick();

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'DATE_TIME', sortDirection: 'ASC' }));

      fixture.componentInstance.onDateTimeSortClick();

      expect(searchClinicAppointmentsSpy).toHaveBeenLastCalledWith(expect.objectContaining({ sortBy: 'DATE_TIME', sortDirection: 'DESC' }));
    });

    it('a filter change preserves the currently active sort rather than clearing it', () => {
      const fixture = setup('CLINIC_ADMIN');
      fixture.componentInstance.onSortChange({ active: 'status', direction: 'desc' });
      searchClinicAppointmentsSpy.mockClear();

      fixture.componentInstance.onStatusChange('SCHEDULED');

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ sortBy: 'STATUS', sortDirection: 'DESC' }));
    });

    it('changing the sort resets the request to page 0', () => {
      const fixture = setup('CLINIC_ADMIN', [appointment({ id: '1' })]);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockReturnValue(of(page([appointment({ id: 'page-2' })], { page: 1 })));
      fixture.componentInstance.onPage({ pageIndex: 1, pageSize: 50, length: 100 } as PageEvent);
      searchClinicAppointmentsSpy.mockClear();
      searchClinicAppointmentsSpy.mockReturnValue(of(page([])));

      fixture.componentInstance.onSortChange({ active: 'doctorName', direction: 'asc' });

      expect(searchClinicAppointmentsSpy).toHaveBeenCalledWith(expect.objectContaining({ page: 0 }));
    });
  });

  describe('status color (feature 014)', () => {
    it('colors a CANCELLED status word red and a COMPLETED one green, leaving a SCHEDULED one uncolored', () => {
      const fixture = setup('CLINIC_ADMIN', [
        appointment({ id: 'scheduled-1', state: 'SCHEDULED' }),
        appointment({ id: 'cancelled-1', state: 'CANCELLED' }),
        appointment({ id: 'completed-1', state: 'COMPLETED' }),
      ]);

      const statusSpans = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('td span'));
      const findByText = (text: string) => statusSpans.find((span) => span.textContent?.trim() === text);

      expect(findByText('SCHEDULED')?.className).toBe('');
      expect(findByText('CANCELLED')?.className).toBe('app-status-cancelled');
      expect(findByText('COMPLETED')?.className).toBe('app-status-completed');
    });
  });
});
