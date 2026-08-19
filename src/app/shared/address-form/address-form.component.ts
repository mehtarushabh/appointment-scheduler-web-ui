import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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

/**
 * Shared, reusable Address fields (research.md #8) — rendered wherever a form needs an address,
 * bound against a FormGroup built by createAddressFormGroup() and passed in by the parent form.
 */
@Component({
  selector: 'app-address-form',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './address-form.component.html',
})
export class AddressFormComponent {
  @Input({ required: true }) group!: FormGroup;
}
