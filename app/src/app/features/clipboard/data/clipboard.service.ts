import { Injectable, inject } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { AlertController } from '@ionic/angular';

export type ClipboardCategory = 'text' | 'url' | 'image' | 'empty';

export interface ClipboardSnapshot {
  value: string;
  rawType: string;
  category: ClipboardCategory;
}

// 1x1 transparent PNG used as a placeholder for the "Copy Image" demo action.
const DEMO_IMAGE_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

const URL_PATTERN = /^(https?:\/\/|www\.)[^\s]+$/i;

/**
 * Thin wrapper around @capacitor/clipboard.
 * Adds category detection (text/url/image) on top of the plugin's raw
 * read() result, since the plugin only reports a generic MIME type
 * and doesn't distinguish "plain text" from "a URL typed as text".
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private alertController = inject(AlertController);

  async writeText(value: string): Promise<void> {
    await Clipboard.write({ string: value });
  }

  async writeUrl(url: string): Promise<void> {
    await Clipboard.write({ url });
  }

  async writeDemoImage(): Promise<void> {
    await Clipboard.write({ image: DEMO_IMAGE_BASE64 });
  }

  async read(): Promise<ClipboardSnapshot> {
    const result = await Clipboard.read();
    const value = result.value ?? '';
    return {
      value,
      rawType: result.type || 'unknown',
      category: this.detectCategory(value, result.type),
    };
  }

  private detectCategory(value: string, rawType: string): ClipboardCategory {
    if (!value) return 'empty';
    if (rawType?.startsWith('image') || value.startsWith('data:image'))
      return 'image';
    if (URL_PATTERN.test(value.trim())) return 'url';
    return 'text';
  }

  async showErrorAlert(message: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Clipboard error',
      message,
      buttons: ['Got it'],
    });
    await alert.present();
  }
}
