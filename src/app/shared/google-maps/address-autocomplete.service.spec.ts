import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AddressAutocompleteService } from './address-autocomplete.service';

const { importLibrary, setOptions } = vi.hoisted(() => ({
  importLibrary: vi.fn(),
  setOptions: vi.fn(),
}));

vi.mock('@googlemaps/js-api-loader', () => ({ importLibrary, setOptions }));

function fakePrediction(): google.maps.places.AutocompletePrediction {
  return { description: '1 Main St, Springfield', place_id: 'place-1' } as google.maps.places.AutocompletePrediction;
}

function fakeAddressComponent(longName: string, type: string): google.maps.GeocoderAddressComponent {
  return { long_name: longName, short_name: longName, types: [type] };
}

describe('AddressAutocompleteService', () => {
  let httpMock: HttpTestingController;
  let getPlacePredictions: ReturnType<typeof vi.fn>;
  let getDetails: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    setOptions.mockClear();
    getPlacePredictions = vi.fn();
    getDetails = vi.fn();
    importLibrary.mockReset().mockResolvedValue({
      // `new places.AutocompleteService()` requires a real constructor — an arrow function
      // can't be invoked with `new`, so these mock implementations must be plain `function`s.
      AutocompleteService: vi.fn().mockImplementation(function () {
        return { getPlacePredictions };
      }),
      PlacesService: vi.fn().mockImplementation(function () {
        return { getDetails };
      }),
      AutocompleteSessionToken: vi.fn().mockImplementation(function () {
        return {};
      }),
      PlacesServiceStatus: { OK: 'OK', ZERO_RESULTS: 'ZERO_RESULTS' },
    });

    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function service(): AddressAutocompleteService {
    return TestBed.inject(AddressAutocompleteService);
  }

  it('returns no predictions and makes no request for input shorter than the minimum length', async () => {
    const result = await firstValueFrom(service().predict('a'));

    expect(result).toEqual([]);
    httpMock.expectNone('/api/v1/config/maps-api-key');
  });

  it('fetches the API key, loads the Places library, and returns predictions for valid input', async () => {
    getPlacePredictions.mockImplementation((_request: unknown, callback: (p: unknown, s: string) => void) => {
      callback([fakePrediction()], 'OK');
    });

    const resultPromise = firstValueFrom(service().predict('123 Main'));
    httpMock.expectOne('/api/v1/config/maps-api-key').flush({ apiKey: 'test-key' });
    const result = await resultPromise;

    expect(setOptions).toHaveBeenCalledWith({ key: 'test-key', libraries: ['places'] });
    expect(importLibrary).toHaveBeenCalledWith('places');
    expect(result).toEqual([fakePrediction()]);
  });

  it('fetches the API key and loads the library only once across multiple predict() calls', async () => {
    getPlacePredictions.mockImplementation((_request: unknown, callback: (p: unknown, s: string) => void) => {
      callback([], 'ZERO_RESULTS');
    });

    const firstPromise = firstValueFrom(service().predict('123 Main'));
    httpMock.expectOne('/api/v1/config/maps-api-key').flush({ apiKey: 'test-key' });
    await firstPromise;

    const secondPromise = firstValueFrom(service().predict('123 Main St'));
    httpMock.expectNone('/api/v1/config/maps-api-key');
    await secondPromise;

    expect(importLibrary).toHaveBeenCalledTimes(1);
  });

  it("maps a selected place's address components onto AddressFormValue, leaving address line 2 unset", async () => {
    getDetails.mockImplementation((_request: unknown, callback: (p: unknown, s: string) => void) => {
      callback(
        {
          address_components: [
            fakeAddressComponent('1', 'street_number'),
            fakeAddressComponent('Main St', 'route'),
            fakeAddressComponent('Springfield', 'locality'),
            fakeAddressComponent('Illinois', 'administrative_area_level_1'),
            fakeAddressComponent('62704', 'postal_code'),
            fakeAddressComponent('United States', 'country'),
          ],
        },
        'OK'
      );
    });

    const resultPromise = firstValueFrom(service().getAddressDetails('place-1'));
    httpMock.expectOne('/api/v1/config/maps-api-key').flush({ apiKey: 'test-key' });
    const address = await resultPromise;

    expect(address).toEqual({
      addressLine1: '1 Main St',
      addressLine2: null,
      city: 'Springfield',
      state: 'Illinois',
      zip: '62704',
      country: 'United States',
    });
  });
});
