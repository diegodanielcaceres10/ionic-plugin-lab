import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
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
  /** True when running in a plain browser tab — biometry is simulated here, not real. */
  isBrowser(): boolean {
    return !Capacitor.isNativePlatform();
  }

  async checkBiometry(): Promise<CheckBiometryResult> {
    return BiometricAuth.checkBiometry();
  }

  async authenticate(options: AuthenticateOptions): Promise<void> {
    await BiometricAuth.authenticate(options);
  }

  /** Web only — dynamically fakes the biometry type available for testing. */
  async setBiometryType(type: BiometryType): Promise<void> {
    await BiometricAuth.setBiometryType(type);
  }

  /** Web only — simulates whether the user has enrolled in biometry. */
  async setBiometryIsEnrolled(isEnrolled: boolean): Promise<void> {
    await BiometricAuth.setBiometryIsEnrolled(isEnrolled);
  }

  /** Web only — simulates whether the device has a PIN/pattern/passcode set. */
  async setDeviceIsSecure(isSecure: boolean): Promise<void> {
    await BiometricAuth.setDeviceIsSecure(isSecure);
  }
}
