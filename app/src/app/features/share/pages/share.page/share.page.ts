import { Component, OnInit, signal } from '@angular/core';
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
import { shareSocialOutline, alertCircleOutline } from 'ionicons/icons';
import { ShareService } from '../../data/share.service';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';

type ViewState = 'checking' | 'unsupported' | 'ready';

const DEFAULT_MESSAGE = 'Check my WebSite!';
const DEFAULT_URL = 'https://diegodanielcaceres10.github.io/nura/';

@Component({
  selector: 'app-share',
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
  templateUrl: './share.page.html',
  styleUrls: ['./share.page.scss'],
})
export class SharePage implements OnInit {
  pluginName = 'Share';
  state = signal<ViewState>('checking');
  message = signal(DEFAULT_MESSAGE);
  url = signal(DEFAULT_URL);
  isSharing = signal(false);
  pluginInfo = signal<PluginCatalogEntry | null>(null);
  activityLog = signal<PluginLogEntry[]>([]);

  constructor(
    private shareService: ShareService,
    private alertController: AlertController,
    private pluginsCatalogService: PluginsCatalogService,
    private pluginLogsService: PluginLogsService,
  ) {
    addIcons({
      'share-social-outline': shareSocialOutline,
      'alert-circle-outline': alertCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    const plugin = await this.pluginsCatalogService.findByName(this.pluginName);
    this.pluginInfo.set(plugin);
    await this.refreshActivityLog();

    this.state.set('checking');
    const supported = await this.shareService.canShare();
    this.state.set(supported ? 'ready' : 'unsupported');
  }

  async toggleFavorite(): Promise<void> {
    const plugin = this.pluginInfo();
    if (!plugin) return;

    const next = !plugin.isFavorited;
    await this.pluginsCatalogService.setFavorited(plugin.id, next);
    this.pluginInfo.set({ ...plugin, isFavorited: next });
  }

  updateMessage(value: string): void {
    this.message.set(value);
  }

  updateUrl(value: string): void {
    this.url.set(value);
  }

  async share(): Promise<void> {
    this.isSharing.set(true);
    try {
      await this.shareService.share({
        title: 'Ionic Plugin Lab',
        text: this.message(),
        url: this.url().trim() || undefined,
      });
    } catch (error) {
      // The user simply dismissing the share sheet isn't a real error.
      if (!this.isCancellation(error)) {
        await this.showGenericErrorAlert();
      }
    } finally {
      this.isSharing.set(false);
      await this.refreshActivityLog();
    }
  }

  private async refreshActivityLog(): Promise<void> {
    const logs = await this.pluginLogsService.list(this.pluginName);
    this.activityLog.set(logs);
  }

  private isCancellation(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return /cancel/i.test(message);
  }

  private async showGenericErrorAlert(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Something went wrong',
      message: "We couldn't open the share sheet. Please try again.",
      buttons: ['Close'],
    });
    await alert.present();
  }
}
