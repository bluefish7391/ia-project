import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, MatButtonModule, MatIconModule, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  // TODO: TEMPORARY — replace with a toggle call from the navbar component
  protected readonly sidenavOpen = signal(false);

  // TODO: TEMPORARY — move this method to the navbar component
  protected toggleSidenav(): void {
    this.sidenavOpen.update(open => !open);
  }
}
