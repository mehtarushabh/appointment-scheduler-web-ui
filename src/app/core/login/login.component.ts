import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { FaIconComponent } from '@fortawesome/angular-fontawesome';
import { faEnvelope, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../auth.service';
import { UserPreferencesService } from '../../shared/preferences/user-preferences.service';

/** Functional login form (email/password) so the onboarding user stories can be exercised end-to-end. */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatCardModule, FaIconComponent],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly userPreferencesService = inject(UserPreferencesService);
  private readonly router = inject(Router);

  protected readonly faEnvelope = faEnvelope;
  protected readonly faEye = faEye;
  protected readonly faEyeSlash = faEyeSlash;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  /** Feature 008: matches the mockup's eye/eye-slash affordance with a real show/hide toggle. */
  readonly passwordVisible = signal(false);

  readonly errorMessage = signal<string | null>(null);

  togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      // Every role has a Home page now (feature 003); the `home` route dispatches to the right
      // one for the logged-in role via roleGuard. 026-user-preferences: once logged in, check for
      // a saved default landing page and go there instead — falling back to Home both when none is
      // set and if the fetch itself errors, so this lookup can never block or break an otherwise
      // successful login (FR-006, research.md #3).
      next: () =>
        this.userPreferencesService.getPreferences().subscribe({
          next: (preferences) => this.router.navigateByUrl(preferences.defaultLandingPage),
          error: () => this.router.navigateByUrl('/home'),
        }),
      error: () => this.errorMessage.set('Invalid email or password.'),
    });
  }
}
