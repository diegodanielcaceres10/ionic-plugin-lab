import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
import { IonIcon, AlertController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  copyOutline,
  clipboardOutline,
  trashOutline,
  flashOutline,
  imageOutline,
  checkmarkOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import {
  ClipboardService,
  ClipboardContentType,
  ClipboardReadResult,
  SAMPLE_IMAGE_BASE64,
} from '../../data/clipboard.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

interface QuickCopy {
  label: string;
  value: string;
  icon: string;
}

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
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './clipboard.page.html',
  styleUrls: ['./clipboard.page.scss'],
})
export class ClipboardPage implements OnInit {
  pluginName = 'Clipboard';

  // ── Write ─────────────────────────────────────────────────────────
  customText = signal('Hello from Ionic Plugin Lab!');
  copiedTarget = signal<string | null>(null);
  private copiedResetHandle: ReturnType<typeof setTimeout> | null = null;

  // ── Read ──────────────────────────────────────────────────────────
  readResult = signal<ClipboardReadResult | null>(null);

  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  readonly quickCopies = QUICK_COPIES;

  constructor(
    private clipboardService: ClipboardService,
    private alertController: AlertController,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'copy-outline': copyOutline,
      'clipboard-outline': clipboardOutline,
      'trash-outline': trashOutline,
      'flash-outline': flashOutline,
      'image-outline': imageOutline,
      'checkmark-outline': checkmarkOutline,
      'information-circle-outline': informationCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
    await this.refreshActivityLog();
  }

  async toggleFavorite(): Promise<void> {
    const plugin = this.pluginInfo();
    if (!plugin) return;

    const next = !plugin.isFavorited;
    await this.pluginsCatalogService.setFavorited(plugin.id, next);
    this.pluginInfo.set({ ...plugin, isFavorited: next });
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
    await this.refreshActivityLog();
  }

  // ── 2. Read clipboard ─────────────────────────────────────────────
  async readClipboard(): Promise<void> {
    try {
      const result = await this.clipboardService.read();
      this.readResult.set(result);
    } catch {
      await this.showGenericErrorAlert();
    } finally {
      await this.refreshActivityLog();
    }
  }

  // ── 4. Copy image ─────────────────────────────────────────────────
  async copyImage(): Promise<void> {
    try {
      await this.clipboardService.writeImage(SAMPLE_IMAGE_BASE64);
      this.flash('image');
    } catch {
      await this.showImageNotSupportedAlert();
    } finally {
      await this.refreshActivityLog();
    }
  }

  // ── 5. Quick-copy chips ───────────────────────────────────────────
  async quickCopy(chip: QuickCopy): Promise<void> {
    await this.clipboardService.writeText(chip.value);
    this.flash(chip.label);
    await this.refreshActivityLog();
  }

  // ── 6. Clear clipboard ────────────────────────────────────────────
  async clearClipboard(): Promise<void> {
    await this.clipboardService.clear();
    this.readResult.set(null);
    this.flash('clear');
    await this.refreshActivityLog();
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

  private async refreshActivityLog(): Promise<void> {
    const logs = await this.pluginLogsService.list(this.pluginName);
    this.activityLog.set(logs);
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
