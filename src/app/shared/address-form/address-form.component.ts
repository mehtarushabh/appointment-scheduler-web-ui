import { Component, DestroyRef, Input, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { AddressAutocompleteService } from '../google-maps/address-autocomplete.service';
import { Country, countries } from '../country-list';

/** The same six fields used by both Clinic and User addresses (data-model.md "Value Object: Address"). */
export interface AddressFormValue {
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export function createAddressFormGroup(fb: FormBuilder): FormGroup {
  return fb.group({
    addressLine1: ['', Validators.required],
    addressLine2: [''],
    city: ['', Validators.required],
    state: ['', Validators.required],
    zip: ['', Validators.required],
    country: ['', Validators.required],
  });
}

const PREDICTION_DEBOUNCE_MS = 300;

/**
 * Shared, reusable Address fields (research.md #8) — rendered wherever a form needs an address,
 * bound against a FormGroup built by createAddressFormGroup() and passed in by the parent form.
 *
 * Feature 015: Country is a required, pick-only dropdown (never free text); Address line 1 shows
 * live Google Places suggestions below it as the user types (debounced), and picking one populates
 * every other field via AddressAutocompleteService — Address line 2 is left untouched, since
 * Google's results don't reliably include a unit/suite number (research.md #5).
 */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatOptionModule, MatAutocompleteModule],
  templateUrl: './address-form.component.html',
})
export class AddressFormComponent implements OnInit {
  private readonly addressAutocomplete = inject(AddressAutocompleteService);
  private readonly destroyRef = inject(DestroyRef);

  @Input({ required: true }) group!: FormGroup;

  readonly countries: Country[] = countries;
  readonly addressLine1Predictions = signal<google.maps.places.AutocompletePrediction[]>([]);

  ngOnInit(): void {
    this.group
      .get('addressLine1')!
      .valueChanges.pipe(
        debounceTime(PREDICTION_DEBOUNCE_MS),
        distinctUntilChanged(),
        switchMap((value: string) => this.addressAutocomplete.predict(value)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((predictions) => this.addressLine1Predictions.set(predictions));
  }

  selectSuggestion(event: MatAutocompleteSelectedEvent): void {
    const prediction: google.maps.places.AutocompletePrediction = event.option.value;
    this.addressAutocomplete.getAddressDetails(prediction.place_id).subscribe((address) => {
      this.group.patchValue({
        addressLine1: address.addressLine1,
        city: address.city,
        state: address.state,
        zip: address.zip,
        country: address.country,
      });
      this.addressLine1Predictions.set([]);
    });
  }

  /** Shows a prediction's plain description while one is pending selection; a plain string (the resolved address) displays as-is. */
  displayPrediction(value: string | google.maps.places.AutocompletePrediction | null): string {
    if (value && typeof value === 'object') {
      return value.description;
    }
    return value ?? '';
  }
}
