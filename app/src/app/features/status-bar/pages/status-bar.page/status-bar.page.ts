import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
import { IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  contrastOutline,
  sunnyOutline,
  moonOutline,
  colorPaletteOutline,
  eyeOutline,
  eyeOffOutline,
  layersOutline,
  timeOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import {
  StatusBarService,
  StatusBarInfo,
  ColorSwatch,
  COLOR_SWATCHES,
  BrowserNotSupportedError,
  Style,
  Animation,
} from '../../data/status-bar.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

interface StyleOption {
  label: string;
  value: Style;
  icon: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  { label: 'Default', value: Style.Default, icon: 'contrast-outline' },
  { label: 'Light', value: Style.Light, icon: 'sunny-outline' },
  { label: 'Dark', value: Style.Dark, icon: 'moon-outline' },
];

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './status-bar.page.html',
  styleUrls: ['./status-bar.page.scss'],
})
export class StatusBarPage implements OnInit {
  pluginName = 'StatusBar';
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  info = signal<StatusBarInfo | null>(null);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  readonly styleOptions = STYLE_OPTIONS;
  readonly colorSwatches: ColorSwatch[] = COLOR_SWATCHES;

  constructor(
    private statusBarService: StatusBarService,
    private alertController: AlertController,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'information-circle-outline': informationCircleOutline,
      'contrast-outline': contrastOutline,
      'sunny-outline': sunnyOutline,
      'moon-outline': moonOutline,
      'color-palette-outline': colorPaletteOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'layers-outline': layersOutline,
      'time-outline': timeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }

  /** Reads the current native state once on load — no permission involved, safe to do silently. */
  async ngOnInit(): Promise<void> {
    this.isBrowserEnv.set(this.statusBarService.isBrowser());
    await this.refreshInfo();

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

  async refreshInfo(): Promise<void> {
    try {
      this.info.set(await this.statusBarService.getInfo());
    } catch {
      // Browser preview: keep the UI usable with a mock state.
      this.info.set(this.statusBarService.getMockInfo());
    }
  }

  async setStyle(option: StyleOption): Promise<void> {
    await this.run(async () => {
      await this.statusBarService.setStyle(option.value);
      await this.refreshInfo();
    });
  }

  async setColor(swatch: ColorSwatch): Promise<void> {
    await this.run(async () => {
      await this.statusBarService.setBackgroundColor(swatch.value);
      await this.refreshInfo();
    });
  }

  async toggleVisibility(): Promise<void> {
    const visible = this.info()?.visible ?? true;
    await this.run(async () => {
      if (visible) {
        await this.statusBarService.hide(Animation.Fade);
      } else {
        await this.statusBarService.show(Animation.Fade);
      }
      await this.refreshInfo();
    });
  }

  async toggleOverlay(): Promise<void> {
    const overlays = this.info()?.overlays ?? false;
    await this.run(async () => {
      await this.statusBarService.setOverlaysWebView(!overlays);
      await this.refreshInfo();
    });
  }

  isActiveStyle(option: StyleOption): boolean {
    return this.info()?.style === option.value;
  }

  isActiveColor(swatch: ColorSwatch): boolean {
    return this.info()?.color?.toLowerCase() === swatch.value.toLowerCase();
  }

  /**
   * Shared wrapper: toggles the busy state, refreshes the log, and shows the
   * one alert the service can't own itself (browser-not-supported). Every
   * other outcome (including the iOS "no effect" case) is already logged by
   * StatusBarService.
   */
  private async run(action: () => Promise<void>): Promise<void> {
    this.isBusy.set(true);
    try {
      await action();
    } catch (error) {
      if (error instanceof BrowserNotSupportedError) {
        await this.showBrowserNotSupportedAlert();
      }
    } finally {
      this.isBusy.set(false);
      await this.refreshActivityLog();
    }
  }

  private async showBrowserNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Not available in the browser',
      message:
        'The StatusBar plugin cannot be tested in the browser. Install the app on a mobile device to control the real status bar.',
      buttons: ['Got it'],
    });
    await alert.present();
  }
}
