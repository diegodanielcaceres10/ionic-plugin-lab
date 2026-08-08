import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
import {
  IonSpinner,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  navigateOutline,
  playOutline,
  stopOutline,
  informationCircleOutline,
  compassOutline,
  speedometerOutline,
  timeOutline,
  radioButtonOnOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import {
  GeolocationService,
  PositionInfo,
  GeolocationPermissionDeniedError,
} from '../../data/geolocation.service';
import { MapService } from '../../data/map.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

type ViewState =
  | 'idle'
  | 'locating'
  | 'denied'
  | 'ready'
  | 'watching'
  | 'error';

/** Id of the div where Leaflet mounts the map. Must match geolocation.page.html. */
const MAP_ELEMENT_ID = 'geo-map';

@Component({
  selector: 'app-geolocation',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    ActivityLogComponent,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './geolocation.page.html',
  styleUrls: ['./geolocation.page.scss'],
})
export class GeolocationPage implements OnDestroy {
  pluginName = 'Geolocation';
  state = signal<ViewState>('idle');
  position = signal<PositionInfo | null>(null);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  private watchId: string | null = null;

  constructor(
    private geolocationService: GeolocationService,
    private mapService: MapService,
    private alertController: AlertController,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'location-outline': locationOutline,
      'navigate-outline': navigateOutline,
      'play-outline': playOutline,
      'stop-outline': stopOutline,
      'information-circle-outline': informationCircleOutline,
      'compass-outline': compassOutline,
      'speedometer-outline': speedometerOutline,
      'time-outline': timeOutline,
      'radio-button-on-outline': radioButtonOnOutline,
      'alert-circle-outline': alertCircleOutline,
    });
  }

  get isWatching(): boolean {
    return this.state() === 'watching';
  }

  async ngOnInit(): Promise<void> {
    this.refreshActivityLog();
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
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

  /** Requests permission (if needed) and resolves the current position, mounting the map on success. */
  async getCurrentLocation(): Promise<void> {
    this.state.set('locating');
    try {
      const position = await this.geolocationService.getCurrentPosition();
      this.position.set(position);
      this.showOnMap(position);
    } catch (error) {
      await this.handleError(error);
    } finally {
      await this.refreshActivityLog();
    }
  }

  /** Starts or stops the position watch, depending on the current state. */
  async toggleWatch(): Promise<void> {
    if (this.isWatching) {
      await this.stopWatch();
      return;
    }
    await this.startWatch();
  }

  private async startWatch(): Promise<void> {
    try {
      this.watchId = await this.geolocationService.startWatch(
        (position) => {
          this.position.set(position);
          this.mapService.updatePosition(
            position.latitude,
            position.longitude,
            position.accuracy,
            true,
          );
        },
        (error) => {
          void this.handleError(error);
        },
      );
      this.state.set('watching');
    } catch (error) {
      await this.handleError(error);
    } finally {
      await this.refreshActivityLog();
    }
  }

  private async stopWatch(): Promise<void> {
    if (this.watchId) {
      await this.geolocationService.stopWatch(this.watchId);
      this.watchId = null;
    }
    this.state.set('ready');
    await this.refreshActivityLog();
  }

  /**
   * Shows the position on the map. The #geo-map div is unconditionally
   * present in the template (never destroyed by the state changes), so
   * the map only needs to be created once, the first time; every later
   * call just moves the existing marker.
   */
  private showOnMap(position: PositionInfo): void {
    if (this.mapService.isMounted) {
      this.mapService.updatePosition(
        position.latitude,
        position.longitude,
        position.accuracy,
      );
    } else {
      this.mapService.init(
        MAP_ELEMENT_ID,
        position.latitude,
        position.longitude,
      );
    }
    this.state.set('ready');
  }

  private async handleError(error: unknown): Promise<void> {
    if (this.watchId) {
      await this.geolocationService
        .stopWatch(this.watchId)
        .catch(() => undefined);
      this.watchId = null;
    }

    if (error instanceof GeolocationPermissionDeniedError) {
      await this.showPermissionDeniedAlert();
      this.state.set('denied');
      return;
    }

    await this.showGenericErrorAlert();
    this.state.set(this.mapService.isMounted ? 'ready' : 'error');
  }

  private async showPermissionDeniedAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Permission denied',
      message:
        'We need access to your location to show it on the map. Enable the permission from your device (or browser) settings.',
      buttons: ['Got it'],
    });
    await alert.present();
  }

  private async showGenericErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Something went wrong',
      message:
        "We couldn't get your location. Make sure location services are enabled and try again.",
      buttons: ['Close'],
    });
    await alert.present();
  }

  ngOnDestroy(): void {
    if (this.watchId) {
      this.geolocationService.stopWatch(this.watchId).catch(() => undefined);
    }
    this.mapService.destroy();
  }
}
