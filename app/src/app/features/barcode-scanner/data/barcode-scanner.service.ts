import { inject, Injectable } from '@angular/core';
import { BarcodeScanner, Barcode } from '@capacitor-mlkit/barcode-scanning';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export interface ScanResult {
  /** The decoded text of the barcode (URL, product code, plain text, etc.) */
  value: string;
  /** e.g. QR_CODE, EAN_13, CODE_128 */
  format: string;
  /** True when the value looks like an http(s) URL */
  isUrl: boolean;
  scannedAt: string;
  mock: boolean;
}

/**
 * Thrown on Android the first time the plugin runs on a device, before
 * the Google Barcode Scanner module has finished downloading.
 */
export class ModuleNotAvailableError extends Error {
  constructor() {
    super('The Google Barcode Scanner module is still downloading.');
    this.name = 'ModuleNotAvailableError';
  }
}

@Injectable({ providedIn: 'root' })
export class BarcodeScannerService {
  private platformService = inject(PlatformService);
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /**
   * Single entry point to scan a barcode. The page doesn't need to know
   * about permissions, the ML Kit module, or the platform: it calls
   * scan() and reacts to the result or one of the typed errors.
   */
  /**
   * Single entry point to scan a barcode. The page doesn't need to know
   * about permissions, the ML Kit module, or the platform: it calls
   * scan() and reacts to the result or one of the typed errors.
   */
  async scan(): Promise<ScanResult> {
    try {
      if (!this.platformService.isNativePlatform()) {
        await this.saveLog('Scan', 'Scan simulated', 'warning');
        return {
          value: 'https://diegodanielcaceres10.github.io/nura/',
          format: 'QR_CODE',
          isUrl: true,
          scannedAt: 'Just now',
          mock: true,
        };
      }

      await this.ensureModuleAvailable();
      await this.ensurePermissions();

      const { barcodes } = await BarcodeScanner.scan();

      if (!barcodes.length) {
        throw new Error('NO_BARCODE_DETECTED');
      }

      const result = this.toScanResult(barcodes[0]);
      await this.saveLog(result.format, 'Barcode scanned', 'success');
      return result;
    } catch (error) {
      if (error instanceof ModuleNotAvailableError) {
        await this.saveLog(
          'Scan',
          'Barcode Scanner module downloading',
          'warning',
        );
        throw error;
      }

      await this.saveLog(
        'Scan',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Writes the activity log entry and, on success or mock, marks Barcode Scanner as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Barcode Scanner',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Barcode Scanner');
    }
  }

  // ---------------------------------------------------------------
  // Native
  // ---------------------------------------------------------------

  private toScanResult(barcode: Barcode): ScanResult {
    const value = barcode.displayValue ?? barcode.rawValue;
    return {
      value,
      format: barcode.format,
      isUrl: /^https?:\/\//i.test(value),
      scannedAt: 'Just now',
      mock: false,
    };
  }

  /** Requests camera permission before opening the scanner. */
  private async ensurePermissions(): Promise<void> {
    const status = await BarcodeScanner.checkPermissions();

    if (status.camera === 'granted' || status.camera === 'limited') {
      return;
    }

    const requested = await BarcodeScanner.requestPermissions();
    const granted =
      requested.camera === 'granted' || requested.camera === 'limited';

    if (!granted) {
      throw new Error('PERMISSION_DENIED');
    }
  }

  /**
   * On Android, ML Kit's barcode model is downloaded on demand the first
   * time the plugin is used, not bundled with the app. We check for it
   * explicitly so the page can show a dedicated "still downloading" alert
   * instead of a confusing generic error on that first run.
   */
  private async ensureModuleAvailable(): Promise<void> {
    const { available } =
      await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();

    if (available) {
      return;
    }

    try {
      await BarcodeScanner.installGoogleBarcodeScannerModule();
    } catch {
      // installGoogleBarcodeScannerModule() only kicks off the download;
      // it won't be ready yet on this same call.
    }

    throw new ModuleNotAvailableError();
  }
}
