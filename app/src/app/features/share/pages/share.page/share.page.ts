import { Component, OnInit, signal } from '@angular/core';
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
  shareSocialOutline,
  alertCircleOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { ShareService } from '../../data/share.service';

type ViewState = 'checking' | 'unsupported' | 'ready';

interface ShareResultLog {
  activityType: string | null;
  timestamp: number;
}

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
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './share.page.html',
  styleUrls: ['./share.page.scss'],
})
export class SharePage implements OnInit {
  state = signal<ViewState>('checking');
  message = signal(DEFAULT_MESSAGE);
  url = signal(DEFAULT_URL);
  isSharing = signal(false);
  lastResult = signal<ShareResultLog | null>(null);

  constructor(
    private shareService: ShareService,
    private alertController: AlertController,
  ) {
    addIcons({
      'share-social-outline': shareSocialOutline,
      'alert-circle-outline': alertCircleOutline,
      'information-circle-outline': informationCircleOutline,
    });
  }

  async ngOnInit(): Promise<void> {
    this.state.set('checking');
    const supported = await this.shareService.canShare();
    this.state.set(supported ? 'ready' : 'unsupported');
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
      const result = await this.shareService.share({
        title: 'Ionic Plugin Lab',
        text: this.message(),
        url: this.url().trim() || undefined,
      });
      this.lastResult.set({
        activityType: result.activityType ?? null,
        timestamp: Date.now(),
      });
    } catch (error) {
      // The user simply dismissing the share sheet isn't a real error.
      if (!this.isCancellation(error)) {
        await this.showGenericErrorAlert();
      }
    } finally {
      this.isSharing.set(false);
    }
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
