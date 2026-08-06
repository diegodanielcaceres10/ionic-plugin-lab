import { inject, Injectable } from '@angular/core';
import {
  BleClient,
  BleService,
  dataViewToHexString,
} from '@capacitor-community/bluetooth-le';
import { PlatformService } from '../../../core/platform/platform.service';

export interface BleScanDevice {
  deviceId: string;
  name: string;
  rssi: number;
}

export interface BleCharacteristicInfo {
  uuid: string;
  canRead: boolean;
  canWrite: boolean;
  canNotify: boolean;
}

export interface BleServiceInfo {
  uuid: string;
  characteristics: BleCharacteristicInfo[];
}

const SCAN_DURATION_MS = 6000;

/**
 * Thrown when running in the browser, where a real BLE radio isn't
 * available to test against.
 */
export class BrowserNotSupportedError extends Error {
  constructor() {
    super('The Bluetooth LE plugin cannot be tested in the browser.');
    this.name = 'BrowserNotSupportedError';
  }
}

/** Thrown when the device's Bluetooth radio is turned off. */
export class BluetoothDisabledError extends Error {
  constructor() {
    super('Bluetooth is turned off on this device.');
    this.name = 'BluetoothDisabledError';
  }
}

@Injectable({ providedIn: 'root' })
export class BluetoothService {
  private platformService = inject(PlatformService);
  private initialized = false;

  /**
   * Scans for nearby BLE devices for a fixed duration and resolves with
   * the list of unique devices found. The page doesn't need to manage
   * the scan callback or timer: it calls scanForDevices() and gets a
   * plain list back.
   */
  async scanForDevices(): Promise<BleScanDevice[]> {
    if (!this.platformService.isNativePlatform()) {
      throw new BrowserNotSupportedError();
    }

    await this.ensureReady();

    const found = new Map<string, BleScanDevice>();

    await BleClient.requestLEScan({}, (result) => {
      found.set(result.device.deviceId, {
        deviceId: result.device.deviceId,
        name: result.localName || result.device.name || 'Unknown device',
        rssi: result.rssi ?? -100,
      });
    });

    await new Promise((resolve) => setTimeout(resolve, SCAN_DURATION_MS));
    await BleClient.stopLEScan();

    return Array.from(found.values()).sort((a, b) => b.rssi - a.rssi);
  }

  /**
   * Connects to a device and discovers its services and characteristics.
   * onUnexpectedDisconnect is called if the device disconnects on its own
   * (out of range, powered off, etc.), not when disconnect() is called.
   */
  async connect(
    deviceId: string,
    onUnexpectedDisconnect: (deviceId: string) => void,
  ): Promise<BleServiceInfo[]> {
    await BleClient.connect(deviceId, onUnexpectedDisconnect);
    const services = await BleClient.getServices(deviceId);
    return services.map((service) => this.toServiceInfo(service));
  }

  async disconnect(deviceId: string): Promise<void> {
    await BleClient.disconnect(deviceId);
  }

  /** Reads a characteristic's value and returns it as a hex string. */
  async readCharacteristic(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
  ): Promise<string> {
    const value = await BleClient.read(
      deviceId,
      serviceUuid,
      characteristicUuid,
    );
    return dataViewToHexString(value);
  }

  /** Starts listening to a characteristic's value changes. */
  async startNotifications(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
    onValue: (hex: string) => void,
  ): Promise<void> {
    await BleClient.startNotifications(
      deviceId,
      serviceUuid,
      characteristicUuid,
      (value) => onValue(dataViewToHexString(value)),
    );
  }

  async stopNotifications(
    deviceId: string,
    serviceUuid: string,
    characteristicUuid: string,
  ): Promise<void> {
    await BleClient.stopNotifications(
      deviceId,
      serviceUuid,
      characteristicUuid,
    );
  }

  /** Fixed sample data used to preview the full flow on browser. */
  getMockDevices(): BleScanDevice[] {
    return [
      { deviceId: 'MOCK-01', name: 'Polar H10', rssi: -52 },
      { deviceId: 'MOCK-02', name: 'Smart Band 4', rssi: -71 },
    ];
  }

  getMockServices(): BleServiceInfo[] {
    return [
      {
        uuid: '0000180d-0000-1000-8000-00805f9b34fb',
        characteristics: [
          {
            uuid: '00002a37-0000-1000-8000-00805f9b34fb',
            canRead: false,
            canWrite: false,
            canNotify: true,
          },
          {
            uuid: '00002a38-0000-1000-8000-00805f9b34fb',
            canRead: true,
            canWrite: false,
            canNotify: false,
          },
        ],
      },
    ];
  }

  // ---------------------------------------------------------------
  // Native
  // ---------------------------------------------------------------

  /**
   * Initializes the plugin (only once) and confirms Bluetooth is turned
   * on before scanning, so the page can show a specific alert instead of
   * a scan that silently finds nothing.
   */
  private async ensureReady(): Promise<void> {
    if (!this.initialized) {
      // androidNeverForLocation lets Android 12+ scan without requesting
      // the location permission, since this demo doesn't use scan
      // results to derive the user's physical location.
      await BleClient.initialize({ androidNeverForLocation: true });
      this.initialized = true;
    }

    const enabled = await BleClient.isEnabled();
    if (!enabled) {
      throw new BluetoothDisabledError();
    }
  }

  private toServiceInfo(service: BleService): BleServiceInfo {
    return {
      uuid: service.uuid,
      characteristics: service.characteristics.map((characteristic) => ({
        uuid: characteristic.uuid,
        canRead: characteristic.properties.read,
        canWrite: characteristic.properties.write,
        canNotify: characteristic.properties.notify,
      })),
    };
  }
}
