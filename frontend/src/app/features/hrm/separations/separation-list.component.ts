import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

interface Separation {
  id: number;
  employeeId: number;
  employeeName: string;
  type: string;
  effectiveDate: string;
  reason: string;
  approved: boolean;
}

interface SeparationRequest {
  employeeId: number;
  type: string;
  effectiveDate: string;
  reason: string;
}

@Component({
  selector: 'app-separation-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, ConfirmDialogComponent, NgbDropdownModule],
  template: `
    <div class="page animate-fade-in-up">
      <app-page-header title="Separations" subtitle="Manage employee separations and exits">
        <button class="btn btn-gold" (click)="openModal()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Initiate Separation
        </button>
      </app-page-header>

      <div class="card card-elevated">
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [rows]="rows()"
            [page]="currentPage()"
            [totalPages]="totalPages()"
            [totalElements]="totalElements()"
            [loading]="loading()"
            emptyTitle="No separations found"
            emptySubtitle="Initiate the first separation process."
            (pageChange)="loadPage($event)"
            (rowClick)="openModal($event)"
          />
        </div>
      </div>

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editing() ? 'Edit' : 'Initiate' }} Separation</h2>
              <button class="btn-close" (click)="closeModal()">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>

            <form class="modal-body" (ngSubmit)="save()">
              <div class="form-group">
                <label class="form-label">Employee <span class="required">*</span></label>
                <div class="dropdown-select" ngbDropdown>
                  <button class="form-control" [class.has-value]="form.employeeId" ngbDropdownToggle>
                    {{ form.employeeId ? getEmployeeName(form.employeeId) : 'Select employee...' }}
                  </button>
                  @if (employees().length > 0) {
                    <div class="dropdown-menu">
                        @for (employee of employees(); track employee.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectEmployee(employee.id)">
                            {{ employee.firstName }} {{ employee.lastName }}
                          </button>
                        }
                    </div>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Separation Type <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="form.type" name="type" required>
                    <option value="">Select type</option>
                    <option value="RESIGNATION">Resignation</option>
                    <option value="RETIREMENT">Retirement</option>
                    <option value="TERMINATION">Termination</option>
                    <option value="END_OF_CONTRACT">End of Contract</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Effective Date <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="form.effectiveDate" name="effectiveDate" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Reason</label>
                <textarea class="form-control" [(ngModel)]="form.reason" name="reason" rows="2" placeholder="Reason for separation..."></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-gold" [disabled]="!isValid() || saving()">
                  @if (saving()) { <span class="spinner-sm"></span> Saving... } @else { {{ editing() ? 'Update' : 'Initiate' }} }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (confirmDelete()) {
        <app-confirm-dialog
          title="Delete Separation"
          [message]="'Are you sure you want to delete this separation for ' + confirmDelete()!.employeeName + '?'"
          confirmLabel="Delete"
          type="danger"
          (confirm)="doDelete()"
          (cancel)="confirmDelete.set(null)"
        ></app-confirm-dialog>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-family: var(--font-display); font-size: var(--fs-h1); margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--color-text-muted); font-size: var(--fs-small); }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); display: flex; align-items: center;
      justify-content: center; z-index: 10001; animation: fadeIn 0.2s var(--ease-out);
    }
    .modal-panel {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); width: 90%; max-width: 560px;
      box-shadow: var(--shadow-lg); animation: fadeInUp 0.3s var(--ease-spring);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
      h2 { font-family: var(--font-display); font-size: var(--fs-h3); }
    }
    .btn-close {
      background: none; border: none; color: var(--color-text-muted); padding: 4px;
      cursor: pointer; border-radius: var(--radius-sm);
      &:hover { color: var(--color-text-primary); background: var(--color-surface-elevated); }
    }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.375rem; }
    .required { color: var(--color-danger); }
    .dropdown-select {
      position: relative; width: 100%;
      .form-control { cursor: pointer; }
      .has-value { color: var(--color-text-primary); }
    }
    .dropdown-menu {
      position: absolute; top: 100%; left: 0; right: 0;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); max-height: 240px; overflow-y: auto;
      z-index: 10002; margin-top: 4px;
    }
    .dropdown-item {
      display: block; width: 100%; background: none; border: none;
      text-align: left; padding: 0.75rem 1rem; cursor: pointer;
      color: var(--color-text-primary); transition: all var(--duration-fast) var(--ease-out);
      &:hover { background: var(--color-surface-elevated); color: var(--color-gold); }
    }
    textarea.form-control { resize: vertical; min-height: 80px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding-top: 1rem; margin-top: 0.5rem;
    }
    .spinner-sm {
      width: 14px; height: 14px; border: 2px solid transparent;
      border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite;
      display: inline-block;
    }
  `],
})
export class SeparationListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'type', label: 'Type', width: '120px', align: 'center' },
    { key: 'effectiveDate', label: 'Effective Date', width: '120px', align: 'center' },
    { key: 'approved', label: 'Status', width: '100px', align: 'center' },
    { key: 'id', label: '', width: '80px', align: 'center' },
  ];

  rows = signal<Separation[]>([]);
  employees = signal<any[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  showModal = signal(false);
  editing = signal<Separation | null>(null);
  saving = signal(false);
  confirmDelete = signal<Separation | null>(null);

  form: SeparationRequest = {
    employeeId: 0,
    type: '',
    effectiveDate: '',
    reason: '',
  };

  constructor(
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.loadPage(0);
  }

  loadInitialData(): void {
    this.crud.listAll('employees').subscribe({
      next: (data) => this.employees.set(data || []),
      error: () => this.toast.error('Failed to load employees'),
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<Separation>('separations', page, 10).subscribe({
      next: (data) => {
        this.rows.set(data.content || []);
        this.currentPage.set(data.number);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectEmployee(employeeId: number): void {
    this.form.employeeId = employeeId;
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees().find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }

  isValid(): boolean {
    return !!(this.form.employeeId && this.form.type && this.form.effectiveDate);
  }

  openModal(separation?: Separation): void {
    if (separation) {
      this.editing.set(separation);
      this.form = {
        employeeId: separation.employeeId,
        type: separation.type,
        effectiveDate: separation.effectiveDate,
        reason: separation.reason,
      };
    } else {
      this.editing.set(null);
      this.form = {
        employeeId: 0,
        type: '',
        effectiveDate: '',
        reason: '',
      };
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (!this.isValid()) return;
    this.saving.set(true);

    const obs = this.editing()
      ? this.crud.update<SeparationRequest>('separations', this.editing()!.id, this.form)
      : this.crud.create<SeparationRequest>('separations', this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Separation updated' : 'Separation initiated');
        this.closeModal();
        this.loadPage(this.currentPage());
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  doDelete(): void {
    const separation = this.confirmDelete();
    if (!separation) return;

    this.crud.delete('separations', separation.id).subscribe({
      next: () => {
        this.toast.success('Separation deleted');
        this.confirmDelete.set(null);
        this.loadPage(this.currentPage());
      },
      error: () => this.toast.error('Failed to delete'),
    });
    });
  }
}