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
  fingerPrintOutline,
  happyOutline,
  eyeOutline,
  closeCircleOutline,
  shieldCheckmarkOutline,
  lockClosedOutline,
  lockOpenOutline,
  flaskOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import {
  BiometricsService,
  BiometryType,
  BiometryError,
  BiometryErrorType,
  CheckBiometryResult,
  BiometryOption,
  BIOMETRY_OPTIONS,
} from '../../data/biometrics.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

/** Error codes that mean "biometry isn't set up", not a failed attempt — worth an alert. */
const SETUP_ERROR_CODES: BiometryErrorType[] = [
  BiometryErrorType.biometryNotAvailable,
  BiometryErrorType.biometryNotEnrolled,
  BiometryErrorType.passcodeNotSet,
  BiometryErrorType.noDeviceCredential,
  BiometryErrorType.invalidContext,
  BiometryErrorType.notInteractive,
];

@Component({
  selector: 'app-biometrics',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './biometrics.page.html',
  styleUrls: ['./biometrics.page.scss'],
})
export class BiometricsPage implements OnInit {
  pluginName = 'Biometrics';
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  info = signal<CheckBiometryResult | null>(null);
  reason = signal('Please authenticate');
  allowDeviceCredential = signal(false);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  readonly biometryOptions = BIOMETRY_OPTIONS;

  constructor(
    private biometricsService: BiometricsService,
    private alertController: AlertController,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'information-circle-outline': informationCircleOutline,
      'finger-print-outline': fingerPrintOutline,
      'happy-outline': happyOutline,
      'eye-outline': eyeOutline,
      'close-circle-outline': closeCircleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'lock-closed-outline': lockClosedOutline,
      'lock-open-outline': lockOpenOutline,
      'flask-outline': flaskOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.isBrowserEnv.set(this.biometricsService.isBrowser());
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
    await this.refreshInfo();
  }

  async toggleFavorite(): Promise<void> {
    const plugin = this.pluginInfo();
    if (!plugin) return;

    const next = !plugin.isFavorited;
    await this.pluginsCatalogService.setFavorited(plugin.id, next);
    this.pluginInfo.set({ ...plugin, isFavorited: next });
  }

  async refreshInfo(): Promise<void> {
    this.info.set(await this.biometricsService.checkBiometry());
    await this.refreshActivityLog();
  }

  updateReason(value: string): void {
    this.reason.set(value);
  }

  toggleAllowDeviceCredential(): void {
    this.allowDeviceCredential.update((value) => !value);
  }

  async authenticate(): Promise<void> {
    this.isBusy.set(true);
    try {
      await this.biometricsService.authenticate({
        reason: this.reason(),
        allowDeviceCredential: this.allowDeviceCredential(),
      });
    } catch (error) {
      await this.handleAuthError(error);
    } finally {
      this.isBusy.set(false);
      await this.refreshActivityLog();
    }
  }

  /** Web simulator: fakes the biometry type reported by checkBiometry(). */
  async setBiometryType(option: BiometryOption): Promise<void> {
    await this.biometricsService.setBiometryType(option.value);
    await this.refreshInfo();
  }

  /** Web simulator: fakes whether the user has enrolled in biometry. */
  async toggleEnrolled(): Promise<void> {
    const next = !(this.info()?.isAvailable ?? false);
    await this.biometricsService.setBiometryIsEnrolled(next);
    await this.refreshInfo();
  }

  /** Web simulator: fakes whether the device has a PIN/pattern/passcode set. */
  async toggleDeviceSecure(): Promise<void> {
    const next = !(this.info()?.deviceIsSecure ?? false);
    await this.biometricsService.setDeviceIsSecure(next);
    await this.refreshInfo();
  }

  isActiveType(option: BiometryOption): boolean {
    return this.info()?.biometryType === option.value;
  }

  biometryIcon(type: BiometryType | undefined): string {
    return (
      this.biometryOptions.find((option) => option.value === type)?.icon ??
      'finger-print-outline'
    );
  }

  private async handleAuthError(error: unknown): Promise<void> {
    if (!(error instanceof BiometryError)) {
      return;
    }

    if (SETUP_ERROR_CODES.includes(error.code)) {
      await this.showSetupAlert(error.message);
    }
  }

  private async showSetupAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Biometry not set up',
      message,
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async refreshActivityLog(): Promise<void> {
    const logs = await this.pluginLogsService.list(this.pluginName);
    this.activityLog.set(logs);
  }
}
