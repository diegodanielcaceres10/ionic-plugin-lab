import { Component, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  fingerPrintOutline,
  copyOutline,
  checkmarkOutline,
  hardwareChipOutline,
  languageOutline,
  batteryHalfOutline,
  batteryChargingOutline,
  codeSlashOutline,
  refreshOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { DeviceService, DeviceSnapshot } from '../../data/device.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';

type ViewState = 'loading' | 'ready' | 'error';
type CopyTarget = 'identifier' | 'json';

@Component({
  selector: 'app-device',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonIcon,
  ],
  templateUrl: './device.page.html',
  styleUrls: ['./device.page.scss'],
})
export class DevicePage implements OnInit {
  pluginName = 'Device';
  state = signal<ViewState>('loading');
  snapshot = signal<DeviceSnapshot | null>(null);
  copied = signal<CopyTarget | null>(null);
  pluginInfo = signal<PluginCatalogEntry | null>(null);

  private copiedResetHandle: ReturnType<typeof setTimeout> | null = null;

  readonly rawJson = computed(() => {
    const snap = this.snapshot();
    return snap ? JSON.stringify(this.toPlainObject(snap), null, 2) : '';
  });

  constructor(
    private deviceService: DeviceService,
    private pluginsCatalogService: PluginsCatalogService,
  ) {
    addIcons({
      'finger-print-outline': fingerPrintOutline,
      'copy-outline': copyOutline,
      'checkmark-outline': checkmarkOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'language-outline': languageOutline,
      'battery-half-outline': batteryHalfOutline,
      'battery-charging-outline': batteryChargingOutline,
      'code-slash-outline': codeSlashOutline,
      'refresh-outline': refreshOutline,
      'alert-circle-outline': alertCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.load();
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
  }

  async toggleFavorite(): Promise<void> {
    const plugin = this.pluginInfo();
    if (!plugin) return;

    const next = !plugin.isFavorited;
    await this.pluginsCatalogService.setFavorited(plugin.id, next);
    this.pluginInfo.set({ ...plugin, isFavorited: next });
  }

  /** Reads every device field again — handy to refresh the battery level. */
  async load(): Promise<void> {
    this.state.set('loading');
    try {
      const snapshot = await this.deviceService.getSnapshot();
      this.snapshot.set(snapshot);
      this.state.set('ready');
    } catch {
      this.state.set('error');
    }
  }

  async copyIdentifier(): Promise<void> {
    const identifier = this.snapshot()?.identifier;
    if (!identifier) {
      return;
    }
    await navigator.clipboard.writeText(identifier);
    this.flashCopied('identifier');
  }

  async copyJson(): Promise<void> {
    const json = this.rawJson();
    if (!json) {
      return;
    }
    await navigator.clipboard.writeText(json);
    this.flashCopied('json');
  }

  private flashCopied(target: CopyTarget): void {
    this.copied.set(target);
    if (this.copiedResetHandle) {
      clearTimeout(this.copiedResetHandle);
    }
    this.copiedResetHandle = setTimeout(() => this.copied.set(null), 1500);
  }

  /** Flattens the snapshot into the plain shape shown in the "Raw JSON" card. */
  private toPlainObject(snap: DeviceSnapshot): Record<string, unknown> {
    return {
      identifier: snap.identifier,
      platform: snap.info.platform,
      operatingSystem: snap.info.operatingSystem,
      osVersion: snap.info.osVersion,
      manufacturer: snap.info.manufacturer,
      model: snap.info.model,
      isVirtual: snap.info.isVirtual,
      webViewVersion: snap.info.webViewVersion,
      language: snap.language,
      locale: snap.locale,
      battery: snap.battery.supported
        ? { level: snap.battery.level, isCharging: snap.battery.isCharging }
        : 'not available',
    };
  }
}
