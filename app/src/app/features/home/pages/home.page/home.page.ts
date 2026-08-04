import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  flaskOutline,
  cubeOutline,
  checkmarkCircleOutline,
  codeSlashOutline,
  timeOutline,
  cameraOutline,
  locationOutline,
  phonePortraitOutline,
  appsOutline,
  globeOutline,
  folderOutline,
  optionsOutline,
  phonePortraitOutline as hapticsOutline,
  clipboardOutline,
  notificationsOutline,
  paperPlaneOutline,
  shareSocialOutline,
  wifiOutline,
  statsChartOutline,
  waterOutline,
  barcodeOutline,
  radioOutline,
  bluetoothOutline,
  fingerPrintOutline,
  serverOutline,
  locateOutline,
  documentAttachOutline,
  chevronForwardOutline,
  homeOutline,
  gridOutline,
  starOutline,
} from 'ionicons/icons';

interface StatItem {
  icon: string;
  value: number;
  label: string;
  color: string;
}

interface PluginItem {
  icon: string;
  label: string;
  link?: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ShellComponent, CommonModule, IonIcon],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage {
  stats: StatItem[] = [
    { icon: 'cube-outline', value: 21, label: 'Plugins', color: 'primary' },
    {
      icon: 'checkmark-circle-outline',
      value: 0,
      label: 'Tested',
      color: 'success',
    },
    {
      icon: 'code-slash-outline',
      value: 0,
      label: 'Favorites',
      color: 'tertiary',
    },
    { icon: 'time-outline', value: 0, label: 'Recent', color: 'warning' },
  ];

  officialPlugins: PluginItem[] = [
    { icon: 'camera-outline', label: 'Camera', link: 'camera' },
    { icon: 'location-outline', label: 'Geolocation', link: 'geolocation' },
    { icon: 'phone-portrait-outline', label: 'Device', link: 'device' },
    { icon: 'globe-outline', label: 'Browser' },
    { icon: 'folder-outline', label: 'Filesystem' },
    { icon: 'options-outline', label: 'Preferences' },
    { icon: 'phone-portrait-outline', label: 'Haptics' },
    { icon: 'clipboard-outline', label: 'Clipboard' },
    { icon: 'notifications-outline', label: 'Local Notifications' },
    { icon: 'paper-plane-outline', label: 'Push Notifications' },
    { icon: 'share-social-outline', label: 'Share' },
    { icon: 'wifi-outline', label: 'Network' },
    { icon: 'stats-chart-outline', label: 'StatusBar' },
    { icon: 'water-outline', label: 'SplashScreen' },
    { icon: 'apps-outline', label: 'App' },
  ];

  communityPlugins: PluginItem[] = [
    { icon: 'barcode-outline', label: 'Barcode Scanner' },
    { icon: 'radio-outline', label: 'NFC' },
    { icon: 'bluetooth-outline', label: 'Bluetooth LE' },
    { icon: 'finger-print-outline', label: 'Biometrics' },
    { icon: 'server-outline', label: 'SQLite' },
    { icon: 'locate-outline', label: 'Background Geolocation' },
    { icon: 'document-attach-outline', label: 'File Picker' },
  ];

  constructor(private router: Router) {
    addIcons({
      'menu-outline': menuOutline,
      'flask-outline': flaskOutline,
      'cube-outline': cubeOutline,
      'checkmark-circle-outline': checkmarkCircleOutline,
      'code-slash-outline': codeSlashOutline,
      'time-outline': timeOutline,
      'camera-outline': cameraOutline,
      'location-outline': locationOutline,
      'phone-portrait-outline': phonePortraitOutline,
      'apps-outline': appsOutline,
      'globe-outline': globeOutline,
      'folder-outline': folderOutline,
      'options-outline': optionsOutline,
      'clipboard-outline': clipboardOutline,
      'notifications-outline': notificationsOutline,
      'paper-plane-outline': paperPlaneOutline,
      'share-social-outline': shareSocialOutline,
      'wifi-outline': wifiOutline,
      'stats-chart-outline': statsChartOutline,
      'water-outline': waterOutline,
      'barcode-outline': barcodeOutline,
      'radio-outline': radioOutline,
      'bluetooth-outline': bluetoothOutline,
      'finger-print-outline': fingerPrintOutline,
      'server-outline': serverOutline,
      'locate-outline': locateOutline,
      'document-attach-outline': documentAttachOutline,
      'chevron-forward-outline': chevronForwardOutline,
      'home-outline': homeOutline,
      'grid-outline': gridOutline,
      'star-outline': starOutline,
    });
  }

  onPluginTap(plugin: PluginItem): void {
    if (plugin.link) {
      this.router.navigateByUrl(plugin.link);
    }
  }
}
