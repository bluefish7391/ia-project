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
        path: 'report',
        loadComponent: () =>
          import('./report/report').then((m) => m.ReportComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LunchCheckRoutingModule {}
