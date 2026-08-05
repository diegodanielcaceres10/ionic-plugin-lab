import { Injectable } from '@angular/core';
import {
  LocalNotifications,
  type ActionPerformed,
} from '@capacitor/local-notifications';
import type { PluginListenerHandle } from '@capacitor/core';

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

    return id;
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
    await LocalNotifications.cancel({ notifications: [{ id }] });
  }

  /** Fires whenever the user taps a notification (or one of its action buttons). */
  async onActionPerformed(
    onAction: ActionCallback,
  ): Promise<PluginListenerHandle> {
    return LocalNotifications.addListener(
      'localNotificationActionPerformed',
      onAction,
    );
  }

  private toEpoch(at: Date | string | undefined): number | null {
    if (!at) {
      return null;
    }
    return new Date(at).getTime();
  }
}
