import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { BannerComponent } from '../../../../shared/ui/banner/banner.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  wifiOutline,
  cellularOutline,
  cloudOfflineOutline,
  helpCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  informationCircleOutline,
  pulseOutline,
  swapHorizontalOutline,
  timeOutline,
  refreshOutline,
  playOutline,
  stopOutline,
} from 'ionicons/icons';
import { NetworkService, NetworkInfo } from '../../data/network.service';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

type BannerVariant = 'info' | 'success' | 'danger' | 'disabled';

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    BannerComponent,
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './network.page.html',
  styleUrls: ['./network.page.scss'],
})
export class NetworkPage implements OnInit, OnDestroy {
  pluginName = 'Network';
  status = signal<NetworkInfo | null>(null);
  isListening = signal(false);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  private listenerHandle: PluginListenerHandle | null = null;

  readonly variant = computed<BannerVariant>(() => {
    const info = this.status();
    if (!info) {
      return 'disabled';
    }
    return info.connected ? 'success' : 'danger';
  });

  readonly bannerIcon = computed(() => {
    const info = this.status();
    if (!info) {
      return 'help-circle-outline';
    }
    if (!info.connected) {
      return 'cloud-offline-outline';
    }
    return info.connectionType === 'cellular'
      ? 'cellular-outline'
      : 'wifi-outline';
  });

  readonly bannerTitle = computed(() => {
    const info = this.status();
    if (!info) {
      return 'Checking...';
    }
    return info.connected ? 'Connected' : 'Disconnected';
  });

  readonly connectionTypeLabel = computed(() => {
    switch (this.status()?.connectionType) {
      case 'wifi':
        return 'WiFi';
      case 'cellular':
        return 'Cellular';
      case 'none':
        return 'No connection';
      default:
        return 'Unknown';
    }
  });

  readonly badgeLabel = computed(() => {
    const info = this.status();
    if (!info) {
      return undefined;
    }
    return info.connected ? 'Online' : 'Offline';
  });

  readonly badgeIcon = computed(() => {
    const info = this.status();
    if (!info) {
      return undefined;
    }
    return info.connected ? 'checkmark-circle-outline' : 'close-circle-outline';
  });

  constructor(
    private networkService: NetworkService,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'wifi-outline': wifiOutline,
      'cellular-outline': cellularOutline,
      'cloud-offline-outline': cloudOfflineOutline,
      'help-circle-outline': helpCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'close-circle-outline': closeCircleOutline,
      'information-circle-outline': informationCircleOutline,
      'pulse-outline': pulseOutline,
      'swap-horizontal-outline': swapHorizontalOutline,
      'time-outline': timeOutline,
      'refresh-outline': refreshOutline,
      'play-outline': playOutline,
      'stop-outline': stopOutline,
    });
  }

  /** Reads the status once on load — no permission involved, so it's safe to do silently. */
  async ngOnInit(): Promise<void> {
    this.refreshActivityLog();
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
    await this.refresh();
  }

  private async refreshActivityLog(): Promise<void> {
    const logs = await this.pluginLogsService.list(this.pluginName);
    this.activityLog.set(logs);
  }

  async toggleFavorite(): Promise<void> {
    const plugin = this.pluginInfo();
    if (!plugin) return;

    const next = !plugin.isFavorited;
    await this.pluginsCatalogService.setFavorited(plugin.id, next);
    this.pluginInfo.set({ ...plugin, isFavorited: next });
  }

  /** Manually re-reads the current status (one-off check, no listener involved). */
  async refresh(): Promise<void> {
    const info = await this.networkService.getStatus();
    this.status.set(info);
    await this.refreshActivityLog();
  }

  /** Starts or stops the live connection listener, depending on the current state. */
  async toggleListening(): Promise<void> {
    if (this.isListening()) {
      await this.stopListening();
      return;
    }
    await this.startListening();
  }

  private async startListening(): Promise<void> {
    this.listenerHandle = await this.networkService.listen((info) => {
      this.status.set(info);
      void this.refreshActivityLog();
    });
    this.isListening.set(true);
    await this.refreshActivityLog();
  }

  private async stopListening(): Promise<void> {
    if (this.listenerHandle) {
      await this.networkService.stopListening(this.listenerHandle);
      this.listenerHandle = null;
    }
    this.isListening.set(false);
    await this.refreshActivityLog();
  }

  ngOnDestroy(): void {
    void this.listenerHandle?.remove();
  }
}
