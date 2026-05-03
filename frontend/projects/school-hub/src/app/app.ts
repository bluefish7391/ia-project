import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Sidebar } from './sidebar/sidebar';
import { UtilBar } from './util-bar/util-bar';
import { SidenavService } from './sidenav.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, Sidebar, UtilBar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly sidenavService = inject(SidenavService);
}
