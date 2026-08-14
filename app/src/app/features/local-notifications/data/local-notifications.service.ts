import { inject, Injectable } from '@angular/core';
import {
  LocalNotifications,
  type ActionPerformed,
} from '@capacitor/local-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export type NotificationPermissionState =
  | 'prompt'
  | 'prompt-with-rationale'
  | 'granted'
  | 'denied';

export interface PendingNotification {
  id: number;
  title: string;
  body: string;
  scheduleAt: number | null;
}

type ActionCallback = (action: ActionPerformed) => void;

/**
 * Wraps @capacitor/local-notifications so the page never talks to the
 * plugin directly. Permission checking/requesting is exposed separately
 * from schedule(), so the page can gate its UI on permission state
 * without triggering a schedule as a side effect.
 */
@Injectable({ providedIn: 'root' })
export class LocalNotificationsService {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  async checkPermissionStatus(): Promise<NotificationPermissionState> {
    const status = await LocalNotifications.checkPermissions();
    return status.display;
  }

  async requestPermission(): Promise<NotificationPermissionState> {
    const status = await LocalNotifications.requestPermissions();
    return status.display;
  }

  /** Schedules a one-off notification `delaySeconds` from now. Returns its id. */
  async schedule(
    title: string,
    body: string,
    delaySeconds: number,
  ): Promise<number> {
    // Keep it within a signed 32-bit range, as some platforms require.
    const id = Date.now() % 2147483647;
    const scheduleAt = new Date(Date.now() + delaySeconds * 1000);

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id,
            title,
            body,
            schedule: { at: scheduleAt },
          },
        ],
      });
      await this.saveLog(
        'Schedule',
        `Notification scheduled (${delaySeconds}s)`,
        'success',
      );
      return id;
    } catch (error) {
      await this.saveLog(
        'Schedule',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Lists notifications that were scheduled but haven't fired (or been cancelled) yet. */
  async getPending(): Promise<PendingNotification[]> {
    const result = await LocalNotifications.getPending();
    return result.notifications.map((notification) => ({
      id: notification.id,
      title: notification.title ?? '',
      body: notification.body ?? '',
      scheduleAt: this.toEpoch(notification.schedule?.at),
    }));
  }

  /** Cancels a single pending notification by id. */
  async cancel(id: number): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id }] });
      await this.saveLog('Cancel', `Notification #${id} cancelled`, 'success');
    } catch (error) {
      await this.saveLog(
        'Cancel',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Fires whenever the user taps a notification (or one of its action buttons). */
  async onActionPerformed(
    onAction: ActionCallback,
  ): Promise<PluginListenerHandle> {
    return LocalNotifications.addListener(
      'localNotificationActionPerformed',
      (action: ActionPerformed) => {
        void this.saveLog(
          'Action',
          `Action "${action.actionId}" performed on #${action.notification.id}`,
          'success',
        );
        onAction(action);
      },
    );
  }

  /** Writes the activity log entry and, on success, marks Local Notifications as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Local Notifications',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Local Notifications');
    }
  }

  private toEpoch(at: Date | string | undefined): number | null {
    if (!at) {
      return null;
    }
    return new Date(at).getTime();
  }
}
