import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthService } from '../auth.service';

describe('LoginComponent', () => {
  function setup() {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: { login: vi.fn() } }],
    });
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('renders the password field masked by default (feature 008)', () => {
    const fixture = setup();
    expect(fixture.componentInstance.passwordVisible()).toBe(false);
    const input = (fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
  });

  it('toggling password visibility reveals it as plain text, and toggling again re-masks it (feature 008)', () => {
    const fixture = setup();

    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();
    expect(fixture.componentInstance.passwordVisible()).toBe(true);
    let input = (fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('text');

    fixture.componentInstance.togglePasswordVisibility();
    fixture.detectChanges();
    expect(fixture.componentInstance.passwordVisible()).toBe(false);
    input = (fixture.nativeElement as HTMLElement).querySelector('input[formcontrolname="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
  });
});
