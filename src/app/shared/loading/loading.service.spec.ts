import { TestBed } from '@angular/core/testing';
import { LoadingService } from './loading.service';

describe('LoadingService', () => {
  function setup() {
    TestBed.configureTestingModule({});
    return TestBed.inject(LoadingService);
  }

  it('reports not loading initially', () => {
    const service = setup();
    expect(service.isLoading()).toBe(false);
  });

  it('reports loading after a single start()', () => {
    const service = setup();
    service.start();
    expect(service.isLoading()).toBe(true);
  });

  it('stays loading while one of two overlapping requests is still in flight', () => {
    const service = setup();
    service.start();
    service.start();

    service.end();
    expect(service.isLoading()).toBe(true);

    service.end();
    expect(service.isLoading()).toBe(false);
  });

  it('never goes negative if end() is called more times than start()', () => {
    const service = setup();
    service.end();
    service.end();
    expect(service.isLoading()).toBe(false);

    service.start();
    expect(service.isLoading()).toBe(true);
  });
});
