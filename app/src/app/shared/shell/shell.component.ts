import { Component, inject, input, computed } from '@angular/core';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

type AppTabsTypes =
  | 'home'
  | 'recent'
  | 'favorites'
  | 'settings'
  | 'camera'
  | 'barcode-scanner'
  | 'geolocation'
  | 'device'
  | 'haptics'
  | 'network'
  | 'motion'
  | 'filesystem'
  | 'status-bar'
  | 'browser'
  | 'share'
  | 'local-notifications'
  | 'clipboard'
  | 'nfc'
  | 'bluetooth'
  | 'biometrics';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [IonicModule, RouterLink],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private location = inject(Location);

  readonly activePage = input<AppTabsTypes>('home');

  readonly isShowMenuButton = computed(() => this.activePage() === 'home');

  goBack() {
    this.location.back();
  }
}
