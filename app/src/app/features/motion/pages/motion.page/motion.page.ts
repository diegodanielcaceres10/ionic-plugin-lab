import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
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

type LogVariant = 'success' | 'danger' | 'info';

interface LogEntry {
  message: string;
  variant: LogVariant;
  timestamp: number;
}

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

/** How many entries to keep in the "Activity Log" list. */
const LOG_LIMIT = 5;

@Component({
  selector: 'app-motion',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonIcon,
  ],
  templateUrl: './motion.page.html',
  styleUrls: ['./motion.page.scss'],
})
export class MotionPage implements OnDestroy {
  needsPermission = signal(false);
  permissionGranted = signal(false);

  isTrackingAccel = signal(false);
  isTrackingOrientation = signal(false);

  acceleration = signal<Vector3 | null>(null);
  rotationRate = signal<RotationRate | null>(null);
  orientation = signal<Orientation | null>(null);

  log = signal<LogEntry[]>([]);

  private accelHandle: PluginListenerHandle | null = null;
  private orientationHandle: PluginListenerHandle | null = null;

  constructor(private motionService: MotionService) {
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

  async requestPermission(): Promise<void> {
    try {
      const granted = await this.motionService.requestPermission();
      this.permissionGranted.set(granted);
      this.pushLog(
        granted ? 'Motion permission granted' : 'Motion permission denied',
        granted ? 'success' : 'danger',
      );
    } catch {
      this.pushLog('Permission request failed', 'danger');
    }
  }

  async toggleAccel(): Promise<void> {
    if (this.isTrackingAccel()) {
      await this.accelHandle?.remove();
      this.accelHandle = null;
      this.isTrackingAccel.set(false);
      this.pushLog('Accelerometer stopped', 'info');
      return;
    }

    this.accelHandle = await this.motionService.addAccelListener(
      (event: AccelListenerEvent) => {
        this.acceleration.set(event.acceleration);
        this.rotationRate.set(event.rotationRate);
      },
    );
    this.isTrackingAccel.set(true);
    this.pushLog('Accelerometer started', 'success');
  }

  async toggleOrientation(): Promise<void> {
    if (this.isTrackingOrientation()) {
      await this.orientationHandle?.remove();
      this.orientationHandle = null;
      this.isTrackingOrientation.set(false);
      this.pushLog('Orientation stopped', 'info');
      return;
    }

    this.orientationHandle = await this.motionService.addOrientationListener(
      (event: OrientationListenerEvent) => {
        this.orientation.set(event);
      },
    );
    this.isTrackingOrientation.set(true);
    this.pushLog('Orientation started', 'success');
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

  private pushLog(message: string, variant: LogVariant): void {
    const entry: LogEntry = { message, variant, timestamp: Date.now() };
    this.log.update((entries) => [entry, ...entries].slice(0, LOG_LIMIT));
  }

  async ngOnDestroy(): Promise<void> {
    await this.motionService.removeAllListeners();
  }
}
