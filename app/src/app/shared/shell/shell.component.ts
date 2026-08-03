import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonicModule } from '@ionic/angular';

type AppTabsTypes = 'home' | 'camera' | 'recent' | 'favorites';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [IonicModule, RouterLink],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  private router = inject(Router);

  readonly activeTab = input<AppTabsTypes>('home');

  readonly isBackButton = computed(() => this.activeTab() !== 'home');

  goHome() {
    this.router.navigateByUrl('/home');
  }
}
