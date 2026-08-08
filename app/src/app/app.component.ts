import { Component, inject, OnInit } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBarService } from './features/status-bar/data/status-bar.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private statusBarService = inject(StatusBarService);

  async ngOnInit(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await this.statusBarService.setDefault();
    }
  }
}
