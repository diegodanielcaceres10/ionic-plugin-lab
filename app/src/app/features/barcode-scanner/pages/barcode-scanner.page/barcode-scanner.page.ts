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
  scanOutline,
  checkmarkCircleOutline,
  barcodeOutline,
  informationCircleOutline,
  pricetagOutline,
  linkOutline,
  timeOutline,
  openOutline,
  copyOutline,
  trashOutline,
} from 'ionicons/icons';
import {
  BarcodeScannerService,
  ScanResult,
  BrowserNotSupportedError,
  ModuleNotAvailableError,
} from '../../data/barcode-scanner.service';

type ViewState = 'idle' | 'scanning' | 'scanned';

@Component({
  selector: 'app-barcode-scanner',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './barcode-scanner.page.html',
  styleUrls: ['./barcode-scanner.page.scss'],
})
export class BarcodeScannerPage {
  state = signal<ViewState>('idle');
  scan = signal<ScanResult | null>(null);
  history = signal<ScanResult[]>([]);

  constructor(
    private barcodeScannerService: BarcodeScannerService,
    private alertController: AlertController,
  ) {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'ellipsis-vertical-outline': ellipsisVerticalOutline,
      'scan-outline': scanOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'barcode-outline': barcodeOutline,
      'information-circle-outline': informationCircleOutline,
      'pricetag-outline': pricetagOutline,
      'link-outline': linkOutline,
      'time-outline': timeOutline,
      'open-outline': openOutline,
      'copy-outline': copyOutline,
      'trash-outline': trashOutline,
    });
  }

  /** Opens the native scanner and reads the next barcode. */
  async scanBarcode(): Promise<void> {
    this.state.set('scanning');
    try {
      const result = await this.barcodeScannerService.scan();
      this.applyResult(result);
    } catch (error) {
      if (error instanceof BrowserNotSupportedError) {
        await this.showBrowserNotSupportedAlert();
        this.applyResult(this.barcodeScannerService.getMockScan());
        return;
      }

      if (error instanceof ModuleNotAvailableError) {
        await this.showModuleDownloadingAlert();
        this.state.set(this.scan() ? 'scanned' : 'idle');
        return;
      }

      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        await this.showPermissionDeniedAlert();
        this.state.set(this.scan() ? 'scanned' : 'idle');
        return;
      }

      // Most likely the user closed the native scanner without reading
      // anything (e.g. tapped back). Nothing went wrong, just go back.
      this.state.set(this.scan() ? 'scanned' : 'idle');
    }
  }

  /** Opens the scanned value in the browser when it looks like a URL. */
  openLink(): void {
    const value = this.scan()?.value;
    if (value) {
      window.open(value, '_system');
    }
  }

  /** Copies the scanned value to the clipboard. */
  async copyValue(): Promise<void> {
    const value = this.scan()?.value;
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
  }

  /** Clears the session's scan history. */
  clearHistory(): void {
    this.history.set([]);
  }

  private applyResult(result: ScanResult): void {
    this.scan.set(result);
    this.history.update((current) => [result, ...current].slice(0, 10));
    this.state.set('scanned');
  }

  private async showBrowserNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Not available in the browser',
      message:
        'The Barcode Scanner plugin cannot be tested in the browser. Install the app on a mobile device to open the real scanner.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showModuleDownloadingAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Preparing scanner',
      message:
        'Android is downloading the Google Barcode Scanner module for the first use. Please try again in a few seconds.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message:
        'We need access to the camera to scan a barcode. Enable the permission from the device settings.',
      buttons: ['Got it'],
    });
    await alert.present();
  }
}
