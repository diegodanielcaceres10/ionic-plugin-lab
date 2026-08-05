import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { BannerComponent } from '../../../../shared/ui/banner/banner.component';
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

type BannerVariant = 'info' | 'success' | 'danger' | 'disabled';

interface ChangeLogEntry {
  info: NetworkInfo;
  timestamp: number;
}

/** How many entries to keep in the "Recent Changes" list. */
const HISTORY_LIMIT = 5;

@Component({
  selector: 'app-network',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    BannerComponent,
    IonIcon,
  ],
  templateUrl: './network.page.html',
  styleUrls: ['./network.page.scss'],
})
export class NetworkPage implements OnInit, OnDestroy {
  status = signal<NetworkInfo | null>(null);
  isListening = signal(false);
  history = signal<ChangeLogEntry[]>([]);

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

  constructor(private networkService: NetworkService) {
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
    await this.refresh();
  }

  /** Manually re-reads the current status (one-off check, no listener involved). */
  async refresh(): Promise<void> {
    const info = await this.networkService.getStatus();
    this.status.set(info);
    this.pushHistory(info);
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
      this.pushHistory(info);
    });
    this.isListening.set(true);
  }

  private async stopListening(): Promise<void> {
    await this.listenerHandle?.remove();
    this.listenerHandle = null;
    this.isListening.set(false);
  }

  private pushHistory(info: NetworkInfo): void {
    const entry: ChangeLogEntry = { info, timestamp: Date.now() };
    this.history.update((entries) =>
      [entry, ...entries].slice(0, HISTORY_LIMIT),
    );
  }

  ngOnDestroy(): void {
    void this.listenerHandle?.remove();
  }
}
