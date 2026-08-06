import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
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
  IosNotSupportedError,
  Style,
  Animation,
} from '../../data/status-bar.service';

interface StyleOption {
  label: string;
  value: Style;
  icon: string;
}

type LogVariant = 'success' | 'danger' | 'info';

interface LogEntry {
  message: string;
  variant: LogVariant;
  timestamp: number;
}

const STYLE_OPTIONS: StyleOption[] = [
  { label: 'Default', value: Style.Default, icon: 'contrast-outline' },
  { label: 'Light', value: Style.Light, icon: 'sunny-outline' },
  { label: 'Dark', value: Style.Dark, icon: 'moon-outline' },
];

/** How many entries to keep in the "Activity Log" list. */
const LOG_LIMIT = 5;

@Component({
  selector: 'app-status-bar',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonIcon,
  ],
  templateUrl: './status-bar.page.html',
  styleUrls: ['./status-bar.page.scss'],
})
export class StatusBarPage implements OnInit {
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  info = signal<StatusBarInfo | null>(null);
  log = signal<LogEntry[]>([]);

  readonly styleOptions = STYLE_OPTIONS;
  readonly colorSwatches: ColorSwatch[] = COLOR_SWATCHES;

  constructor(
    private statusBarService: StatusBarService,
    private alertController: AlertController,
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
      this.pushLog(`Style set to ${option.label}`, 'success');
    });
  }

  async setColor(swatch: ColorSwatch): Promise<void> {
    await this.run(
      async () => {
        await this.statusBarService.setBackgroundColor(swatch.value);
        await this.refreshInfo();
        this.pushLog(`Background set to ${swatch.label}`, 'success');
      },
      (error) => {
        if (error instanceof IosNotSupportedError) {
          this.pushLog('Background color has no effect on iOS', 'info');
          return true;
        }
        return false;
      },
    );
  }

  async toggleVisibility(): Promise<void> {
    const visible = this.info()?.visible ?? true;
    await this.run(async () => {
      if (visible) {
        await this.statusBarService.hide(Animation.Fade);
        this.pushLog('Status bar hidden', 'info');
      } else {
        await this.statusBarService.show(Animation.Fade);
        this.pushLog('Status bar shown', 'success');
      }
      await this.refreshInfo();
    });
  }

  async toggleOverlay(): Promise<void> {
    const overlays = this.info()?.overlays ?? false;
    await this.run(async () => {
      await this.statusBarService.setOverlaysWebView(!overlays);
      await this.refreshInfo();
      this.pushLog(`Overlay ${!overlays ? 'enabled' : 'disabled'}`, 'success');
    });
  }

  isActiveStyle(option: StyleOption): boolean {
    return this.info()?.style === option.value;
  }

  isActiveColor(swatch: ColorSwatch): boolean {
    return this.info()?.color?.toLowerCase() === swatch.value.toLowerCase();
  }

  /**
   * Shared wrapper: toggles the busy state and turns unexpected failures into
   * a log entry. `onError` lets a caller handle a specific error itself
   * (returning true) before falling back to the generic message.
   */
  private async run(
    action: () => Promise<void>,
    onError?: (error: unknown) => boolean,
  ): Promise<void> {
    this.isBusy.set(true);
    try {
      await action();
    } catch (error) {
      if (error instanceof BrowserNotSupportedError) {
        await this.showBrowserNotSupportedAlert();
      } else if (!onError?.(error)) {
        this.pushLog('Something went wrong', 'danger');
      }
    } finally {
      this.isBusy.set(false);
    }
  }

  private pushLog(message: string, variant: LogVariant): void {
    const entry: LogEntry = { message, variant, timestamp: Date.now() };
    this.log.update((entries) => [entry, ...entries].slice(0, LOG_LIMIT));
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
