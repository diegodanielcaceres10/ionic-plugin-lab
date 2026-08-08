import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { ActivityLogComponent } from '../../../../shared/ui/activity-log/activity-log.component';
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
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

type ActionKey =
  | 'impact-light'
  | 'impact-medium'
  | 'impact-heavy'
  | 'notify-success'
  | 'notify-warning'
  | 'notify-error'
  | 'selection'
  | 'vibrate';

interface QuickAction {
  key: ActionKey;
  label: string;
  icon: string;
  /** Accent color for the icon on the grid card (any valid CSS color). */
  color: string;
}

@Component({
  selector: 'app-haptics',
  standalone: true,
  imports: [
    ShellComponent,
    CommonModule,
    HeaderComponent,
    ActivityLogComponent,
    IonIcon,
  ],
  templateUrl: './haptics.page.html',
  styleUrls: ['./haptics.page.scss'],
})
export class HapticsPage implements OnInit {
  pluginName = 'Haptics';
  isBusy = signal(false);
  isBrowserEnv = signal(false);
  vibrationSupported = signal(true);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

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

  constructor(
    private hapticsService: HapticsService,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
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

  async ngOnInit(): Promise<void> {
    this.isBrowserEnv.set(this.hapticsService.isBrowser());
    this.vibrationSupported.set(this.hapticsService.isVibrationSupported());

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

  /** Routes a quick-action card tap to its corresponding haptic call. */
  onAction(key: ActionKey): void {
    switch (key) {
      case 'impact-light':
        void this.run(() => this.hapticsService.impact(ImpactStyle.Light));
        break;
      case 'impact-medium':
        void this.run(() => this.hapticsService.impact(ImpactStyle.Medium));
        break;
      case 'impact-heavy':
        void this.run(() => this.hapticsService.impact(ImpactStyle.Heavy));
        break;
      case 'notify-success':
        void this.run(() =>
          this.hapticsService.notification(NotificationType.Success),
        );
        break;
      case 'notify-warning':
        void this.run(() =>
          this.hapticsService.notification(NotificationType.Warning),
        );
        break;
      case 'notify-error':
        void this.run(() =>
          this.hapticsService.notification(NotificationType.Error),
        );
        break;
      case 'selection':
        void this.run(() => this.hapticsService.selectionFeedback());
        break;
      case 'vibrate':
        void this.run(() => this.hapticsService.vibrate(300));
        break;
    }
  }

  /** The service already logs success/failure internally; the page just tracks isBusy and refreshes the list. */
  private async run(action: () => Promise<void>): Promise<void> {
    this.isBusy.set(true);
    try {
      await action();
    } catch {
      // already logged by HapticsService
    } finally {
      this.isBusy.set(false);
      await this.refreshActivityLog();
    }
  }
}
