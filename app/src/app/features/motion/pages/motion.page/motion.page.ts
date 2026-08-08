import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  pulseOutline,
  compassOutline,
  playOutline,
  stopOutline,
  timeOutline,
  lockClosedOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import {
  MotionService,
  AccelListenerEvent,
  OrientationListenerEvent,
  PluginListenerHandle,
} from '../../data/motion.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface RotationRate {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

interface Orientation {
  alpha: number;
  beta: number;
  gamma: number;
}

@Component({
  selector: 'app-motion',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './motion.page.html',
  styleUrls: ['./motion.page.scss'],
})
export class MotionPage implements OnInit, OnDestroy {
  pluginName = 'Motion';
  needsPermission = signal(false);
  permissionGranted = signal(false);

  isTrackingAccel = signal(false);
  isTrackingOrientation = signal(false);

  acceleration = signal<Vector3 | null>(null);
  rotationRate = signal<RotationRate | null>(null);
  orientation = signal<Orientation | null>(null);

  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  private accelHandle: PluginListenerHandle | null = null;
  private orientationHandle: PluginListenerHandle | null = null;

  constructor(
    private motionService: MotionService,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'information-circle-outline': informationCircleOutline,
      'pulse-outline': pulseOutline,
      'compass-outline': compassOutline,
      'play-outline': playOutline,
      'stop-outline': stopOutline,
      'time-outline': timeOutline,
      'lock-closed-outline': lockClosedOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });

    this.needsPermission.set(this.motionService.needsPermissionRequest());
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

  async requestPermission(): Promise<void> {
    try {
      const granted = await this.motionService.requestPermission();
      this.permissionGranted.set(granted);
    } catch {
      // already logged by MotionService
    } finally {
      await this.refreshActivityLog();
    }
  }

  async toggleAccel(): Promise<void> {
    if (this.isTrackingAccel()) {
      if (this.accelHandle) {
        await this.motionService.stopAccelListener(this.accelHandle);
        this.accelHandle = null;
      }
      this.isTrackingAccel.set(false);
      await this.refreshActivityLog();
      return;
    }

    this.accelHandle = await this.motionService.addAccelListener(
      (event: AccelListenerEvent) => {
        this.acceleration.set(event.acceleration);
        this.rotationRate.set(event.rotationRate);
      },
    );
    this.isTrackingAccel.set(true);
    await this.refreshActivityLog();
  }

  async toggleOrientation(): Promise<void> {
    if (this.isTrackingOrientation()) {
      if (this.orientationHandle) {
        await this.motionService.stopOrientationListener(
          this.orientationHandle,
        );
        this.orientationHandle = null;
      }
      this.isTrackingOrientation.set(false);
      await this.refreshActivityLog();
      return;
    }

    this.orientationHandle = await this.motionService.addOrientationListener(
      (event: OrientationListenerEvent) => {
        this.orientation.set(event);
      },
    );
    this.isTrackingOrientation.set(true);
    await this.refreshActivityLog();
  }

  /** Maps gamma (left/right tilt) and beta (front/back tilt) to a position inside the bubble track. */
  bubblePosition(): { left: string; top: string } {
    const gamma = this.orientation()?.gamma ?? 0;
    const beta = this.orientation()?.beta ?? 0;
    const clampedX = Math.max(-45, Math.min(45, gamma));
    const clampedY = Math.max(-45, Math.min(45, beta));
    const left = 50 + (clampedX / 45) * 40;
    const top = 50 + (clampedY / 45) * 40;
    return { left: `${left}%`, top: `${top}%` };
  }

  formatNumber(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : value.toFixed(2);
  }

  async ngOnDestroy(): Promise<void> {
    await this.motionService.removeAllListeners();
  }
}
