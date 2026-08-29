import { TestBed } from '@angular/core/testing';
import { MultiSelectFilterComponent, MultiSelectOption } from './multi-select-filter.component';

describe('MultiSelectFilterComponent', () => {
  function setup(options: MultiSelectOption[] = []) {
    TestBed.configureTestingModule({ imports: [MultiSelectFilterComponent] });
    const fixture = TestBed.createComponent(MultiSelectFilterComponent);
    fixture.componentInstance.options = options;
    fixture.componentInstance.label = 'Doctor';
    fixture.detectChanges();
    return fixture;
  }

  const doctors: MultiSelectOption[] = [
    { id: 'd1', label: 'Dana Doc' },
    { id: 'd2', label: 'Sam Smith' },
    { id: 'd3', label: 'Dara Diaz' },
  ];

  it('offers every option when nothing has been typed', () => {
    const fixture = setup(doctors);
    expect(fixture.componentInstance.filteredOptions()).toEqual(doctors);
  });

  it('narrows the offered options to a case-insensitive substring match on the label', () => {
    const fixture = setup(doctors);
    fixture.componentInstance.onSearchInput('da');
    expect(fixture.componentInstance.filteredOptions().map((o) => o.id)).toEqual(['d1', 'd3']);
  });

  it('typing alone never emits selectionChange', () => {
    const fixture = setup(doctors);
    const emitSpy = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(emitSpy);

    fixture.componentInstance.onSearchInput('sam');

    expect(emitSpy).not.toHaveBeenCalled();
  });

  it('a selection change emits the full current list of selected ids', () => {
    const fixture = setup(doctors);
    const emitSpy = vi.fn();
    fixture.componentInstance.selectionChange.subscribe(emitSpy);

    fixture.componentInstance.onSelectionChange(['d1', 'd2']);

    expect(emitSpy).toHaveBeenCalledWith(['d1', 'd2']);
    expect(fixture.componentInstance.selectedIds()).toEqual(['d1', 'd2']);
  });

  it('unchecking down to none emits an empty array, not "no restriction" as an absent event', () => {
    const fixture = setup(doctors);
    const emitSpy = vi.fn();
    fixture.componentInstance.onSelectionChange(['d1']);
    fixture.componentInstance.selectionChange.subscribe(emitSpy);

    fixture.componentInstance.onSelectionChange([]);

    expect(emitSpy).toHaveBeenCalledWith([]);
    expect(fixture.componentInstance.selectedIds()).toEqual([]);
  });

  it('shows a "nothing to select yet" state instead of an empty dropdown when there are no options', () => {
    const fixture = setup([]);
    expect(fixture.nativeElement.textContent).toContain('Nothing to select yet');
  });

  it('does not show the empty state when options are present', () => {
    const fixture = setup(doctors);
    expect(fixture.nativeElement.textContent).not.toContain('Nothing to select yet');
  });

  // 025-select-all-dropdowns
  describe('select all', () => {
    it('reports unchecked, non-indeterminate when nothing is selected', () => {
      const fixture = setup(doctors);
      expect(fixture.componentInstance.allVisibleSelected()).toBe(false);
      expect(fixture.componentInstance.someVisibleSelected()).toBe(false);
    });

    it('selects every currently-visible option when none are selected (Acceptance Scenario 1)', () => {
      const fixture = setup(doctors);
      const emitSpy = vi.fn();
      fixture.componentInstance.selectionChange.subscribe(emitSpy);

      fixture.componentInstance.toggleSelectAll();

      expect(fixture.componentInstance.selectedIds()).toEqual(['d1', 'd2', 'd3']);
      expect(emitSpy).toHaveBeenCalledWith(['d1', 'd2', 'd3']);
      expect(fixture.componentInstance.allVisibleSelected()).toBe(true);
      expect(fixture.componentInstance.someVisibleSelected()).toBe(false);
    });

    it('selects every currently-visible option when only some are selected (Acceptance Scenario 3)', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.onSelectionChange(['d1']);
      expect(fixture.componentInstance.someVisibleSelected()).toBe(true);

      fixture.componentInstance.toggleSelectAll();

      expect(fixture.componentInstance.selectedIds()).toEqual(['d1', 'd2', 'd3']);
    });

    it('clears every currently-visible option when all are already selected (Acceptance Scenario 2)', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.onSelectionChange(['d1', 'd2', 'd3']);
      const emitSpy = vi.fn();
      fixture.componentInstance.selectionChange.subscribe(emitSpy);

      fixture.componentInstance.toggleSelectAll();

      expect(fixture.componentInstance.selectedIds()).toEqual([]);
      expect(emitSpy).toHaveBeenCalledWith([]);
      expect(fixture.componentInstance.allVisibleSelected()).toBe(false);
    });

    it('leaves an already-selected option untouched when a search hides it, while selecting the rest (FR-003, Acceptance Scenario 4)', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.onSelectionChange(['d2']); // "Sam Smith" — will be hidden by the search below
      fixture.componentInstance.onSearchInput('da'); // matches d1 "Dana Doc" and d3 "Dara Diaz" only

      fixture.componentInstance.toggleSelectAll();

      expect(fixture.componentInstance.selectedIds().sort()).toEqual(['d1', 'd2', 'd3']);
    });

    it('leaves an already-selected-but-hidden option untouched when clearing the visible set (FR-003)', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.onSelectionChange(['d1', 'd2', 'd3']);
      fixture.componentInstance.onSearchInput('da'); // hides d2 "Sam Smith"; d1/d3 remain visible and selected

      fixture.componentInstance.toggleSelectAll();

      expect(fixture.componentInstance.selectedIds()).toEqual(['d2']);
    });

    it('reports checked/indeterminate based on the visible set only, not the whole selection', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.onSelectionChange(['d2']);
      fixture.componentInstance.onSearchInput('da'); // d2 is now hidden; d1/d3 are visible and unselected

      expect(fixture.componentInstance.allVisibleSelected()).toBe(false);
      expect(fixture.componentInstance.someVisibleSelected()).toBe(false);
    });

    it('does nothing when there is nothing currently visible to select (Edge Case, empty search results)', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.onSelectionChange(['d1']);
      fixture.componentInstance.onSearchInput('zzz'); // matches nothing
      const emitSpy = vi.fn();
      fixture.componentInstance.selectionChange.subscribe(emitSpy);

      fixture.componentInstance.toggleSelectAll();

      expect(emitSpy).toHaveBeenCalledWith(['d1']);
      expect(fixture.componentInstance.allVisibleSelected()).toBe(false);
      expect(fixture.componentInstance.someVisibleSelected()).toBe(false);
    });

    it('manually unchecking one option after select-all only affects that option (Edge Case 2)', () => {
      const fixture = setup(doctors);
      fixture.componentInstance.toggleSelectAll();

      fixture.componentInstance.onSelectionChange(['d1', 'd3']);

      expect(fixture.componentInstance.selectedIds()).toEqual(['d1', 'd3']);
    });
  });
});
