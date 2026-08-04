import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonTextarea, IonButton, IonIcon } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import {
  ClipboardService,
  ClipboardSnapshot,
} from '../../data/clipboard.service';

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  action: () => Promise<void>;
}

/**
 * Clipboard plugin demo page.
 * Reads and writes text/URL/image content via @capacitor/clipboard,
 * with a small text field to demo copy/paste round-trips.
 */
@Component({
  selector: 'app-clipboard',
  standalone: true,
  imports: [
    FormsModule,
    ShellComponent,
    HeaderComponent,
    IonTextarea,
    IonButton,
    IonIcon,
  ],
  templateUrl: './clipboard.page.html',
  styleUrls: ['./clipboard.page.scss'],
})
export class ClipboardPage implements OnInit {
  private clipboardService = inject(ClipboardService);
  private toastCtrl = inject(ToastController);

  clipboard = signal<ClipboardSnapshot | null>(null);
  lastReadAt = signal<number | null>(null);
  inputText = signal('');
  infoExpanded = signal(false);

  demoUrl = 'https://diegodanielcaceres10.github.io/nura/';

  categoryIcon = computed<string>(() => {
    switch (this.clipboard()?.category) {
      case 'url':
        return 'link-outline';
      case 'image':
        return 'image-outline';
      case 'text':
        return 'document-text-outline';
      default:
        return 'clipboard-outline';
    }
  });

  categoryLabel = computed<string>(() => {
    switch (this.clipboard()?.category) {
      case 'url':
        return 'URL';
      case 'image':
        return 'Image';
      case 'text':
        return 'Text';
      default:
        return 'Empty';
    }
  });

  quickActions: QuickAction[] = [
    {
      id: 'read',
      icon: 'clipboard-outline',
      title: 'Read Clipboard',
      action: () => this.readClipboard(),
    },
    {
      id: 'copy-text',
      icon: 'document-text-outline',
      title: 'Copy Text',
      action: () => this.copyText(),
    },
    {
      id: 'copy-url',
      icon: 'link-outline',
      title: 'Copy URL',
      action: () => this.copyUrl(),
    },
    {
      id: 'copy-image',
      icon: 'image-outline',
      title: 'Copy Image',
      action: () => this.copyImage(),
    },
    {
      id: 'clear',
      icon: 'trash-outline',
      title: 'Clear Input',
      action: () => this.clearInput(),
    },
    {
      id: 'paste',
      icon: 'download-outline',
      title: 'Paste into Input',
      action: () => this.pasteIntoInput(),
    },
    {
      id: 'refresh',
      icon: 'refresh-outline',
      title: 'Refresh Clipboard',
      action: () => this.refreshClipboard(),
    },
    {
      id: 'info',
      icon: 'information-circle-outline',
      title: 'Clipboard Info',
      action: () => this.showInfo(),
    },
  ];

  async ngOnInit() {
    await this.refreshClipboard();
  }

  async readClipboard(): Promise<void> {
    await this.refreshClipboard();
    await this.showToast('Clipboard content loaded');
  }

  async copyText(): Promise<void> {
    const value = this.inputText().trim() || 'Hello from Ionic Plugin Lab!';
    try {
      await this.clipboardService.writeText(value);
      await this.showToast('Text copied to clipboard');
      await this.refreshClipboard();
    } catch (err: any) {
      await this.clipboardService.showErrorAlert(this.describeError(err));
    }
  }

  async copyUrl(): Promise<void> {
    try {
      await this.clipboardService.writeUrl(this.demoUrl);
      await this.showToast('URL copied to clipboard');
      await this.refreshClipboard();
    } catch (err: any) {
      await this.clipboardService.showErrorAlert(this.describeError(err));
    }
  }

  async copyImage(): Promise<void> {
    try {
      await this.clipboardService.writeDemoImage();
      await this.showToast('Image copied to clipboard');
      await this.refreshClipboard();
    } catch (err: any) {
      await this.clipboardService.showErrorAlert(
        'This browser does not support copying images to the clipboard. Try the APK build instead.',
      );
    }
  }

  async clearInput(): Promise<void> {
    await this.inputText.set('');
  }

  async pasteIntoInput(): Promise<void> {
    try {
      const snapshot = await this.clipboardService.read();
      this.inputText.set(snapshot.value);
      await this.showToast('Pasted from clipboard');
    } catch (err: any) {
      await this.clipboardService.showErrorAlert(this.describeError(err));
    }
  }

  async refreshClipboard(): Promise<void> {
    try {
      const snapshot = await this.clipboardService.read();
      this.clipboard.set(snapshot);
      this.lastReadAt.set(Date.now());
    } catch (err: any) {
      await this.clipboardService.showErrorAlert(this.describeError(err));
    }
  }

  async showInfo(): Promise<void> {
    await this.refreshClipboard();
    this.infoExpanded.set(true);
  }

  characterCount(): number {
    return this.clipboard()?.value.length ?? 0;
  }

  timeLabel(timestamp: number | null): string {
    if (!timestamp) return '—';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  private describeError(err: any): string {
    if (/denied|permission/i.test(err?.message ?? '')) {
      return 'Clipboard permission was denied. Allow clipboard access for this site and try again.';
    }
    return 'Could not access the clipboard. Make sure the page is focused and try again.';
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();
  }
}
