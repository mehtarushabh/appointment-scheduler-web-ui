import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';

/**
 * Minimal functional login form (email/password) so the onboarding user stories can be exercised
 * end-to-end. The polished Login Page UI is feature APP-2 — this component is intentionally bare.
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  readonly errorMessage = signal<string | null>(null);

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.errorMessage.set(null);
    const { email, password } = this.form.getRawValue();
    this.auth.login(email!, password!).subscribe({
      // Every role has a Home page now (feature 003); the `home` route dispatches to the right
      // one for the logged-in role via roleGuard, so login itself no longer needs to know where
      // each role belongs.
      next: () => this.router.navigateByUrl('/home'),
      error: () => this.errorMessage.set('Invalid email or password.'),
    });
  }
}
