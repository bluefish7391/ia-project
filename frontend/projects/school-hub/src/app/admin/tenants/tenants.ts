import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../api.service';

interface Tenant {
  id: string;
  name: string;
  description?: string;
}

@Component({
  selector: 'app-tenants',
  imports: [],
  templateUrl: './tenants.html',
  styleUrl: './tenants.scss',
})
export class Tenants implements OnInit {
  private readonly apiService = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly tenants = signal<Tenant[]>([]);
  protected readonly isLoading = signal(true);
  protected readonly errorMessage = signal<string | null>(null);
  protected readonly actionMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadTenants();
  }

  protected loadTenants(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.apiService
      .get<Tenant[]>('tenants')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tenants) => {
          this.tenants.set(tenants);
          this.isLoading.set(false);
        },
        error: () => {
          this.errorMessage.set('Unable to load tenants. Please try again.');
          this.isLoading.set(false);
        },
      });
  }

  protected addTenant(): void {
    this.actionMessage.set('Add tenant flow will be added next.');
  }

  protected updateTenant(tenant: Tenant): void {
    this.actionMessage.set(`Update flow for ${tenant.name} will be added next.`);
  }

  protected deleteTenant(tenant: Tenant): void {
    this.actionMessage.set(`Delete flow for ${tenant.name} will be added next.`);
  }
}
