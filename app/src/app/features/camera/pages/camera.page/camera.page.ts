import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
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
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
  ],
  templateUrl: './camera.page.html',
  styleUrls: ['./camera.page.scss'],
})
export class CameraPage {
  state = signal<ViewState>('idle');
  photo = signal<PhotoInfo | null>(null);

  codeSnippet = `import { Camera, CameraResultType, CameraSource }
from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  resultType: CameraResultType.Uri,
  source: CameraSource.Camera
});`;

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

  async openCamera(): Promise<void> {
    await this.capture(() => this.cameraService.takePhoto());
  }

  async chooseFromGallery(): Promise<void> {
    await this.capture(() => this.cameraService.pickFromGallery());
  }

  private async capture(action: () => Promise<PhotoInfo>): Promise<void> {
    this.state.set('loading');
    try {
      const result = await action();
      this.photo.set(result);
      this.state.set('captured');
    } catch (error) {
      if (error instanceof BrowserNotSupportedError) {
        await this.showBrowserNotSupportedAlert();
        // Mostramos igual el mock para que se pueda ver el flujo completo de la UI
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

  async copyCode(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.codeSnippet);
    } catch {
      // Si el navegador bloquea el acceso al portapapeles simplemente ignoramos;
      // no es crítico para el flujo de la demo.
    }
  }

  private async showBrowserNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'No disponible en el navegador',
      message:
        'El plugin Camera no puede probarse en el navegador. Instalá la app en un dispositivo móvil para abrir la cámara real.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permiso denegado',
      message:
        'Necesitamos acceso a la cámara y a la galería para poder capturar o elegir una foto. Habilitá el permiso desde los ajustes del dispositivo.',
      buttons: ['Entendido'],
    });
    await alert.present();
  }

  private async showGenericErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Ocurrió un error',
      message: 'No pudimos completar la operación. Intentá nuevamente.',
      buttons: ['Cerrar'],
    });
    await alert.present();
  }
}
