import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface Session { id: number; name: string; startDate: string; endDate: string; active: boolean; current: boolean; }

@Component({
  selector: 'app-academic-session-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, ConfirmDialogComponent],
  template: `
    <app-page-header title="Academic Sessions" subtitle="Manage academic year sessions">
      <button class="btn btn-gold" (click)="openModal()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Add Session
      </button>
    </app-page-header>
    <app-data-table [columns]="columns" [rows]="rows()" [page]="currentPage()" [totalPages]="totalPages()" [totalElements]="totalElements()" [loading]="loading()" emptyTitle="No sessions" emptySubtitle="Create your first academic session." (pageChange)="loadPage($event)" (rowClick)="openModal($event)" />

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="modal-header"><h2>{{ editing() ? 'Edit' : 'Create' }} Session</h2><button class="btn-close" (click)="closeModal()"><svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg></button></div>
          <form class="modal-body" (ngSubmit)="save()">
            <div class="form-group"><label class="form-label">Session Name <span class="req">*</span></label><input type="text" class="form-control" [(ngModel)]="form.name" name="name" required placeholder="e.g. 2026-2027"></div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">Start Date</label><input type="date" class="form-control" [(ngModel)]="form.startDate" name="startDate"></div>
              <div class="form-group"><label class="form-label">End Date</label><input type="date" class="form-control" [(ngModel)]="form.endDate" name="endDate"></div>
            </div>
            <div class="modal-footer">
              @if (editing()) {
                <button type="button" class="btn btn-danger" (click)="confirmDelete.set(editing()); closeModal()">Delete</button>
              }
              <div class="footer-spacer"></div>
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" [disabled]="!form.name || saving()">{{ saving() ? 'Saving...' : (editing() ? 'Update' : 'Create') }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (confirmDelete()) {
      <app-confirm-dialog
        title="Delete Session"
        [message]="'Are you sure you want to delete ' + confirmDelete()!.name + '?'"
        confirmLabel="Delete"
        type="danger"
        (confirm)="doDelete()"
        (cancel)="confirmDelete.set(null)"
      />
    }
  `,
  styles: [`
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10001; }
    .modal-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 90%; max-width: 480px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.3s var(--ease-spring); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); h2 { font-family: var(--font-display); font-size: var(--fs-h3); } }
    .btn-close { background: none; border: none; color: var(--color-text-muted); padding: 4px; cursor: pointer; &:hover { color: var(--color-text-primary); } }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.375rem; }
    .req { color: var(--color-danger); }
    .modal-footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 1rem; }
    .footer-spacer { flex: 1; }
    .btn-danger { background: var(--color-danger); color: white; border-radius: var(--radius-sm); padding: 0.5rem 1.25rem; font-size: var(--fs-small); font-weight: var(--fw-semibold); border: none; cursor: pointer; &:hover { background: #dc2626; } }
  `],
})
export class AcademicSessionListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Session', sortable: true },
    { key: 'startDate', label: 'Start Date', width: '130px' },
    { key: 'endDate', label: 'End Date', width: '130px' },
    { key: 'current', label: 'Active', width: '80px', align: 'center' },
  ];
  rows = signal<Session[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  showModal = signal(false);
  editing = signal<Session | null>(null);
  saving = signal(false);
  confirmDelete = signal<Session | null>(null);
  form = { name: '', startDate: '', endDate: '' };

  constructor(private crud: CrudService, private toast: ToastService) {}
  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<Session>('academic-sessions', page, 10).subscribe({
      next: (d) => { this.rows.set(d.content); this.currentPage.set(d.number); this.totalPages.set(d.totalPages); this.totalElements.set(d.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openModal(item?: Session): void {
    if (item) { this.editing.set(item); this.form = { name: item.name, startDate: item.startDate, endDate: item.endDate }; }
    else { this.editing.set(null); this.form = { name: '', startDate: '', endDate: '' }; }
    this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); this.editing.set(null); }

  save(): void {
    if (!this.form.name) return;
    this.saving.set(true);
    const obs = this.editing() ? this.crud.update('academic-sessions', this.editing()!.id, this.form) : this.crud.create('academic-sessions', this.form);
    obs.subscribe({
      next: () => { this.toast.success(this.editing() ? 'Updated' : 'Created'); this.closeModal(); this.loadPage(this.currentPage()); this.saving.set(false); },
      error: () => this.saving.set(false),
    });
  }

  doDelete(): void {
    const item = this.confirmDelete();
    if (!item) return;
    this.crud.delete('academic-sessions', item.id).subscribe({
      next: () => { this.toast.success('Deleted'); this.confirmDelete.set(null); this.loadPage(this.currentPage()); },
      error: () => this.toast.error('Failed to delete'),
    });
    });
  }
}
