import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SplashScreenComponent } from '../splash-screen/splash-screen.component';
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
  star,
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
import {
  PluginCatalogEntry,
  PluginCategoryGroup,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';

interface StatItem {
  icon: string;
  value: number;
  label: string;
  color: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SplashScreenComponent, ShellComponent, CommonModule, IonIcon],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private pluginsCatalogService = inject(PluginsCatalogService);
  private router = inject(Router);

  readonly isSplashVisible = signal(true);
  readonly isSplashFading = signal(false);
  readonly pluginCategories = signal<PluginCategoryGroup[]>([]);

  readonly stats = computed<StatItem[]>(() =>
    this.buildStats(this.pluginCategories()),
  );

  constructor() {
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
      star: star,
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

  async ngOnInit(): Promise<void> {
    await this.loadPlugins();
  }

  ionViewWillEnter() {
    this.loadPlugins();
  }

  async loadPlugins() {
    this.pluginCategories.set(
      await this.pluginsCatalogService.listGroupedByCategory(),
    );

    // Minimum splash duration so it doesn't feel like a flicker
    await new Promise((resolve) => setTimeout(resolve, 5000));

    this.isSplashFading.set(true);

    // Remove from DOM once the CSS fade-out transition finishes (must match
    // the transition duration above, 0.4s)
    setTimeout(() => this.isSplashVisible.set(false), 400);
  }

  private buildStats(groups: PluginCategoryGroup[]): StatItem[] {
    const all = groups.flatMap((g) => g.plugins);
    return [
      {
        icon: 'cube-outline',
        value: all.length,
        label: 'Plugins',
        color: 'primary',
      },
      {
        icon: 'checkmark-circle-outline',
        value: all.filter((p) => p.isTested).length,
        label: 'Tested',
        color: 'success',
      },
      {
        icon: 'code-slash-outline',
        value: all.filter((p) => p.isFavorited).length,
        label: 'Favorites',
        color: 'tertiary',
      },
      { icon: 'time-outline', value: 0, label: 'Recent', color: 'warning' },
    ];
  }

  onPluginTap(plugin: PluginCatalogEntry): void {
    if (plugin.link) {
      this.router.navigateByUrl(plugin.link);
    }
  }

  async onFavoriteTap(plugin: PluginCatalogEntry, event: Event): Promise<void> {
    event.stopPropagation(); // prevent the parent div's onPluginTap from firing

    const nextValue = !plugin.isFavorited;

    // Optimistic update: since pluginCategories is a signal, the stats()
    // computed recalculates on its own.
    this.pluginCategories.update((groups) =>
      groups.map((group) => ({
        ...group,
        plugins: group.plugins.map((p) =>
          p.name === plugin.name ? { ...p, isFavorited: nextValue } : p,
        ),
      })),
    );

    await this.pluginsCatalogService.setFavorited(plugin.id, nextValue);
  }
}
