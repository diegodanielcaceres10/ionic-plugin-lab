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
      import('./features/geolocation/pages/geolocation.page/geolocation.page').then(
        (m) => m.GeolocationPage,
      ),
  },
  {
    path: 'device',
    loadComponent: () =>
      import('./features/device/pages/device.page/device.page').then(
        (m) => m.DevicePage,
      ),
  },
  {
    path: 'browser',
    loadComponent: () =>
      import('./features/browser/pages/browser.page/browser.page').then(
        (m) => m.BrowserPage,
      ),
  },
  {
    path: 'filesystem',
    loadComponent: () =>
      import('./features/filesystem/pages/filesystem.page/filesystem.page').then(
        (m) => m.FilesystemPage,
      ),
  },
  {
    path: 'network',
    loadComponent: () =>
      import('./features/network/pages/network.page/network.page').then(
        (m) => m.NetworkPage,
      ),
  },
  {
    path: 'haptics',
    loadComponent: () =>
      import('./features/haptics/pages/haptics.page/haptics.page').then(
        (m) => m.HapticsPage,
      ),
  },
  {
    path: 'clipboard',
    loadComponent: () =>
      import('./features/clipboard/pages/clipboard.page/clipboard.page').then(
        (m) => m.ClipboardPage,
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
