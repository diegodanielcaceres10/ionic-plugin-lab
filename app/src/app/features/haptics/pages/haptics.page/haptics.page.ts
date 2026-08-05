import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  informationCircleOutline,
  appsOutline,
  fingerPrintOutline,
  handLeftOutline,
  hammerOutline,
  checkmarkCircleOutline,
  warningOutline,
  closeCircleOutline,
  swapHorizontalOutline,
  pulseOutline,
  timeOutline,
} from 'ionicons/icons';
import { ImpactStyle, NotificationType } from '@capacitor/haptics';
import { HapticsService } from '../../data/haptics.service';

type ActionKey =
  | 'impact-light'
  | 'impact-medium'
  | 'impact-heavy'
  | 'notify-success'
  | 'notify-warning'
  | 'notify-error'
  | 'selection'
  | 'vibrate';

type LogVariant = 'success' | 'danger' | 'info';

interface QuickAction {
  key: ActionKey;
  label: string;
  icon: string;
  /** Accent color for the icon on the grid card (any valid CSS color). */
  color: string;
}

interface LogEntry {
  message: string;
  variant: LogVariant;
  timestamp: number;
}

/** How many entries to keep in the "Activity Log" list. */
const LOG_LIMIT = 5;

@Component({
  selector: 'app-haptics',
  standalone: true,
  imports: [ShellComponent, CommonModule, HeaderComponent, IonIcon],
  templateUrl: './haptics.page.html',
  styleUrls: ['./haptics.page.scss'],
})
export class HapticsPage implements OnInit {
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  vibrationSupported = signal(true);
  log = signal<LogEntry[]>([]);

  readonly quickActions: QuickAction[] = [
    {
      key: 'impact-light',
      label: 'Impact Light',
      icon: 'finger-print-outline',
      color: '#93c5fd',
    },
    {
      key: 'impact-medium',
      label: 'Impact Medium',
      icon: 'hand-left-outline',
      color: '#3b82f6',
    },
    {
      key: 'impact-heavy',
      label: 'Impact Heavy',
      icon: 'hammer-outline',
      color: '#1e3a8a',
    },
    {
      key: 'notify-success',
      label: 'Notify Success',
      icon: 'checkmark-circle-outline',
      color: '#2dd36f',
    },
    {
      key: 'notify-warning',
      label: 'Notify Warning',
      icon: 'warning-outline',
      color: '#f5a623',
    },
    {
      key: 'notify-error',
      label: 'Notify Error',
      icon: 'close-circle-outline',
      color: '#eb445a',
    },
    {
      key: 'selection',
      label: 'Selection Feedback',
      icon: 'swap-horizontal-outline',
      color: '#6c5ce7',
    },
    {
      key: 'vibrate',
      label: 'Vibrate 300ms',
      icon: 'pulse-outline',
      color: '#11999e',
    },
  ];

  constructor(private hapticsService: HapticsService) {
    addIcons({
      'information-circle-outline': informationCircleOutline,
      'apps-outline': appsOutline,
      'finger-print-outline': fingerPrintOutline,
      'hand-left-outline': handLeftOutline,
      'hammer-outline': hammerOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'warning-outline': warningOutline,
      'close-circle-outline': closeCircleOutline,
      'swap-horizontal-outline': swapHorizontalOutline,
      'pulse-outline': pulseOutline,
      'time-outline': timeOutline,
    });
  }

  /** No permission involved, safe to read the environment silently on load. */
  ngOnInit(): void {
    this.isBrowserEnv.set(this.hapticsService.isBrowser());
    this.vibrationSupported.set(this.hapticsService.isVibrationSupported());
  }

  /** Routes a quick-action card tap to its corresponding haptic call. */
  onAction(key: ActionKey): void {
    switch (key) {
      case 'impact-light':
        void this.run(
          () => this.hapticsService.impact(ImpactStyle.Light),
          'Impact light triggered',
        );
        break;
      case 'impact-medium':
        void this.run(
          () => this.hapticsService.impact(ImpactStyle.Medium),
          'Impact medium triggered',
        );
        break;
      case 'impact-heavy':
        void this.run(
          () => this.hapticsService.impact(ImpactStyle.Heavy),
          'Impact heavy triggered',
        );
        break;
      case 'notify-success':
        void this.run(
          () => this.hapticsService.notification(NotificationType.Success),
          'Success notification triggered',
        );
        break;
      case 'notify-warning':
        void this.run(
          () => this.hapticsService.notification(NotificationType.Warning),
          'Warning notification triggered',
        );
        break;
      case 'notify-error':
        void this.run(
          () => this.hapticsService.notification(NotificationType.Error),
          'Error notification triggered',
        );
        break;
      case 'selection':
        void this.run(
          () => this.hapticsService.selectionFeedback(),
          'Selection feedback triggered',
        );
        break;
      case 'vibrate':
        void this.run(
          () => this.hapticsService.vibrate(300),
          'Vibrated for 300ms',
        );
        break;
    }
  }

  private async run(
    action: () => Promise<void>,
    successMessage: string,
  ): Promise<void> {
    this.isBusy.set(true);
    try {
      await action();
      this.pushLog(successMessage, 'success');
    } catch {
      this.pushLog('Not supported here', 'danger');
    } finally {
      this.isBusy.set(false);
    }
  }

  private pushLog(message: string, variant: LogVariant): void {
    const entry: LogEntry = { message, variant, timestamp: Date.now() };
    this.log.update((entries) => [entry, ...entries].slice(0, LOG_LIMIT));
  }
}
