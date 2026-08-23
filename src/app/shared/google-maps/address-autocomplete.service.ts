import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, of, shareReplay, switchMap } from 'rxjs';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { AddressFormValue } from '../address-form/address-form.component';

const MIN_PREDICTION_INPUT_LENGTH = 3;

function mapAddressComponents(components: google.maps.GeocoderAddressComponent[]): AddressFormValue {
  const find = (type: string) => components.find((component) => component.types.includes(type))?.long_name ?? '';
  const streetNumber = find('street_number');
  const route = find('route');

  return {
    addressLine1: [streetNumber, route].filter(Boolean).join(' '),
    addressLine2: null,
    city: find('locality'),
    state: find('administrative_area_level_1'),
    zip: find('postal_code'),
    country: find('country'),
  };
}

/**
 * Google Places integration for address autocomplete (feature 015): fetches the API key from the
 * backend and loads the Places library at runtime via the loader's `importLibrary()` function
 * (research.md #1/#2, both cached for the whole session), then wraps its classic
 * AutocompleteService/PlacesService callback API — paired with one session token per interaction
 * (research.md #3) — as observables `AddressFormComponent` can subscribe to. Suggestions
 * themselves are rendered by the caller via Angular Material's own MatAutocomplete, never
 * Google's widget.
 */
@Injectable({ providedIn: 'root' })
export class AddressAutocompleteService {
  private readonly http = inject(HttpClient);

  private apiKey$?: Observable<string>;
  private placesLibrary$?: Observable<google.maps.PlacesLibrary>;
  private autocompleteService?: google.maps.places.AutocompleteService;
  private placesService?: google.maps.places.PlacesService;
  private sessionToken?: google.maps.places.AutocompleteSessionToken;

  /** Below the minimum length, resolves to no predictions without any network call (research.md #7). */
  predict(input: string): Observable<google.maps.places.AutocompletePrediction[]> {
    if (input.length < MIN_PREDICTION_INPUT_LENGTH) {
      return of([]);
    }

    return this.whenReady().pipe(
      switchMap((places) => {
        this.sessionToken ??= new places.AutocompleteSessionToken();
        return new Observable<google.maps.places.AutocompletePrediction[]>((subscriber) => {
          this.autocompleteService!.getPlacePredictions({ input, sessionToken: this.sessionToken }, (predictions, status) => {
            subscriber.next(status === places.PlacesServiceStatus.OK && predictions ? predictions : []);
            subscriber.complete();
          });
        });
      })
    );
  }

  /** Ends the session token this prediction belonged to (research.md #3) and maps the result (research.md #5). */
  getAddressDetails(placeId: string): Observable<AddressFormValue> {
    return this.whenReady().pipe(
      switchMap((places) => {
        const sessionToken = this.sessionToken;
        this.sessionToken = undefined;
        return new Observable<AddressFormValue>((subscriber) => {
          this.placesService!.getDetails({ placeId, sessionToken, fields: ['address_components'] }, (place, status) => {
            if (status === places.PlacesServiceStatus.OK && place) {
              subscriber.next(mapAddressComponents(place.address_components ?? []));
              subscriber.complete();
            } else {
              subscriber.error(new Error('Failed to fetch address details.'));
            }
          });
        });
      })
    );
  }

  private whenReady(): Observable<google.maps.PlacesLibrary> {
    this.placesLibrary$ ??= this.fetchApiKey().pipe(
      switchMap((apiKey) => {
        setOptions({ key: apiKey, libraries: ['places'] });
        return from(importLibrary('places'));
      }),
      map((places) => {
        this.autocompleteService = new places.AutocompleteService();
        this.placesService = new places.PlacesService(document.createElement('div'));
        return places;
      }),
      shareReplay(1)
    );
    return this.placesLibrary$;
  }

  private fetchApiKey(): Observable<string> {
    this.apiKey$ ??= this.http.get<{ apiKey: string }>('/api/v1/config/maps-api-key').pipe(
      map((response) => response.apiKey),
      shareReplay(1)
    );
    return this.apiKey$;
  }
}
