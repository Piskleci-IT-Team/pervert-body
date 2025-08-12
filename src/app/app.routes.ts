import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent
        ),
    },
    {   path: 'admin',
        loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent
        ),
    },
];
