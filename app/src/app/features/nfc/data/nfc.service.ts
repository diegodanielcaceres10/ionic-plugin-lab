import { inject, Injectable } from '@angular/core';
import { CapacitorNfc, NfcEvent, NdefRecord } from '@capgo/capacitor-nfc';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export interface NfcReadResult {
  /** Decoded text from the first NDEF "T" (text) record, if any. */
  text: string | null;
  tagType: string | null;
  techTypes: string[];
  isWritable: boolean;
  scannedAt: string;
}

/**
 * Thrown when running in the browser, where native NFC scanning
 * cannot be tested.
 */
export class BrowserNotSupportedError extends Error {
  constructor() {
    super('The NFC plugin cannot be tested in the browser.');
    this.name = 'BrowserNotSupportedError';
  }
}

/** Thrown when the device has no NFC hardware at all. */
export class DeviceNotSupportedError extends Error {
  constructor() {
    super('This device does not have NFC hardware.');
    this.name = 'DeviceNotSupportedError';
  }
}

/** Thrown when the device has NFC hardware but it's currently turned off. */
export class NfcDisabledError extends Error {
  constructor() {
    super('NFC is turned off on this device.');
    this.name = 'NfcDisabledError';
  }
}

const DEMO_TEXT = 'Hello from my Ionic portfolio app!';

@Injectable({ providedIn: 'root' })
export class NfcService {
  private platformService = inject(PlatformService);
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /**
   * Opens a scan session and resolves with the next tag that's brought
   * near the device. The page doesn't need to manage listeners or the
   * scan session lifecycle: it calls scan() and reacts to the result or
   * one of the typed errors.
   */
  async scan(): Promise<NfcReadResult> {
    if (!this.platformService.isNativePlatform()) {
      await this.saveLog('Scan', 'Scan simulated (browser)', 'warning');
      throw new BrowserNotSupportedError();
    }

    try {
      await this.ensureReady();

      const result = await new Promise<NfcReadResult>((resolve, reject) => {
        let listenerHandle: { remove: () => Promise<void> } | undefined;

        const cleanup = async () => {
          await listenerHandle?.remove();
          await CapacitorNfc.stopScanning();
        };

        CapacitorNfc.addListener('nfcEvent', async (event: NfcEvent) => {
          await cleanup();
          resolve(this.toReadResult(event));
        }).then((handle) => (listenerHandle = handle));

        CapacitorNfc.startScanning().catch(async (error) => {
          await cleanup();
          reject(error);
        });
      });

      await this.saveLog(
        'Scan',
        `Tag read (${result.tagType ?? 'unknown type'})`,
        'success',
      );
      return result;
    } catch (error) {
      await this.saveLog('Scan', this.errorMessage(error), 'danger');
      throw error;
    }
  }

  /**
   * Opens a scan session and writes a fixed demo text record to the next
   * tag that's brought near the device.
   */
  async writeText(text: string = DEMO_TEXT): Promise<void> {
    if (!this.platformService.isNativePlatform()) {
      await this.saveLog('Write', 'Write simulated (browser)', 'warning');
      throw new BrowserNotSupportedError();
    }

    try {
      await this.ensureReady();

      await new Promise<void>((resolve, reject) => {
        let listenerHandle: { remove: () => Promise<void> } | undefined;

        const cleanup = async () => {
          await listenerHandle?.remove();
          await CapacitorNfc.stopScanning();
        };

        CapacitorNfc.addListener('nfcEvent', async () => {
          try {
            await CapacitorNfc.write({
              records: [this.toTextRecord(text)],
              allowFormat: true,
            });
            await cleanup();
            resolve();
          } catch (error) {
            await cleanup();
            reject(error);
          }
        }).then((handle) => (listenerHandle = handle));

        CapacitorNfc.startScanning().catch(async (error) => {
          await cleanup();
          reject(error);
        });
      });

      await this.saveLog('Write', 'Tag written', 'success');
    } catch (error) {
      await this.saveLog('Write', this.errorMessage(error), 'danger');
      throw error;
    }
  }

  /** Opens the system NFC settings so the user can turn it on. */
  async openSettings(): Promise<void> {
    if (!this.platformService.isNativePlatform()) {
      return;
    }
    await CapacitorNfc.showSettings();
  }

  /** Fixed sample data used to preview the full flow on browser */
  getMockRead(): NfcReadResult {
    return {
      text: DEMO_TEXT,
      tagType: 'NFC Forum Type 2',
      techTypes: ['android.nfc.tech.Ndef', 'android.nfc.tech.NfcA'],
      isWritable: true,
      scannedAt: 'Just now',
    };
  }

  /** Writes the activity log entry and, on success, marks NFC as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'NFC',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('NFC');
    }
  }

  private errorMessage(error: unknown): string {
    return (error instanceof Error && error.message) || 'Unknown';
  }

  // ---------------------------------------------------------------
  // Native
  // ---------------------------------------------------------------

  /**
   * Confirms the device actually has NFC hardware and that it's turned on
   * before opening a scan session, so the page can show a specific alert
   * instead of a confusing generic timeout.
   */
  private async ensureReady(): Promise<void> {
    const { supported } = await CapacitorNfc.isSupported();
    if (!supported) {
      throw new DeviceNotSupportedError();
    }

    const { status } = await CapacitorNfc.getStatus();
    if (status !== 'NFC_OK') {
      throw new NfcDisabledError();
    }
  }

  private toReadResult(event: NfcEvent): NfcReadResult {
    const tag = event.tag;
    return {
      text: this.decodeFirstTextRecord(tag?.ndefMessage ?? undefined),
      tagType: tag?.type ?? null,
      techTypes: tag?.techTypes ?? [],
      isWritable: !!tag?.isWritable,
      scannedAt: 'Just now',
    };
  }

  /**
   * Decodes the first NDEF "T" (text) record on the tag, following the
   * NFC Forum text record spec: a status byte (language code length in
   * its low bits), the language code, then the UTF-8 text.
   */
  private decodeFirstTextRecord(records?: NdefRecord[] | null): string | null {
    const record = records?.find(
      (r) => r.type.length === 1 && r.type[0] === 0x54,
    );
    if (!record) {
      return null;
    }

    const [statusByte, ...rest] = record.payload;
    const languageLength = statusByte & 0x3f;
    const textBytes = rest.slice(languageLength);
    return new TextDecoder().decode(Uint8Array.from(textBytes));
  }

  private toTextRecord(text: string): NdefRecord {
    const encoder = new TextEncoder();
    const languageBytes = Array.from(encoder.encode('en'));
    const textBytes = Array.from(encoder.encode(text));
    return {
      tnf: 0x01,
      type: [0x54], // 'T'
      id: [],
      payload: [languageBytes.length & 0x3f, ...languageBytes, ...textBytes],
    };
  }
}
