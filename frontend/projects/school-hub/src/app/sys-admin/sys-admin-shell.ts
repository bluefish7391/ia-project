import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { SessionService } from '../auth/session.service';

@Component({
  selector: 'app-sys-admin-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './sys-admin-shell.html',
  styleUrl: './sys-admin-shell.scss',
})
export class SysAdminShellComponent {
  
}
