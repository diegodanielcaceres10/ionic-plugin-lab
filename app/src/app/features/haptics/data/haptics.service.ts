import { Injectable, inject } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PlatformService } from '../../../core/platform/platform.service';

/**
 * Thin wrapper around @capacitor/haptics.
 * All feedback methods require a native platform — a browser's
 * navigator.vibrate() existing doesn't guarantee real hardware behind
 * it (e.g. desktop Chrome implements the API but has no vibration
 * motor), and none of the notification/selection patterns have a web
 * equivalent anyway. So every method alerts on web instead of either
 * silently doing nothing or half-working.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private platform = inject(PlatformService);
  private alertController = inject(AlertController);

  async impact(style: ImpactStyle): Promise<void> {
    if (!(await this.ensureNative())) return;
    await Haptics.impact({ style });
  }

  async notification(type: NotificationType): Promise<void> {
    if (!(await this.ensureNative())) return;
    await Haptics.notification({ type });
  }

  async selectionStart(): Promise<void> {
    if (!(await this.ensureNative())) return;
    await Haptics.selectionStart();
  }

  async selectionChanged(): Promise<void> {
    if (!(await this.ensureNative())) return;
    await Haptics.selectionChanged();
  }

  async selectionEnd(): Promise<void> {
    if (!(await this.ensureNative())) return;
    await Haptics.selectionEnd();
  }

  /** Native-only support — true on Android/iOS, always false on web. */
  isSupported(): boolean {
    return this.platform.isNativePlatform();
  }

  /** Shows the generic "not available in browser" alert and returns false when running on web. */
  private async ensureNative(): Promise<boolean> {
    if (this.platform.isNativePlatform()) return true;

    const alert = await this.alertController.create({
      header: 'Not available in the browser',
      message:
        'Haptic feedback cannot be tested in the browser. Install the app on a mobile device to feel the real vibration.',
      buttons: ['Got it'],
    });
    await alert.present();
    return false;
  }
}
