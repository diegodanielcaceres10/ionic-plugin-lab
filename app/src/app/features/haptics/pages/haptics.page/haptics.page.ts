import { Component, signal, inject } from '@angular/core';
import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonIcon } from '@ionic/angular/standalone';
import { HapticsService } from '../../data/haptics.service';

interface FeedbackCard {
  id: string;
  icon: string;
  title: string;
  action: () => Promise<void>;
}

/**
 * Haptics plugin demo page.
 * Triggers impact, notification, and selection feedback via
 * @capacitor/haptics, grouped the same way as Capacitor's own API.
 */
@Component({
  selector: 'app-haptics',
  standalone: true,
  imports: [ShellComponent, HeaderComponent, IonIcon],
  templateUrl: './haptics.page.html',
  styleUrls: ['./haptics.page.scss'],
})
export class HapticsPage {
  private hapticsService = inject(HapticsService);

  platformLabel = signal('');
  hapticsSupported = signal(false);

  impactCards: FeedbackCard[] = [
    {
      id: 'light',
      icon: 'hand-left-outline',
      title: 'Impact Light',
      action: () => this.hapticsService.impact(ImpactStyle.Light),
    },
    {
      id: 'medium',
      icon: 'hand-right-outline',
      title: 'Impact Medium',
      action: () => this.hapticsService.impact(ImpactStyle.Medium),
    },
    {
      id: 'heavy',
      icon: 'flash-outline',
      title: 'Impact Heavy',
      action: () => this.hapticsService.impact(ImpactStyle.Heavy),
    },
  ];

  notificationCards: FeedbackCard[] = [
    {
      id: 'success',
      icon: 'checkmark-circle-outline',
      title: 'Success',
      action: () => this.hapticsService.notification(NotificationType.Success),
    },
    {
      id: 'warning',
      icon: 'warning-outline',
      title: 'Warning',
      action: () => this.hapticsService.notification(NotificationType.Warning),
    },
    {
      id: 'error',
      icon: 'close-circle-outline',
      title: 'Error',
      action: () => this.hapticsService.notification(NotificationType.Error),
    },
  ];

  selectionCards: FeedbackCard[] = [
    {
      id: 'start',
      icon: 'play-outline',
      title: 'Selection Start',
      action: () => this.hapticsService.selectionStart(),
    },
    {
      id: 'changed',
      icon: 'pulse-outline',
      title: 'Selection Changed',
      action: () => this.hapticsService.selectionChanged(),
    },
    {
      id: 'end',
      icon: 'stop-outline',
      title: 'Selection End',
      action: () => this.hapticsService.selectionEnd(),
    },
  ];

  constructor() {
    this.hapticsSupported.set(this.hapticsService.isSupported());
    this.loadPlatformInfo();
  }

  private async loadPlatformInfo(): Promise<void> {
    const info = await Device.getInfo();
    const platform = Capacitor.getPlatform();
    this.platformLabel.set(
      platform === 'android'
        ? `${info.operatingSystem} ${info.osVersion} (API ${info.androidSDKVersion ?? '—'})`
        : `${info.operatingSystem} ${info.osVersion}`,
    );
  }

  async trigger(card: FeedbackCard): Promise<void> {
    try {
      await card.action();
    } catch {
      // Silently ignored — most likely running on a browser/device
      // without vibration support, which is expected and non-fatal.
    }
  }
}
