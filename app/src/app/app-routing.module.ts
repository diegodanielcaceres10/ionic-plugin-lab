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
    path: 'network',
    loadComponent: () =>
      import('./features/network/pages/network.page/network.page').then(
        (m) => m.NetworkPage,
      ),
  },
  {
    path: 'local-notifications',
    loadComponent: () =>
      import('./features/local-notifications/pages/local-notifications.page/local-notifications.page').then(
        (m) => m.LocalNotificationsPage,
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
    path: 'browser',
    loadComponent: () =>
      import('./features/browser/pages/browser.page/browser.page').then(
        (m) => m.BrowserPage,
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
    path: 'share',
    loadComponent: () =>
      import('./features/share/pages/share.page/share.page').then(
        (m) => m.SharePage,
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
    path: 'device',
    loadComponent: () =>
      import('./features/device/pages/device.page/device.page').then(
        (m) => m.DevicePage,
      ),
  },
  {
    path: 'status-bar',
    loadComponent: () =>
      import('./features/status-bar/pages/status-bar.page/status-bar.page').then(
        (m) => m.StatusBarPage,
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
