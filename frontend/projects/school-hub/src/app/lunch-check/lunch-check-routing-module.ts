import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lunch-check').then((m) => m.LunchCheckComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/lunch-check-home').then((m) => m.LunchCheckHomeComponent),
      },
      {
        path: 'view-records',
        loadComponent: () =>
          import('./view-records/view-records').then((m) => m.ViewRecordsComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LunchCheckRoutingModule {}
