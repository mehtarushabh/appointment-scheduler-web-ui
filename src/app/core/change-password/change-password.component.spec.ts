import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ChangePasswordComponent } from './change-password.component';
import { AuthService } from '../auth.service';

describe('ChangePasswordComponent', () => {
  let changePasswordSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    changePasswordSpy = vi.fn();
    TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [{ provide: AuthService, useValue: { changePassword: changePasswordSpy } }],
    });
  });

  it('does not submit when the form is invalid', () => {
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    fixture.componentInstance.submit();
    expect(changePasswordSpy).not.toHaveBeenCalled();
  });

  it('submits and marks success', () => {
    changePasswordSpy.mockReturnValue(of(undefined));
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    fixture.componentInstance.form.setValue({ currentPassword: 'old-pw', newPassword: 'new-pw' });

    fixture.componentInstance.submit();

    expect(changePasswordSpy).toHaveBeenCalledWith('old-pw', 'new-pw');
    expect(fixture.componentInstance.submitted()).toBe(true);
  });

  it('surfaces a server error message on failure', () => {
    changePasswordSpy.mockReturnValue(throwError(() => ({ error: { message: 'Current password is incorrect.' } })));
    const fixture = TestBed.createComponent(ChangePasswordComponent);
    fixture.componentInstance.form.setValue({ currentPassword: 'wrong', newPassword: 'new-pw' });

    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage()).toBe('Current password is incorrect.');
  });
});
