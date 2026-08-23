import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of } from 'rxjs';
import { AddressFormComponent, createAddressFormGroup } from './address-form.component';
import { AddressAutocompleteService } from '../google-maps/address-autocomplete.service';
import { AddressFormValue } from './address-form.component';

function prediction(overrides: Partial<google.maps.places.AutocompletePrediction> = {}): google.maps.places.AutocompletePrediction {
  return { description: '1 Main St, Springfield, IL', place_id: 'place-1', ...overrides } as google.maps.places.AutocompletePrediction;
}

function addressValue(overrides: Partial<AddressFormValue> = {}): AddressFormValue {
  return {
    addressLine1: '1 Main St',
    addressLine2: null,
    city: 'Springfield',
    state: 'Illinois',
    zip: '62704',
    country: 'United States',
    ...overrides,
  };
}

describe('AddressFormComponent', () => {
  let predictSpy: ReturnType<typeof vi.fn>;
  let getAddressDetailsSpy: ReturnType<typeof vi.fn>;

  function setup() {
    predictSpy = vi.fn().mockReturnValue(of([]));
    getAddressDetailsSpy = vi.fn().mockReturnValue(of(addressValue()));

    TestBed.configureTestingModule({
      imports: [AddressFormComponent],
      providers: [
        { provide: AddressAutocompleteService, useValue: { predict: predictSpy, getAddressDetails: getAddressDetailsSpy } },
      ],
    });

    const fixture = TestBed.createComponent(AddressFormComponent);
    fixture.componentInstance.group = createAddressFormGroup(new FormBuilder());
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders Country first, as a required dropdown listing every country (never a text box)', () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;

    const labels = Array.from(el.querySelectorAll('mat-label')).map((label) => label.textContent?.trim());
    expect(labels[0]).toBe('Country');
    expect(el.querySelector('mat-select')).toBeTruthy();

    const countryControl = fixture.componentInstance.group.get('country')!;
    countryControl.setValue('');
    expect(countryControl.hasError('required')).toBe(true);
  });

  it("shows Address line 2's placeholder marking it optional", () => {
    const fixture = setup();
    const el = fixture.nativeElement as HTMLElement;
    const line2Input = Array.from(el.querySelectorAll('input')).find(
      (input) => input.getAttribute('formcontrolname') === 'addressLine2'
    );

    expect(line2Input?.placeholder).toBe('Optional');
  });

  it('requests predictions once typing into Address line 1 settles (debounced)', () => {
    const fixture = setup();

    fixture.componentInstance.group.get('addressLine1')!.setValue('1');
    fixture.componentInstance.group.get('addressLine1')!.setValue('12');
    fixture.componentInstance.group.get('addressLine1')!.setValue('123 Main');
    expect(predictSpy).not.toHaveBeenCalled();

    vi.advanceTimersByTime(300);

    expect(predictSpy).toHaveBeenCalledTimes(1);
    expect(predictSpy).toHaveBeenCalledWith('123 Main');
  });

  it('renders the predictions the service returns for the typed text', () => {
    const fixture = setup();
    predictSpy.mockReturnValue(of([prediction()]));

    fixture.componentInstance.group.get('addressLine1')!.setValue('123 Main');
    vi.advanceTimersByTime(300);

    expect(fixture.componentInstance.addressLine1Predictions()).toEqual([prediction()]);
  });

  it('populates every field but Address line 2 when a suggestion is picked, and clears the prediction list', () => {
    const fixture = setup();
    fixture.componentInstance.addressLine1Predictions.set([prediction()]);
    fixture.componentInstance.group.patchValue({ addressLine2: 'Suite 4' });

    fixture.componentInstance.selectSuggestion({ option: { value: prediction() } } as MatAutocompleteSelectedEvent);

    expect(getAddressDetailsSpy).toHaveBeenCalledWith('place-1');
    expect(fixture.componentInstance.group.value).toMatchObject({
      addressLine1: '1 Main St',
      addressLine2: 'Suite 4',
      city: 'Springfield',
      state: 'Illinois',
      zip: '62704',
      country: 'United States',
    });
    expect(fixture.componentInstance.addressLine1Predictions()).toEqual([]);
  });
});
