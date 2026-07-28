import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

interface Promotion {
  id: number;
  employeeId: number;
  employeeName: string;
  fromDesignationId: number;
  toDesignationId: number;
  fromGradeId: number;
  toGradeId: number;
  type: string;
  effectiveDate: string;
  remarks: string;
}

interface PromotionRequest {
  employeeId: number;
  fromDesignationId: number;
  toDesignationId: number;
  fromGradeId: number;
  toGradeId: number;
  type: string;
  effectiveDate: string;
  remarks: string;
}

@Component({
  selector: 'app-promotion-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, ConfirmDialogComponent, NgbDropdownModule],
  template: `
    <div class="page animate-fade-in-up">
      <app-page-header title="Promotions" subtitle="Manage employee promotions and demotions">
        <button class="btn btn-gold" (click)="openModal()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Initiate Promotion
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
            emptyTitle="No promotions found"
            emptySubtitle="Initiate the first promotion to recognize employee growth."
            (pageChange)="loadPage($event)"
            (rowClick)="openModal($event)"
          />
        </div>
      </div>

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editing() ? 'Edit' : 'Initiate' }} Promotion</h2>
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
                  <label class="form-label">From Designation</label>
                  <div class="dropdown-select" ngbDropdown>
                    <button class="form-control" [class.has-value]="form.fromDesignationId" ngbDropdownToggle>
                      {{ form.fromDesignationId ? getDesignationName(form.fromDesignationId) : 'Select designation...' }}
                    </button>
                    @if (designations().length > 0) {
                      <div class="dropdown-menu">
                        @for (designation of designations(); track designation.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectFromDesignation(designation.id)">
                            {{ designation.name }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">To Designation <span class="required">*</span></label>
                  <div class="dropdown-select" ngbDropdown>
                    <button class="form-control" [class.has-value]="form.toDesignationId" ngbDropdownToggle>
                      {{ form.toDesignationId ? getDesignationName(form.toDesignationId) : 'Select designation...' }}
                    </button>
                    @if (designations().length > 0) {
                      <div class="dropdown-menu">
                        @for (designation of designations(); track designation.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectToDesignation(designation.id)">
                            {{ designation.name }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">From Grade</label>
                  <div class="dropdown-select" ngbDropdown>
                    <button class="form-control" [class.has-value]="form.fromGradeId" ngbDropdownToggle>
                      {{ form.fromGradeId ? getGradeName(form.fromGradeId) : 'Select grade...' }}
                    </button>
                    @if (grades().length > 0) {
                      <div class="dropdown-menu">
                        @for (grade of grades(); track grade.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectFromGrade(grade.id)">
                            {{ grade.name }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
                <div class="form-group">
                  <label class="form-label">To Grade</label>
                  <div class="dropdown-select" ngbDropdown>
                    <button class="form-control" [class.has-value]="form.toGradeId" ngbDropdownToggle>
                      {{ form.toGradeId ? getGradeName(form.toGradeId) : 'Select grade...' }}
                    </button>
                    @if (grades().length > 0) {
                      <div class="dropdown-menu">
                        @for (grade of grades(); track grade.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectToGrade(grade.id)">
                            {{ grade.name }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Promotion Type <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="form.type" name="type" required>
                    <option value="">Select type</option>
                    <option value="PROMOTION">Promotion</option>
                    <option value="DEMOTION">Demotion</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Effective Date <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="form.effectiveDate" name="effectiveDate" required>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Remarks</label>
                <textarea class="form-control" [(ngModel)]="form.remarks" name="remarks" rows="2" placeholder="Additional notes..."></textarea>
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
          title="Delete Promotion"
          [message]="'Are you sure you want to delete this promotion for ' + confirmDelete()!.employeeName + '?'"
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
      border-radius: var(--radius-lg); width: 90%; max-width: 640px;
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
export class PromotionListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'fromDesignation', label: 'From', width: '120px' },
    { key: 'toDesignation', label: 'To', width: '120px' },
    { key: 'type', label: 'Type', width: '100px', align: 'center' },
    { key: 'effectiveDate', label: 'Effective Date', width: '120px', align: 'center' },
    { key: 'id', label: '', width: '80px', align: 'center' },
  ];

  rows = signal<Promotion[]>([]);
  employees = signal<any[]>([]);
  designations = signal<any[]>([]);
  grades = signal<any[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  showModal = signal(false);
  editing = signal<Promotion | null>(null);
  saving = signal(false);
  confirmDelete = signal<Promotion | null>(null);

  form: PromotionRequest = {
    employeeId: 0,
    fromDesignationId: 0,
    toDesignationId: 0,
    fromGradeId: 0,
    toGradeId: 0,
    type: '',
    effectiveDate: '',
    remarks: '',
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
    this.crud.listAll('designations').subscribe({
      next: (data) => this.designations.set(data || []),
      error: () => this.toast.error('Failed to load designations'),
    });
    this.crud.listAll('grades').subscribe({
      next: (data) => this.grades.set(data || []),
      error: () => this.toast.error('Failed to load grades'),
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<Promotion>('promotions', page, 10).subscribe({
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

  selectFromDesignation(designationId: number): void {
    this.form.fromDesignationId = designationId;
  }

  selectToDesignation(designationId: number): void {
    this.form.toDesignationId = designationId;
  }

  selectFromGrade(gradeId: number): void {
    this.form.fromGradeId = gradeId;
  }

  selectToGrade(gradeId: number): void {
    this.form.toGradeId = gradeId;
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees().find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }

  getDesignationName(designationId: number): string {
    const designation = this.designations().find(d => d.id === designationId);
    return designation ? designation.name : 'Unknown';
  }

  getGradeName(gradeId: number): string {
    const grade = this.grades().find(g => g.id === gradeId);
    return grade ? grade.name : 'Unknown';
  }

  isValid(): boolean {
    return !!(this.form.employeeId && this.form.toDesignationId && this.form.type && this.form.effectiveDate);
  }

  openModal(promotion?: Promotion): void {
    if (promotion) {
      this.editing.set(promotion);
      this.form = {
        employeeId: promotion.employeeId,
        fromDesignationId: promotion.fromDesignationId,
        toDesignationId: promotion.toDesignationId,
        fromGradeId: promotion.fromGradeId,
        toGradeId: promotion.toGradeId,
        type: promotion.type,
        effectiveDate: promotion.effectiveDate,
        remarks: promotion.remarks,
      };
    } else {
      this.editing.set(null);
      this.form = {
        employeeId: 0,
        fromDesignationId: 0,
        toDesignationId: 0,
        fromGradeId: 0,
        toGradeId: 0,
        type: '',
        effectiveDate: '',
        remarks: '',
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
      ? this.crud.update<PromotionRequest>('promotions', this.editing()!.id, this.form)
      : this.crud.create<PromotionRequest>('promotions', this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Promotion updated' : 'Promotion initiated');
        this.closeModal();
        this.loadPage(this.currentPage());
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  doDelete(): void {
    const promotion = this.confirmDelete();
    if (!promotion) return;

    this.crud.delete('promotions', promotion.id).subscribe({
      next: () => {
        this.toast.success('Promotion deleted');
        this.confirmDelete.set(null);
        this.loadPage(this.currentPage());
      },
      error: () => this.toast.error('Failed to delete'),
    });
      },
    });
  }
}