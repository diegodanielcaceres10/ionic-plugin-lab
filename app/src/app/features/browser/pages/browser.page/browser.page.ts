import { Component, OnDestroy, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonInput, IonButton, IonIcon } from '@ionic/angular/standalone';
import { BrowserService } from '../../data/browser.service';

interface QuickLink {
  label: string;
  url: string;
  icon: string;
}

/**
 * Browser plugin demo page.
 * Opens arbitrary URLs (or quick links) via @capacitor/browser and logs
 * open/page-loaded/close events as they come in.
 */
@Component({
  selector: 'app-browser',
  standalone: true,
  imports: [
    FormsModule,
    ShellComponent,
    HeaderComponent,
    IonInput,
    IonButton,
    IonIcon,
  ],
  templateUrl: './browser.page.html',
  styleUrls: ['./browser.page.scss'],
})
export class BrowserPage implements OnDestroy {
  private browserService = inject(BrowserService);

  private static readonly MAX_VISIBLE_EVENTS = 3;

  url = signal('https://diegodanielcaceres10.github.io/nura/');
  showAllEvents = signal(false);

  quickLinks: QuickLink[] = [
    { label: 'Google', url: 'https://google.com', icon: 'logo-google' },
    { label: 'GitHub', url: 'https://github.com', icon: 'logo-github' },
    { label: 'Ionic', url: 'https://ionicframework.com', icon: 'logo-ionic' },
  ];

  clearUrl(): void {
    this.url.set('');
  }

  async openQuickLink(link: QuickLink): Promise<void> {
    await this.openBrowser(link.url, link.label);
  }

  async openCurrentUrl(): Promise<void> {
    const value = this.url().trim();
    if (!value) return;
    await this.openBrowser(value);
  }

  private async openBrowser(url: string, label?: string): Promise<void> {
    try {
      await this.browserService.open({ url });
    } catch {}
  }

  timeLabel(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  ngOnDestroy(): void {
    this.browserService.teardown();
  }
}
