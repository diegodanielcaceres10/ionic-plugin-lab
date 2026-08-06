import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
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
  timeOutline,
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

type LogVariant = 'success' | 'danger' | 'info';

interface LogEntry {
  message: string;
  variant: LogVariant;
  timestamp: number;
}

/** Error codes that mean "biometry isn't set up", not a failed attempt — worth an alert. */
const SETUP_ERROR_CODES: BiometryErrorType[] = [
  BiometryErrorType.biometryNotAvailable,
  BiometryErrorType.biometryNotEnrolled,
  BiometryErrorType.passcodeNotSet,
  BiometryErrorType.noDeviceCredential,
  BiometryErrorType.invalidContext,
  BiometryErrorType.notInteractive,
];

/** How many entries to keep in the "Activity Log" list. */
const LOG_LIMIT = 5;

@Component({
  selector: 'app-biometrics',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonIcon,
  ],
  templateUrl: './biometrics.page.html',
  styleUrls: ['./biometrics.page.scss'],
})
export class BiometricsPage implements OnInit {
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  info = signal<CheckBiometryResult | null>(null);
  reason = signal('Please authenticate');
  allowDeviceCredential = signal(false);
  log = signal<LogEntry[]>([]);

  readonly biometryOptions = BIOMETRY_OPTIONS;

  constructor(
    private biometricsService: BiometricsService,
    private alertController: AlertController,
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
      'time-outline': timeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.isBrowserEnv.set(this.biometricsService.isBrowser());
    await this.refreshInfo();
  }

  async refreshInfo(): Promise<void> {
    this.info.set(await this.biometricsService.checkBiometry());
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
      this.pushLog('Authentication succeeded', 'success');
    } catch (error) {
      await this.handleAuthError(error);
    } finally {
      this.isBusy.set(false);
    }
  }

  /** Web simulator: fakes the biometry type reported by checkBiometry(). */
  async setBiometryType(option: BiometryOption): Promise<void> {
    await this.biometricsService.setBiometryType(option.value);
    await this.refreshInfo();
    this.pushLog(`Simulated type: ${option.label}`, 'info');
  }

  /** Web simulator: fakes whether the user has enrolled in biometry. */
  async toggleEnrolled(): Promise<void> {
    const next = !(this.info()?.isAvailable ?? false);
    await this.biometricsService.setBiometryIsEnrolled(next);
    await this.refreshInfo();
    this.pushLog(`Simulated enrolled: ${next ? 'Yes' : 'No'}`, 'info');
  }

  /** Web simulator: fakes whether the device has a PIN/pattern/passcode set. */
  async toggleDeviceSecure(): Promise<void> {
    const next = !(this.info()?.deviceIsSecure ?? false);
    await this.biometricsService.setDeviceIsSecure(next);
    await this.refreshInfo();
    this.pushLog(`Simulated device secure: ${next ? 'Yes' : 'No'}`, 'info');
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
      this.pushLog('Something went wrong', 'danger');
      return;
    }

    if (
      error.code === BiometryErrorType.userCancel ||
      error.code === BiometryErrorType.systemCancel ||
      error.code === BiometryErrorType.appCancel ||
      error.code === BiometryErrorType.userFallback
    ) {
      this.pushLog('Authentication cancelled', 'info');
      return;
    }

    if (error.code === BiometryErrorType.biometryLockout) {
      this.pushLog('Too many attempts — locked out', 'danger');
      return;
    }

    if (SETUP_ERROR_CODES.includes(error.code)) {
      await this.showSetupAlert(error.message);
      return;
    }

    this.pushLog('Authentication failed', 'danger');
  }

  private async showSetupAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Biometry not set up',
      message,
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private pushLog(message: string, variant: LogVariant): void {
    const entry: LogEntry = { message, variant, timestamp: Date.now() };
    this.log.update((entries) => [entry, ...entries].slice(0, LOG_LIMIT));
  }
}
