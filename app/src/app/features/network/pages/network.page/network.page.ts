import {
  Component,
  OnInit,
  OnDestroy,
  signal,
  computed,
  inject,
} from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { ConnectionStatus } from '@capacitor/network';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { NetworkService } from '../../data/network.service';

interface NetworkEvent {
  status: ConnectionStatus;
  timestamp: number;
}

/**
 * Network plugin demo page.
 * Reads the current connection status via @capacitor/device and reacts
 * live to networkStatusChange events, logging each transition.
 */
@Component({
  selector: 'app-network',
  standalone: true,
  imports: [ShellComponent, HeaderComponent, IonButton, IonIcon],
  templateUrl: './network.page.html',
  styleUrls: ['./network.page.scss'],
})
export class NetworkPage implements OnInit, OnDestroy {
  private networkService = inject(NetworkService);

  status = signal<ConnectionStatus | null>(null);
  events = signal<NetworkEvent[]>([]);
  devicePlatform = signal<string>('');

  isConnected = computed(() => this.status()?.connected ?? false);

  connectionIcon = computed(() => {
    switch (this.status()?.connectionType) {
      case 'wifi':
        return 'wifi-outline';
      case 'cellular':
        return 'cellular-outline';
      case 'none':
        return 'cloud-offline-outline';
      default:
        return 'help-outline';
    }
  });

  async ngOnInit() {
    const info = await Device.getInfo();
    this.devicePlatform.set(
      `${info.operatingSystem} ${info.osVersion} (${Capacitor.getPlatform()})`,
    );

    const current = await this.networkService.getStatus();
    this.status.set(current);

    await this.networkService.watchStatus((newStatus) => {
      this.status.set(newStatus);
      this.pushEvent(newStatus);
    });
  }

  async refreshStatus() {
    const current = await this.networkService.getStatus();
    this.status.set(current);
    this.pushEvent(current);
  }

  private pushEvent(status: ConnectionStatus): void {
    this.events.update((current) =>
      [{ status, timestamp: Date.now() }, ...current].slice(0, 20),
    );
  }

  clearEvents(): void {
    this.events.set([]);
  }

  timeLabel(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  }

  async ngOnDestroy() {
    await this.networkService.stopWatching();
  }
}
