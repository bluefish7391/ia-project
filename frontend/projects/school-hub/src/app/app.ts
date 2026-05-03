import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Sidebar } from './sidebar/sidebar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatSidenavModule, Sidebar],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
