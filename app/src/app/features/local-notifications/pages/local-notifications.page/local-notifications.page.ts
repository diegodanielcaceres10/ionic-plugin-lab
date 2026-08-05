import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import {
  IonSpinner,
  IonIcon,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  notificationsOutline,
  addCircleOutline,
  refreshOutline,
  trashOutline,
  hourglassOutline,
  handLeftOutline,
  alertCircleOutline,
  checkmarkCircleOutline,
} from 'ionicons/icons';
import type { ActionPerformed } from '@capacitor/local-notifications';
import type { PluginListenerHandle } from '@capacitor/core';
import {
  LocalNotificationsService,
  PendingNotification,
} from '../../data/local-notifications.service';

type ViewState = 'checking' | 'prompt' | 'denied' | 'ready';

interface LastAction {
  id: number;
  actionId: string;
  timestamp: number;
}

/** How many seconds ahead the demo notification is scheduled. */
const SCHEDULE_DELAY_SECONDS = 5;

@Component({
  selector: 'app-local-notifications',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ButtonComponent,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './local-notifications.page.html',
  styleUrls: ['./local-notifications.page.scss'],
})
export class LocalNotificationsPage implements OnInit, OnDestroy {
  state = signal<ViewState>('checking');
  pending = signal<PendingNotification[]>([]);
  lastAction = signal<LastAction | null>(null);
  isScheduling = signal(false);

  private listenerHandle: PluginListenerHandle | null = null;

  constructor(
    private notificationsService: LocalNotificationsService,
    private alertController: AlertController,
  ) {
    addIcons({
      'notifications-outline': notificationsOutline,
      'add-circle-outline': addCircleOutline,
      'refresh-outline': refreshOutline,
      'trash-outline': trashOutline,
      'hourglass-outline': hourglassOutline,
      'hand-left-outline': handLeftOutline,
      'alert-circle-outline': alertCircleOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    await this.checkPermission();
    if (this.state() === 'ready') {
      await this.refreshPending();
    }

    this.listenerHandle = await this.notificationsService.onActionPerformed(
      (action: ActionPerformed) => {
        this.lastAction.set({
          id: action.notification.id,
          actionId: action.actionId,
          timestamp: Date.now(),
        });
        void this.refreshPending();
      },
    );
  }

  async checkPermission(): Promise<void> {
    this.state.set('checking');
    const status = await this.notificationsService.checkPermissionStatus();
    this.applyPermissionState(status);
  }

  async requestPermission(): Promise<void> {
    const status = await this.notificationsService.requestPermission();
    this.applyPermissionState(status);
    if (this.state() === 'ready') {
      await this.refreshPending();
    }
  }

  /** Schedules a demo notification a few seconds from now. */
  async scheduleNotification(): Promise<void> {
    this.isScheduling.set(true);
    try {
      await this.notificationsService.schedule(
        'Ionic Plugin Lab',
        `Scheduled ${SCHEDULE_DELAY_SECONDS}s ago from the Local Notifications demo.`,
        SCHEDULE_DELAY_SECONDS,
      );
      await this.refreshPending();
    } catch {
      await this.showGenericErrorAlert();
    } finally {
      this.isScheduling.set(false);
    }
  }

  async refreshPending(): Promise<void> {
    this.pending.set(await this.notificationsService.getPending());
  }

  async cancelNotification(id: number): Promise<void> {
    await this.notificationsService.cancel(id);
    await this.refreshPending();
  }

  private applyPermissionState(
    status: Awaited<
      ReturnType<LocalNotificationsService['checkPermissionStatus']>
    >,
  ): void {
    if (status === 'granted') {
      this.state.set('ready');
    } else if (status === 'denied') {
      this.state.set('denied');
    } else {
      this.state.set('prompt');
    }
  }

  private async showGenericErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Something went wrong',
      message: "We couldn't schedule the notification. Please try again.",
      buttons: ['Close'],
    });
    await alert.present();
  }

  ngOnDestroy(): void {
    void this.listenerHandle?.remove();
  }
}
