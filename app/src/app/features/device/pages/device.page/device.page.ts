import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { HeaderComponent } from '../../../../shared/ui/header/header.component';
import { BannerComponent } from '../../../../shared/ui/banner/banner.component';
import { ButtonComponent } from '../../../../shared/ui/button/button.component';
import { IonSpinner, IonIcon } from '@ionic/angular/standalone';
import { ToastController } from '@ionic/angular';
import { DeviceService, DeviceSnapshot } from '../../data/device.service';

type PageState = 'idle' | 'loading' | 'obtained' | 'error';

interface InfoRow {
  icon: string;
  label: string;
  value: string;
}

/**
 * Device plugin demo page.
 * Reads static + runtime device info via @capacitor/device and renders
 * it as a details panel, mirroring the Camera/Geolocation page layout.
 */
@Component({
  selector: 'app-device',
  standalone: true,
  imports: [
    ShellComponent,
    HeaderComponent,
    BannerComponent,
    ButtonComponent,
    IonSpinner,
    IonIcon,
  ],
  templateUrl: './device.page.html',
  styleUrls: ['./device.page.scss'],
})
export class DevicePage implements OnInit {
  private deviceService = inject(DeviceService);
  private toastCtrl = inject(ToastController);

  state = signal<PageState>('idle');
  errorMessage = signal<string | null>(null);
  snapshot = signal<DeviceSnapshot | null>(null);

  /** Rows rendered in the "Device Information" card. */
  infoRows = computed<InfoRow[]>(() => {
    const s = this.snapshot();
    if (!s) return [];
    return [
      {
        icon: 'desktop-outline',
        label: 'Operating System',
        value: s.info.operatingSystem,
      },
      {
        icon: 'pricetag-outline',
        label: 'OS Version',
        value: s.info.osVersion,
      },
      {
        icon: 'business-outline',
        label: 'Manufacturer',
        value: s.info.manufacturer,
      },
      { icon: 'phone-portrait-outline', label: 'Model', value: s.info.model },
      { icon: 'layers-outline', label: 'Platform', value: s.info.platform },
      // "name" is unavailable on Android 13+ (Google removed it for privacy).
      { icon: 'cube-outline', label: 'Device Name', value: s.info.name ?? '—' },
      {
        icon: 'code-slash-outline',
        label: 'WebView Version',
        value: s.info.webViewVersion,
      },
      {
        icon: 'desktop-outline',
        label: 'Is Virtual Device',
        value: s.info.isVirtual ? 'Yes' : 'No',
      },
      { icon: 'globe-outline', label: 'Language', value: s.language },
      { icon: 'flag-outline', label: 'Locale', value: s.locale },
    ];
  });

  /** Pretty-printed JSON for the "Raw Response" card and the Copy JSON action. */
  rawJson = computed(() => {
    const s = this.snapshot();
    if (!s) return '';
    return JSON.stringify(
      {
        platform: s.info.platform,
        operatingSystem: s.info.operatingSystem,
        osVersion: s.info.osVersion,
        manufacturer: s.info.manufacturer,
        model: s.info.model,
        name: s.info.name,
        webViewVersion: s.info.webViewVersion,
        isVirtual: s.info.isVirtual,
        language: s.language,
        locale: s.locale,
        identifier: s.id,
      },
      null,
      2,
    );
  });

  ngOnInit() {
    // Device info is static per session, so it's safe (and expected) to
    // load it automatically instead of waiting for a button tap.
    this.loadInfo();
  }

  async loadInfo() {
    this.state.set('loading');
    this.errorMessage.set(null);
    try {
      const snapshot = await this.deviceService.getSnapshot();
      this.snapshot.set(snapshot);
      this.state.set('obtained');
    } catch {
      this.errorMessage.set('Could not read device information.');
      this.state.set('error');
    }
  }

  async copyValue(value: string) {
    await navigator.clipboard.writeText(value);
    await this.showToast('Copied to clipboard');
  }

  async copyJson() {
    await navigator.clipboard.writeText(this.rawJson());
    await this.showToast('JSON copied to clipboard');
  }

  private async showToast(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1500,
      position: 'bottom',
    });
    await toast.present();
  }
}
