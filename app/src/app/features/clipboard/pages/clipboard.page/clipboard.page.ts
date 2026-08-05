import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  copyOutline,
  clipboardOutline,
  trashOutline,
  flashOutline,
  imageOutline,
  checkmarkOutline,
  timeOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import {
  ClipboardService,
  ClipboardContentType,
  ClipboardReadResult,
  SAMPLE_IMAGE_BASE64,
} from '../../data/clipboard.service';

interface HistoryEntry {
  action: string;
  detail: string;
  timestamp: number;
}

interface QuickCopy {
  label: string;
  value: string;
  icon: string;
}

const HISTORY_LIMIT = 6;

const QUICK_COPIES: QuickCopy[] = [
  { label: 'Email', value: 'hello@ionicpluginlab.dev', icon: 'copy-outline' },
  { label: 'Referral Code', value: 'IONIC-2026', icon: 'copy-outline' },
  { label: 'Phone', value: '+34 600 000 000', icon: 'copy-outline' },
];

@Component({
  selector: 'app-clipboard',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonIcon,
  ],
  templateUrl: './clipboard.page.html',
  styleUrls: ['./clipboard.page.scss'],
})
export class ClipboardPage {
  // ── Write ─────────────────────────────────────────────────────────
  customText = signal('Hello from Ionic Plugin Lab!');
  copiedTarget = signal<string | null>(null);
  private copiedResetHandle: ReturnType<typeof setTimeout> | null = null;

  // ── Read ──────────────────────────────────────────────────────────
  readResult = signal<ClipboardReadResult | null>(null);

  // ── History ───────────────────────────────────────────────────────
  history = signal<HistoryEntry[]>([]);

  readonly quickCopies = QUICK_COPIES;

  constructor(
    private clipboardService: ClipboardService,
    private alertController: AlertController,
  ) {
    addIcons({
      'copy-outline': copyOutline,
      'clipboard-outline': clipboardOutline,
      'trash-outline': trashOutline,
      'flash-outline': flashOutline,
      'image-outline': imageOutline,
      'checkmark-outline': checkmarkOutline,
      'time-outline': timeOutline,
      'information-circle-outline': informationCircleOutline,
    });
  }

  updateCustomText(value: string): void {
    this.customText.set(value);
  }

  // ── 1. Copy custom text ───────────────────────────────────────────
  async copyCustomText(): Promise<void> {
    const text = this.customText();
    if (!text) return;
    await this.clipboardService.writeText(text);
    this.flash('custom');
    this.pushHistory('Copied text', this.truncate(text));
  }

  // ── 2. Read clipboard ─────────────────────────────────────────────
  async readClipboard(): Promise<void> {
    try {
      const result = await this.clipboardService.read();
      this.readResult.set(result);
      this.pushHistory(
        'Read clipboard',
        result.type === 'empty'
          ? 'empty'
          : `${result.type} · ${this.truncate(result.value)}`,
      );
    } catch {
      await this.showGenericErrorAlert();
    }
  }

  // ── 4. Copy image ─────────────────────────────────────────────────
  async copyImage(): Promise<void> {
    try {
      await this.clipboardService.writeImage(SAMPLE_IMAGE_BASE64);
      this.flash('image');
      this.pushHistory('Copied image', 'PNG · sample logo');
    } catch {
      await this.showImageNotSupportedAlert();
    }
  }

  // ── 5. Quick-copy chips ───────────────────────────────────────────
  async quickCopy(chip: QuickCopy): Promise<void> {
    await this.clipboardService.writeText(chip.value);
    this.flash(chip.label);
    this.pushHistory(`Copied ${chip.label}`, chip.value);
  }

  // ── 6. Clear clipboard ────────────────────────────────────────────
  async clearClipboard(): Promise<void> {
    await this.clipboardService.clear();
    this.readResult.set(null);
    this.flash('clear');
    this.pushHistory('Cleared clipboard', '—');
  }

  // ── Helpers ───────────────────────────────────────────────────────
  isCopied(target: string): boolean {
    return this.copiedTarget() === target;
  }

  isImageType(type: ClipboardContentType): boolean {
    return type === 'image/png' || type === 'image/jpeg';
  }

  imageDataUri(value: string, type: ClipboardContentType): string {
    return `data:${type};base64,${value}`;
  }

  private flash(target: string): void {
    this.copiedTarget.set(target);
    if (this.copiedResetHandle) clearTimeout(this.copiedResetHandle);
    this.copiedResetHandle = setTimeout(
      () => this.copiedTarget.set(null),
      1500,
    );
  }

  private pushHistory(action: string, detail: string): void {
    const entry: HistoryEntry = { action, detail, timestamp: Date.now() };
    this.history.update((h) => [entry, ...h].slice(0, HISTORY_LIMIT));
  }

  private truncate(value: string, max = 32): string {
    return value.length > max ? value.slice(0, max) + '…' : value;
  }

  private async showGenericErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Something went wrong',
      message: "We couldn't read the clipboard. Try again.",
      buttons: ['Close'],
    });
    await alert.present();
  }

  private async showImageNotSupportedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Not supported here',
      message:
        'Copying images to the clipboard is only available on native iOS and Android. Try it on a device.',
      buttons: ['Got it'],
    });
    await alert.present();
  }
}
