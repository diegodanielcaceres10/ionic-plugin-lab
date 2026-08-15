import { inject, Injectable } from '@angular/core';
import {
  BiometricAuth,
  BiometryType,
  BiometryError,
  BiometryErrorType,
  AndroidBiometryStrength,
} from '@aparajita/capacitor-biometric-auth';
import type {
  CheckBiometryResult,
  AuthenticateOptions,
} from '@aparajita/capacitor-biometric-auth';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export {
  BiometryType,
  BiometryError,
  BiometryErrorType,
  AndroidBiometryStrength,
};
export type { CheckBiometryResult, AuthenticateOptions };

export interface BiometryOption {
  label: string;
  value: BiometryType;
  icon: string;
}

export const BIOMETRY_OPTIONS: BiometryOption[] = [
  { label: 'None', value: BiometryType.none, icon: 'close-circle-outline' },
  {
    label: 'Touch ID',
    value: BiometryType.touchId,
    icon: 'finger-print-outline',
  },
  { label: 'Face ID', value: BiometryType.faceId, icon: 'happy-outline' },
  {
    label: 'Fingerprint',
    value: BiometryType.fingerprintAuthentication,
    icon: 'finger-print-outline',
  },
  {
    label: 'Face Auth',
    value: BiometryType.faceAuthentication,
    icon: 'happy-outline',
  },
  {
    label: 'Iris',
    value: BiometryType.irisAuthentication,
    icon: 'eye-outline',
  },
];

@Injectable({ providedIn: 'root' })
export class BiometricsService {
  private platformService = inject(PlatformService);
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /** True when running in a plain browser tab — biometry is simulated here, not real. */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  async checkBiometry(): Promise<CheckBiometryResult> {
    try {
      const result = await BiometricAuth.checkBiometry();
      await this.saveLog(
        'Check',
        `Biometry ${result.isAvailable ? 'available' : 'unavailable'} (${result.biometryType})`,
        'success',
      );
      return result;
    } catch (error) {
      await this.saveLog('Check', this.errorMessage(error), 'danger');
      throw error;
    }
  }

  async authenticate(options: AuthenticateOptions): Promise<void> {
    try {
      await BiometricAuth.authenticate(options);
      await this.saveLog('Authenticate', 'Authentication succeeded', 'success');
    } catch (error) {
      await this.saveLog('Authenticate', this.errorMessage(error), 'danger');
      throw error;
    }
  }

  /** Web only — dynamically fakes the biometry type available for testing. */
  async setBiometryType(type: BiometryType): Promise<void> {
    await BiometricAuth.setBiometryType(type);
    await this.saveLog('Setup', `Simulated biometry type: ${type}`, 'warning');
  }

  /** Web only — simulates whether the user has enrolled in biometry. */
  async setBiometryIsEnrolled(isEnrolled: boolean): Promise<void> {
    await BiometricAuth.setBiometryIsEnrolled(isEnrolled);
    await this.saveLog(
      'Setup',
      `Simulated enrollment: ${isEnrolled}`,
      'warning',
    );
  }

  /** Web only — simulates whether the device has a PIN/pattern/passcode set. */
  async setDeviceIsSecure(isSecure: boolean): Promise<void> {
    await BiometricAuth.setDeviceIsSecure(isSecure);
    await this.saveLog(
      'Setup',
      `Simulated device secure: ${isSecure}`,
      'warning',
    );
  }

  /** Writes the activity log entry and, on success, marks Biometrics as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Biometrics',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Biometrics');
    }
  }

  private errorMessage(error: unknown): string {
    return (error instanceof Error && error.message) || 'Unknown';
  }
}
