import { Component, inject, OnInit } from '@angular/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { PlatformService } from './core/platform/platform.service';
import { StatusBarService } from './features/status-bar/data/status-bar.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private platformService = inject(PlatformService);
  private statusBarService = inject(StatusBarService);

  async ngOnInit(): Promise<void> {
    if (!this.platformService.isNativePlatform()) {
      return;
    }
    SplashScreen.show();
    await this.initializeApp();
  }

  private async initializeApp(): Promise<void> {
    await this.statusBarService.setDefault();
  }
}
