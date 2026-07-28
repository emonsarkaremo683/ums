import { Component, signal, OnInit } from '@angular/core';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { CrudService } from '../../../core/services/crud.service';

interface AuditLog {
  id: number; entityType: string; entityId: number; action: string;
  oldValues: string; newValues: string; performedBy: string; performedAt: string;
}

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [PageHeaderComponent, DataTableComponent],
  template: `
    <app-page-header title="Audit Logs" subtitle="System activity audit trail" />
    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [page]="currentPage()"
      [totalPages]="totalPages()"
      [totalElements]="totalElements()"
      [loading]="loading()"
      trackBy="id"
      emptyTitle="No audit logs"
      emptySubtitle="System activity will be logged here."
      (pageChange)="loadPage($event)"
    />
  `,
  styles: [`:host { display: block; max-width: 1200px; }`],
})
export class AuditLogListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'performedAt', label: 'Time', sortable: true, width: '170px' },
    { key: 'entityType', label: 'Entity', sortable: true, width: '120px' },
    { key: 'action', label: 'Action', sortable: true, width: '100px' },
    { key: 'performedBy', label: 'User' },
    { key: 'entityId', label: 'Entity ID', width: '90px', align: 'center' },
  ];
  rows = signal<AuditLog[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  constructor(private crud: CrudService) {}
  ngOnInit(): void { this.loadPage(0); }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<AuditLog>('audit-logs', page, 20).subscribe({
      next: (d) => { this.rows.set(d.content); this.currentPage.set(d.number); this.totalPages.set(d.totalPages); this.totalElements.set(d.totalElements); this.loading.set(false); },
      error: () => { this.toast.error('Failed to load audit logs'); this.loading.set(false); },
    });
  }
}
