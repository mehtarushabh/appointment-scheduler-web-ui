import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';

export interface MultiSelectOption {
  id: string;
  label: string;
}

/**
 * Shared checkbox multi-select with a type-to-search box in its panel (research.md #5/#8 of
 * feature 019) — used for both the Appointments page's Doctor and Patient filters. Owns its own
 * selection state (an uncontrolled component): a parent only ever listens to `selectionChange`,
 * never pushes a selection back in, matching this feature's "resets to empty every time the page
 * is opened" behavior (spec.md Assumptions).
 *
 * `mat-select multiple` already renders one checkbox per option and reports the full current
 * selection on every toggle via `(selectionChange)` — the search box is the only custom piece,
 * projected into the panel with click/keydown propagation stopped so typing into it doesn't
 * toggle an option or close the panel. 025-select-all-dropdowns: "select all" reuses that exact
 * pattern (research.md #2) — a plain `<mat-checkbox>` in the panel, not a `mat-option`, so it
 * never becomes part of `mat-select`'s own reported selection and both directions route through
 * the same `onSelectionChange()` every other selection change already uses.
 */
@Component({
  selector: 'app-multi-select-filter',
  standalone: true,
  imports: [MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './multi-select-filter.component.html',
})
export class MultiSelectFilterComponent {
  @Input({ required: true }) options: MultiSelectOption[] = [];
  @Input({ required: true }) label = '';
  @Output() readonly selectionChange = new EventEmitter<string[]>();

  readonly searchText = signal('');
  readonly selectedIds = signal<string[]>([]);

  filteredOptions(): MultiSelectOption[] {
    const query = this.searchText().trim().toLowerCase();
    if (!query) {
      return this.options;
    }
    return this.options.filter((option) => option.label.toLowerCase().includes(query));
  }

  onSearchInput(value: string): void {
    this.searchText.set(value);
  }

  onSelectionChange(selected: string[]): void {
    this.selectedIds.set(selected);
    this.selectionChange.emit(selected);
  }

  /** Adapts Material's `MatSelectChange` (its `value` is `unknown` for a `multiple` select) to the plain string array this component works with. */
  onMatSelectionChange(event: MatSelectChange): void {
    this.onSelectionChange(event.value as string[]);
  }

  /** 025-select-all-dropdowns (research.md #4): checked state for the "select all" checkbox — the visible set only, never the whole selection. */
  allVisibleSelected(): boolean {
    const visible = this.filteredOptions();
    return visible.length > 0 && visible.every((option) => this.selectedIds().includes(option.id));
  }

  /** 025-select-all-dropdowns (research.md #4): indeterminate state — some, but not all, of the visible set is selected. */
  someVisibleSelected(): boolean {
    const visible = this.filteredOptions();
    return visible.some((option) => this.selectedIds().includes(option.id)) && !this.allVisibleSelected();
  }

  /**
   * 025-select-all-dropdowns (research.md #3): toggles only the currently-visible (search-
   * filtered) options — selecting all of them if any are unselected, otherwise clearing exactly
   * those. An already-selected option a search term is currently hiding is never touched either
   * way.
   */
  toggleSelectAll(): void {
    const visibleIds = this.filteredOptions().map((option) => option.id);
    const next = this.allVisibleSelected()
      ? this.selectedIds().filter((id) => !visibleIds.includes(id))
      : Array.from(new Set([...this.selectedIds(), ...visibleIds]));
    this.onSelectionChange(next);
  }
}
