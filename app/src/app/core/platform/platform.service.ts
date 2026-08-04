import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';

/**
 * Centralizes platform checks used across plugin demo pages/services,
 * so each one doesn't reimplement its own Capacitor.isNativePlatform()
 * (or browser-only edge cases like secure-context requirements).
 */
@Injectable({ providedIn: 'root' })
export class PlatformService {
  /**
   * Returns true when running inside a native app (Android/iOS),
   * false when running in the browser.
   */
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  /** 'android' | 'ios' | 'web' */
  getPlatform(): string {
    return Capacitor.getPlatform();
  }

  /**
   * True when running in the browser without HTTPS/localhost.
   * Some web APIs (Geolocation, Clipboard, etc.) silently fail or throw
   * outside a secure context — always false on native, since native
   * builds are always considered secure.
   */
  isInsecureWebContext(): boolean {
    return !this.isNativePlatform() && !window.isSecureContext;
  }
}
