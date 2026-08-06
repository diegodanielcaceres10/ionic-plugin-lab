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
  radioOutline,
  checkmarkCircleOutline,
  informationCircleOutline,
  documentTextOutline,
  hardwareChipOutline,
  lockClosedOutline,
  timeOutline,
  createOutline,
  settingsOutline,
} from 'ionicons/icons';
import {
  NfcService,
  NfcReadResult,
  BrowserNotSupportedError,
  DeviceNotSupportedError,
  NfcDisabledError,
} from '../../data/nfc.service';

type ViewState = 'idle' | 'scanning' | 'read';

@Component({
  selector: 'app-nfc',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './nfc.page.html',
  styleUrls: ['./nfc.page.scss'],
})
export class NfcPage {
  state = signal<ViewState>('idle');
  tag = signal<NfcReadResult | null>(null);

  constructor(
    private nfcService: NfcService,
    private alertController: AlertController,
  ) {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'ellipsis-vertical-outline': ellipsisVerticalOutline,
      'radio-outline': radioOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'document-text-outline': documentTextOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'lock-closed-outline': lockClosedOutline,
      'time-outline': timeOutline,
      'create-outline': createOutline,
      'settings-outline': settingsOutline,
    });
  }

  /** Opens a scan session and reads the next tag brought near the device. */
  async scanTag(): Promise<void> {
    this.state.set('scanning');
    try {
      const result = await this.nfcService.scan();
      this.tag.set(result);
      this.state.set('read');
    } catch (error) {
      await this.handleError(error);
    }
  }

  /** Opens a scan session and writes a fixed demo text to the next tag. */
  async writeDemoTag(): Promise<void> {
    this.state.set('scanning');
    try {
      await this.nfcService.writeText();
      await this.showWriteSuccessAlert();
      this.state.set(this.tag() ? 'read' : 'idle');
    } catch (error) {
      await this.handleError(error);
    }
  }

  private async handleError(error: unknown): Promise<void> {
    if (error instanceof BrowserNotSupportedError) {
      await this.showBrowserNotSupportedAlert();
      this.tag.set(this.nfcService.getMockRead());
      this.state.set('read');
      return;
    }

    if (error instanceof DeviceNotSupportedError) {
      await this.showDeviceNotSupportedAlert();
      this.state.set(this.tag() ? 'read' : 'idle');
      return;
    }

    if (error instanceof NfcDisabledError) {
      await this.showNfcDisabledAlert();
      this.state.set(this.tag() ? 'read' : 'idle');
      return;
    }

    // Most likely the user cancelled the scan or moved the tag away
    // too soon. Nothing went wrong, just go back.
    this.state.set(this.tag() ? 'read' : 'idle');
  }

  private async showBrowserNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Not available in the browser',
      message:
        'The NFC plugin cannot be tested in the browser. Install the app on a mobile device to scan a real tag.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showDeviceNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'NFC not available',
      message:
        "This device doesn't have NFC hardware, so tags can't be scanned here.",
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showNfcDisabledAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'NFC is turned off',
      message: 'Enable NFC in the device settings to scan or write a tag.',
      buttons: [
        'Cancel',
        {
          text: 'Open Settings',
          handler: () => this.nfcService.openSettings(),
        },
      ],
    });
    await alert.present();
  }

  private async showWriteSuccessAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Tag written',
      message: 'The demo text was written to the tag successfully.',
      buttons: ['Got it'],
    });
    await alert.present();
  }
}
