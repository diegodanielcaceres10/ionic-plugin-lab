import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  globeOutline,
  helpCircleOutline,
  informationCircleOutline,
  linkOutline,
  createOutline,
  openOutline,
  closeOutline,
  timeOutline,
  logoGoogle,
  logoGithub,
  flashOutline,
  hardwareChipOutline,
} from 'ionicons/icons';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  BrowserService,
  QuickLink,
  QUICK_LINKS,
  DEFAULT_URL,
} from '../../data/browser.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

@Component({
  selector: 'app-browser',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './browser.page.html',
  styleUrls: ['./browser.page.scss'],
})
export class BrowserPage implements OnInit, OnDestroy {
  pluginName = 'Browser';
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  isOpen = signal(false);
  activeUrl = signal<string | null>(null);
  customUrl = signal(DEFAULT_URL);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  readonly quickLinks: QuickLink[] = QUICK_LINKS;

  private finishedHandle: PluginListenerHandle | null = null;
  private loadedHandle: PluginListenerHandle | null = null;

  constructor(
    private browserService: BrowserService,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'globe-outline': globeOutline,
      'help-circle-outline': helpCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'link-outline': linkOutline,
      'create-outline': createOutline,
      'open-outline': openOutline,
      'close-outline': closeOutline,
      'time-outline': timeOutline,
      'logo-google': logoGoogle,
      'logo-github': logoGithub,
      'flash-outline': flashOutline,
      'hardware-chip-outline': hardwareChipOutline,
    });
  }

  /** Registers the plugin listeners once — no permission involved, safe to do silently. */
  async ngOnInit(): Promise<void> {
    this.isBrowserEnv.set(this.browserService.isBrowser());

    this.finishedHandle = await this.browserService.onFinished(() => {
      this.isOpen.set(false);
      void this.refreshActivityLog();
    });

    this.loadedHandle = await this.browserService.onPageLoaded(() => {
      void this.refreshActivityLog();
    });

    this.refreshActivityLog();
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
  }

  private async refreshActivityLog(): Promise<void> {
    const logs = await this.pluginLogsService.list(this.pluginName);
    this.activityLog.set(logs);
  }

  async toggleFavorite(): Promise<void> {
    const plugin = this.pluginInfo();
    if (!plugin) return;

    const next = !plugin.isFavorited;
    await this.pluginsCatalogService.setFavorited(plugin.id, next);
    this.pluginInfo.set({ ...plugin, isFavorited: next });
  }

  async open(url: string): Promise<void> {
    await this.run(async () => {
      await this.browserService.open(url);
      this.isOpen.set(true);
      this.activeUrl.set(url);
    });
  }

  async openCustom(): Promise<void> {
    await this.open(this.normalizeUrl(this.customUrl()));
  }

  async close(): Promise<void> {
    await this.run(async () => {
      await this.browserService.close();
      this.isOpen.set(false);
    });
  }

  onCustomUrlChange(event: Event): void {
    this.customUrl.set((event.target as HTMLInputElement).value);
  }

  /** Adds https:// when the user typed a bare domain, e.g. "github.com". */
  private normalizeUrl(url: string): string {
    const trimmed = url.trim();
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  }

  /** Shared wrapper: toggles the busy state and refreshes the log — the service already logs each outcome. */
  private async run(action: () => Promise<void>): Promise<void> {
    this.isBusy.set(true);
    try {
      await action();
    } catch {
      // already logged by BrowserService
    } finally {
      this.isBusy.set(false);
      await this.refreshActivityLog();
    }
  }

  ngOnDestroy(): void {
    void this.finishedHandle?.remove();
    void this.loadedHandle?.remove();
  }
}
