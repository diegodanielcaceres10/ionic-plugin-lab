import { inject, Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PlatformService } from '../../../core/platform/platform.service';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

/**
 * Wraps @capacitor/haptics. No runtime permissions involved on either
 * platform. On web it falls back to navigator.vibrate() when available
 * (mostly Android Chrome) — desktop browsers and iOS Safari have no
 * Vibration API, so calls silently produce nothing there.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  constructor(private platformService: PlatformService) {}

  /** True when running in the browser, where feedback depends on the Vibration API instead of real haptics. */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  /** True when the current browser exposes navigator.vibrate — irrelevant on native, where haptics always work. */
  isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /** Short tap-style feedback with a given strength. */
  async impact(style: ImpactStyle): Promise<void> {
    const label = this.impactLabel(style);
    try {
      await Haptics.impact({ style });
      await this.saveLog('Impact', `${label} impact triggered`, 'success');
    } catch (error) {
      await this.saveLog('Impact', 'Not supported here', 'danger');
      throw error;
    }
  }

  /** Feedback pattern meant to accompany a success/warning/error message. */
  async notification(type: NotificationType): Promise<void> {
    const label = this.notificationLabel(type);
    try {
      await Haptics.notification({ type });
      await this.saveLog(
        'Notification',
        `${label} notification triggered`,
        'success',
      );
    } catch (error) {
      await this.saveLog('Notification', 'Not supported here', 'danger');
      throw error;
    }
  }

  /** Simulates a drag/scroll selection gesture: start → changed → end. */
  async selectionFeedback(): Promise<void> {
    try {
      await Haptics.selectionStart();
      await Haptics.selectionChanged();
      await Haptics.selectionEnd();
      await this.saveLog(
        'Selection',
        'Selection feedback triggered',
        'success',
      );
    } catch (error) {
      await this.saveLog('Selection', 'Not supported here', 'danger');
      throw error;
    }
  }

  /** Raw vibration for a fixed duration (ms) — closest thing to a "manual" haptic. */
  async vibrate(durationMs: number): Promise<void> {
    try {
      await Haptics.vibrate({ duration: durationMs });
      await this.saveLog('Vibrate', `Vibrated for ${durationMs}ms`, 'success');
    } catch (error) {
      await this.saveLog('Vibrate', 'Not supported here', 'danger');
      throw error;
    }
  }

  /** Writes the activity log entry and, on success, marks Haptics as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Haptics',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Haptics');
    }
  }

  private impactLabel(style: ImpactStyle): string {
    switch (style) {
      case ImpactStyle.Light:
        return 'Light';
      case ImpactStyle.Medium:
        return 'Medium';
      case ImpactStyle.Heavy:
        return 'Heavy';
      default:
        return 'Impact';
    }
  }

  private notificationLabel(type: NotificationType): string {
    switch (type) {
      case NotificationType.Success:
        return 'Success';
      case NotificationType.Warning:
        return 'Warning';
      case NotificationType.Error:
        return 'Error';
      default:
        return 'Notification';
    }
  }
}
