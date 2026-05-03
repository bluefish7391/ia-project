import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';
import { SidenavService } from '../sidenav.service';

@Component({
  selector: 'app-util-bar',
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './util-bar.html',
  styleUrl: './util-bar.scss',
})
export class UtilBar {
  protected readonly sidenavService = inject(SidenavService);
  private readonly authService = inject(AuthService);
  private readonly sessionService = inject(SessionService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map(e => (e as NavigationEnd).urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly sectionTitle = computed(() => {
    const url = this.url();
    if (url.startsWith('/sys-admin')) return 'System Admin';
    if (url.startsWith('/admin')) return 'Admin';
    if (url.startsWith('/lunch-check')) return 'Lunch Check';
    return '';
  });

  protected async logout(): Promise<void> {
    this.sessionService.clearSession();
    await this.authService.signOut();
    await this.router.navigate(['/login']);
  }
}
