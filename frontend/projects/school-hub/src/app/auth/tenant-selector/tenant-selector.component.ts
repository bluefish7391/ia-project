import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../api.service';
import { SessionService } from '../session.service';
import { Tenant, AppUserSession } from 'shared/kinds';

@Component({
  selector: 'app-tenant-selector',
  imports: [],
  templateUrl: './tenant-selector.component.html',
  styleUrl: './tenant-selector.component.scss',
})
export class TenantSelectorComponent implements OnInit {
  private readonly auth = inject(Auth);
  private readonly api = inject(ApiService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly tenants = signal<Tenant[]>([]);
  protected readonly loading = signal(true);
  protected readonly selecting = signal(false);
  protected readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    try {
      const token = await this.getToken();
      const result = await firstValueFrom(
        this.api.post<Tenant[]>('security/tenants', { googleToken: token }),
      );
      this.tenants.set(result);
    } catch {
      this.error.set('Failed to load your tenants. Please sign out and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  protected async selectTenant(tenantID: string): Promise<void> {
    if (this.selecting()) return;
    this.error.set(null);
    this.selecting.set(true);
    try {
      const token = await this.getToken();
      const session = await firstValueFrom(
        this.api.post<AppUserSession>('security/app-session', { tenantID, googleToken: token }),
      );
      this.sessionService.setSession(session);
      await this.router.navigate(['/admin']);
    } catch {
      this.error.set('Failed to start session. Please try again.');
    } finally {
      this.selecting.set(false);
    }
  }

  private async getToken(): Promise<string> {
    const user = this.auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
  }
}
