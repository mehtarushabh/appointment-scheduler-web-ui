import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ProfilePhotoSectionComponent } from './profile-photo-section.component';
import { ProfileService } from '../profile.service';
import { NotificationService } from '../../notification/notification.service';
import { UploadProfilePhotoResponse } from '../../models';

function fileEvent(file: File | null): Event {
  const input = document.createElement('input');
  input.type = 'file';
  Object.defineProperty(input, 'files', { value: file ? [file] : [] });
  return { target: input } as unknown as Event;
}

describe('ProfilePhotoSectionComponent', () => {
  let uploadProfilePhotoSpy: ReturnType<typeof vi.fn>;
  let notificationServiceStub: { success: ReturnType<typeof vi.fn>; error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    uploadProfilePhotoSpy = vi.fn();
    notificationServiceStub = { success: vi.fn(), error: vi.fn() };
    TestBed.configureTestingModule({
      imports: [ProfilePhotoSectionComponent],
      providers: [
        { provide: ProfileService, useValue: { uploadProfilePhoto: uploadProfilePhotoSpy } },
        { provide: NotificationService, useValue: notificationServiceStub },
      ],
    });
  });

  it('does nothing when the file input reports no file', () => {
    const fixture = TestBed.createComponent(ProfilePhotoSectionComponent);

    fixture.componentInstance.onFileSelected(fileEvent(null));

    expect(uploadProfilePhotoSpy).not.toHaveBeenCalled();
  });

  it('rejects a file over 40MB client-side without calling the service', () => {
    const fixture = TestBed.createComponent(ProfilePhotoSectionComponent);
    const oversized = new File([new Uint8Array(41 * 1024 * 1024)], 'huge.png', { type: 'image/png' });

    fixture.componentInstance.onFileSelected(fileEvent(oversized));

    expect(uploadProfilePhotoSpy).not.toHaveBeenCalled();
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Photo must be 40MB or smaller.');
  });

  it('rejects a non-JPEG/PNG file type client-side without calling the service', () => {
    const fixture = TestBed.createComponent(ProfilePhotoSectionComponent);
    const wrongType = new File(['not an image'], 'file.gif', { type: 'image/gif' });

    fixture.componentInstance.onFileSelected(fileEvent(wrongType));

    expect(uploadProfilePhotoSpy).not.toHaveBeenCalled();
    expect(notificationServiceStub.error).toHaveBeenCalledWith('Photo must be a JPEG or PNG image.');
  });

  it('uploads a valid photo and emits the new URL on success', () => {
    const response: UploadProfilePhotoResponse = { profilePhotoUrl: 'https://example.com/photo.png' };
    uploadProfilePhotoSpy.mockReturnValue(of(response));
    const fixture = TestBed.createComponent(ProfilePhotoSectionComponent);
    const emitted: string[] = [];
    fixture.componentInstance.sectionSaved.subscribe((url) => emitted.push(url));
    const validFile = new File([new Uint8Array(100)], 'photo.png', { type: 'image/png' });

    fixture.componentInstance.onFileSelected(fileEvent(validFile));

    expect(uploadProfilePhotoSpy).toHaveBeenCalledWith(validFile);
    expect(notificationServiceStub.success).toHaveBeenCalled();
    expect(emitted).toEqual(['https://example.com/photo.png']);
    expect(fixture.componentInstance.uploading()).toBe(false);
  });

  it('shows an error toast and does not emit on failure', () => {
    uploadProfilePhotoSpy.mockReturnValue(throwError(() => ({ error: { message: 'Failed.' } })));
    const fixture = TestBed.createComponent(ProfilePhotoSectionComponent);
    const emitted: string[] = [];
    fixture.componentInstance.sectionSaved.subscribe((url) => emitted.push(url));
    const validFile = new File([new Uint8Array(100)], 'photo.jpg', { type: 'image/jpeg' });

    fixture.componentInstance.onFileSelected(fileEvent(validFile));

    expect(notificationServiceStub.error).toHaveBeenCalledWith('Failed.');
    expect(emitted).toEqual([]);
    expect(fixture.componentInstance.uploading()).toBe(false);
  });
});
