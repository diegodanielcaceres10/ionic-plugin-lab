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
  earthOutline,
  moveOutline,
  textOutline,
  swapVerticalOutline,
  eyeOutline,
  fileTrayStackedOutline,
  layersOutline,
  listOutline,
  chatboxEllipsesOutline,
  chatbubbleOutline,
  keypadOutline,
  syncOutline,
  eyeOffOutline,
  volumeHighOutline,
  openOutline,
  cloudDownloadOutline,
  rocketOutline,
  terminalOutline,
  hardwareChipOutline,
  peopleOutline,
  calendarOutline,
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

interface PluginCategory {
  label: string;
  plugins: PluginItem[];
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
    { icon: 'cube-outline', value: 36, label: 'Plugins', color: 'primary' },
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

  pluginCategories: PluginCategory[] = [
    {
      label: 'Media & Scanning',
      plugins: [
        { icon: 'camera-outline', label: 'Camera', link: 'camera' },
        { icon: 'barcode-outline', label: 'Barcode Scanner' },
      ],
    },
    {
      label: 'Location & Maps',
      plugins: [
        { icon: 'location-outline', label: 'Geolocation', link: 'geolocation' },
        { icon: 'locate-outline', label: 'Background Geolocation' },
        { icon: 'earth-outline', label: 'Google Maps' },
      ],
    },
    {
      label: 'Device & Sensors',
      plugins: [
        { icon: 'phone-portrait-outline', label: 'Device', link: 'device' },
        { icon: 'phone-portrait-outline', label: 'Haptics', link: 'haptics' },
        { icon: 'wifi-outline', label: 'Network', link: 'network' },
        { icon: 'move-outline', label: 'Motion' },
        { icon: 'text-outline', label: 'Text Zoom' },
      ],
    },
    {
      label: 'Storage & Files',
      plugins: [
        { icon: 'options-outline', label: 'Preferences' },
        { icon: 'folder-outline', label: 'Filesystem', link: 'filesystem' },
        { icon: 'server-outline', label: 'SQLite' },
        { icon: 'document-attach-outline', label: 'File Picker' },
        { icon: 'swap-vertical-outline', label: 'File Transfer' },
        { icon: 'eye-outline', label: 'File Viewer' },
        { icon: 'file-tray-stacked-outline', label: 'Cookies' },
      ],
    },
    {
      label: 'UI & System Bars',
      plugins: [
        { icon: 'stats-chart-outline', label: 'StatusBar', link: 'status-bar' },
        { icon: 'layers-outline', label: 'System Bars' },
        { icon: 'water-outline', label: 'SplashScreen' },
        { icon: 'list-outline', label: 'Action Sheet' },
        { icon: 'chatbox-ellipses-outline', label: 'Dialog' },
        { icon: 'chatbubble-outline', label: 'Toast' },
        { icon: 'keypad-outline', label: 'Keyboard' },
        { icon: 'sync-outline', label: 'Screen Orientation' },
        { icon: 'eye-off-outline', label: 'Privacy Screen' },
        { icon: 'volume-high-outline', label: 'Screen Reader' },
      ],
    },
    {
      label: 'Web & Connectivity',
      plugins: [
        { icon: 'globe-outline', label: 'Browser', link: 'browser' },
        { icon: 'open-outline', label: 'InAppBrowser' },
        { icon: 'cloud-download-outline', label: 'Http' },
        { icon: 'rocket-outline', label: 'App Launcher' },
      ],
    },
    {
      label: 'Notifications',
      plugins: [
        {
          icon: 'notifications-outline',
          label: 'Local Notifications',
          link: 'local-notifications',
        },
        { icon: 'paper-plane-outline', label: 'Push Notifications' },
      ],
    },
    {
      label: 'Sharing & Clipboard',
      plugins: [
        { icon: 'share-social-outline', label: 'Share', link: 'share' },
        { icon: 'clipboard-outline', label: 'Clipboard', link: 'clipboard' },
      ],
    },
    {
      label: 'Wireless & Security',
      plugins: [
        { icon: 'radio-outline', label: 'NFC' },
        { icon: 'bluetooth-outline', label: 'Bluetooth LE' },
        { icon: 'finger-print-outline', label: 'Biometrics' },
      ],
    },
    {
      label: 'App Core',
      plugins: [{ icon: 'apps-outline', label: 'App' }],
    },
    {
      label: 'Experimental',
      plugins: [
        { icon: 'terminal-outline', label: 'Background Runner' },
        { icon: 'hardware-chip-outline', label: 'Local LLM' },
        { icon: 'people-outline', label: 'Contacts' },
        { icon: 'calendar-outline', label: 'Calendar' },
      ],
    },
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
      'earth-outline': earthOutline,
      'move-outline': moveOutline,
      'text-outline': textOutline,
      'swap-vertical-outline': swapVerticalOutline,
      'eye-outline': eyeOutline,
      'file-tray-stacked-outline': fileTrayStackedOutline,
      'layers-outline': layersOutline,
      'list-outline': listOutline,
      'chatbox-ellipses-outline': chatboxEllipsesOutline,
      'chatbubble-outline': chatbubbleOutline,
      'keypad-outline': keypadOutline,
      'sync-outline': syncOutline,
      'eye-off-outline': eyeOffOutline,
      'volume-high-outline': volumeHighOutline,
      'open-outline': openOutline,
      'cloud-download-outline': cloudDownloadOutline,
      'rocket-outline': rocketOutline,
      'terminal-outline': terminalOutline,
      'hardware-chip-outline': hardwareChipOutline,
      'people-outline': peopleOutline,
      'calendar-outline': calendarOutline,
    });
  }

  onPluginTap(plugin: PluginItem): void {
    if (plugin.link) {
      this.router.navigateByUrl(plugin.link);
    }
  }
}
