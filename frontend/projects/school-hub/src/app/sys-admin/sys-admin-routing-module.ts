import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./sys-admin-shell').then((m) => m.SysAdminShellComponent),
    children: [
      {
        path: 'delete-user',
        loadComponent: () => import('./delete-user/delete-user').then((m) => m.DeleteUser),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SysAdminRoutingModule {}
