import { Component, signal } from '@angular/core';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { CommonModule } from '@angular/common';
import {
  IonSpinner,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  ellipsisVerticalOutline,
  bluetoothOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  layersOutline,
  downloadOutline,
  radioButtonOnOutline,
  radioButtonOffOutline,
  closeCircleOutline,
  settingsOutline,
  timeOutline,
} from 'ionicons/icons';
import {
  BluetoothService,
  BleScanDevice,
  BleServiceInfo,
  BrowserNotSupportedError,
  BluetoothDisabledError,
} from '../../data/bluetooth.service';

type ViewState = 'idle' | 'scanning' | 'connected';

@Component({
  selector: 'app-bluetooth',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './bluetooth.page.html',
  styleUrls: ['./bluetooth.page.scss'],
})
export class BluetoothPage {
  state = signal<ViewState>('idle');
  devices = signal<BleScanDevice[]>([]);
  connectedDevice = signal<BleScanDevice | null>(null);
  services = signal<BleServiceInfo[]>([]);
  lastRead = signal<{ characteristicUuid: string; hex: string } | null>(null);
  notifyingUuid = signal<string | null>(null);

  constructor(
    private bluetoothService: BluetoothService,
    private alertController: AlertController,
  ) {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'ellipsis-vertical-outline': ellipsisVerticalOutline,
      'bluetooth-outline': bluetoothOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'layers-outline': layersOutline,
      'download-outline': downloadOutline,
      'radio-button-on-outline': radioButtonOnOutline,
      'radio-button-off-outline': radioButtonOffOutline,
      'close-circle-outline': closeCircleOutline,
      'settings-outline': settingsOutline,
      'time-outline': timeOutline,
    });
  }

  /** Scans for nearby BLE devices for a few seconds. */
  async scanForDevices(): Promise<void> {
    this.state.set('scanning');
    this.devices.set([]);
    try {
      const found = await this.bluetoothService.scanForDevices();
      this.devices.set(found);
      this.state.set('idle');
    } catch (error) {
      if (error instanceof BrowserNotSupportedError) {
        await this.showBrowserNotSupportedAlert();
        this.devices.set(this.bluetoothService.getMockDevices());
        this.state.set('idle');
        return;
      }

      if (error instanceof BluetoothDisabledError) {
        await this.showBluetoothDisabledAlert();
        this.state.set('idle');
        return;
      }

      await this.showGenericErrorAlert(
        'Scan failed',
        "We couldn't scan for devices.",
      );
      this.state.set('idle');
    }
  }

  /** Connects to a device found in the scan and discovers its services. */
  async connectToDevice(device: BleScanDevice): Promise<void> {
    try {
      const services = device.deviceId.startsWith('MOCK-')
        ? this.bluetoothService.getMockServices()
        : await this.bluetoothService.connect(device.deviceId, (deviceId) =>
            this.handleUnexpectedDisconnect(deviceId),
          );

      this.connectedDevice.set(device);
      this.services.set(services);
      this.lastRead.set(null);
      this.notifyingUuid.set(null);
      this.state.set('connected');
    } catch {
      await this.showGenericErrorAlert(
        'Connection failed',
        "We couldn't connect to that device.",
      );
    }
  }

  /** Disconnects from the currently connected device. */
  async disconnectDevice(): Promise<void> {
    const device = this.connectedDevice();
    if (device && !device.deviceId.startsWith('MOCK-')) {
      await this.bluetoothService.disconnect(device.deviceId);
    }
    this.resetToIdle();
  }

  /** Reads the current value of a characteristic. */
  async readCharacteristic(
    serviceUuid: string,
    characteristicUuid: string,
  ): Promise<void> {
    const device = this.connectedDevice();
    if (!device) {
      return;
    }

    try {
      const hex = device.deviceId.startsWith('MOCK-')
        ? '4B'
        : await this.bluetoothService.readCharacteristic(
            device.deviceId,
            serviceUuid,
            characteristicUuid,
          );
      this.lastRead.set({ characteristicUuid, hex });
    } catch {
      await this.showGenericErrorAlert(
        'Read failed',
        "We couldn't read that characteristic.",
      );
    }
  }

  /** Toggles live notifications for a characteristic that supports them. */
  async toggleNotifications(
    serviceUuid: string,
    characteristicUuid: string,
  ): Promise<void> {
    const device = this.connectedDevice();
    if (!device || device.deviceId.startsWith('MOCK-')) {
      return;
    }

    if (this.notifyingUuid() === characteristicUuid) {
      await this.bluetoothService.stopNotifications(
        device.deviceId,
        serviceUuid,
        characteristicUuid,
      );
      this.notifyingUuid.set(null);
      return;
    }

    try {
      await this.bluetoothService.startNotifications(
        device.deviceId,
        serviceUuid,
        characteristicUuid,
        (hex) => this.lastRead.set({ characteristicUuid, hex }),
      );
      this.notifyingUuid.set(characteristicUuid);
    } catch {
      await this.showGenericErrorAlert(
        'Notifications failed',
        "We couldn't subscribe to that characteristic.",
      );
    }
  }

  private handleUnexpectedDisconnect(deviceId: string): void {
    if (this.connectedDevice()?.deviceId === deviceId) {
      this.resetToIdle();
    }
  }

  private resetToIdle(): void {
    this.connectedDevice.set(null);
    this.services.set([]);
    this.lastRead.set(null);
    this.notifyingUuid.set(null);
    this.state.set('idle');
  }

  private async showBrowserNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Not available in the browser',
      message:
        'The Bluetooth LE plugin cannot be tested in the browser. Install the app on a mobile device to scan for real devices.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showBluetoothDisabledAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Bluetooth is turned off',
      message: 'Enable Bluetooth in the device settings to scan for devices.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showGenericErrorAlert(
    header: string,
    message: string,
  ): Promise<void> {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['Close'],
    });
    await alert.present();
  }
}
