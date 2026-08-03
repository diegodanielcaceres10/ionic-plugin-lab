import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'home',
    loadComponent: () =>
      import('./features/home/pages/home.page/home.page').then(
        (m) => m.HomePage,
      ),
  },
  {
    path: 'camera',
    loadComponent: () =>
      import('./features/camera/pages/camera.page/camera.page').then(
        (m) => m.CameraPage,
      ),
  },
  {
    path: 'geolocation',
    loadComponent: () =>
      import('./features/geolocation/pages/geoloaction.page/geolocation.page').then(
        (m) => m.GeolocationPage,
      ),
  },
  {
    path: '**',
    redirectTo: 'home',
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
