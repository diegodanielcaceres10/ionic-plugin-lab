import { Component, signal } from '@angular/core';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { CommonModule } from '@angular/common';
import {
  IonSpinner,
  IonButton,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chevronBackOutline,
  ellipsisVerticalOutline,
  cameraOutline,
  checkmarkCircleOutline,
  imageOutline,
  informationCircleOutline,
  swapHorizontalOutline,
  swapVerticalOutline,
  documentOutline,
  folderOutline,
  timeOutline,
  codeSlashOutline,
  copyOutline,
  bookOutline,
  openOutline,
} from 'ionicons/icons';
import {
  CameraService,
  PhotoInfo,
  BrowserNotSupportedError,
} from '../../data/camera.service';

type ViewState = 'idle' | 'loading' | 'captured';

@Component({
  selector: 'app-camera',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    IonSpinner,
    IonButton,
    IonIcon,
  ],
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
})
export class CameraPage {
  state = signal<ViewState>('idle');
  photo = signal<PhotoInfo | null>(null);

  constructor(
    private cameraService: CameraService,
    private alertController: AlertController,
  ) {
    addIcons({
      'chevron-back-outline': chevronBackOutline,
      'ellipsis-vertical-outline': ellipsisVerticalOutline,
      'camera-outline': cameraOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'image-outline': imageOutline,
      'information-circle-outline': informationCircleOutline,
      'swap-horizontal-outline': swapHorizontalOutline,
      'swap-vertical-outline': swapVerticalOutline,
      'document-outline': documentOutline,
      'folder-outline': folderOutline,
      'time-outline': timeOutline,
      'code-slash-outline': codeSlashOutline,
      'copy-outline': copyOutline,
      'book-outline': bookOutline,
      'open-outline': openOutline,
    });
  }

  /** Opens the native camera to capture a new photo. */
  async openCamera(): Promise<void> {
    await this.capture(() => this.cameraService.takePhoto());
  }

  /** Opens the native gallery/photo picker to select an existing photo. */
  async chooseFromGallery(): Promise<void> {
    await this.capture(() => this.cameraService.pickFromGallery());
  }

  /**
   * Runs a capture action (camera or gallery), updating the view state
   * and handling each known error case with its corresponding alert.
   */
  private async capture(action: () => Promise<PhotoInfo>): Promise<void> {
    this.state.set('loading');
    try {
      const result = await action();
      this.photo.set(result);
      this.state.set('captured');
    } catch (error) {
      if (error instanceof BrowserNotSupportedError) {
        await this.showBrowserNotSupportedAlert();
        // Still show the mock so the full UI flow can be previewed on browser
        this.photo.set(this.cameraService.getMockPhoto());
        this.state.set('captured');
        return;
      }

      if (error instanceof Error && error.message === 'PERMISSION_DENIED') {
        await this.showPermissionDeniedAlert();
        this.state.set(this.photo() ? 'captured' : 'idle');
        return;
      }

      await this.showGenericErrorAlert();
      this.state.set(this.photo() ? 'captured' : 'idle');
    }
  }

  private async showBrowserNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Not available in the browser',
      message:
        'The Camera plugin cannot be tested in the browser. Install the app on a mobile device to open the real camera.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message:
        'We need access to the camera and the gallery to capture or pick a photo. Enable the permission from the device settings.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showGenericErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Something went wrong',
      message: "We couldn't complete the operation. Please try again.",
      buttons: ['Close'],
    });
    await alert.present();
  }
}
