import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { SignatureComponent } from '../ui/signature/signature.component';

interface MenuLink {
  label: string;
  path: string;
  icon: string;
}

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonicModule,
    SignatureComponent,
  ],
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
})
export class SideMenuComponent {
  private menuCtrl = inject(MenuController);

  readonly links: MenuLink[] = [
    { label: 'Home', path: '/home', icon: 'home-outline' },
    { label: 'Favorites', path: '/favorites', icon: 'star-outline' },
    { label: 'Recents', path: '/logs', icon: 'time-outline' },
    { label: 'Settings', path: '/settings', icon: 'settings-outline' },
  ];
  readonly portfolioUrl = 'https://diegodanielcaceres10.github.io/nura/';
  readonly repoUrl = 'https://github.com/diegodanielcaceres10/ionic-plugin-lab';

  closeMenu(): void {
    this.menuCtrl.close('main-menu');
  }
}
