import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SplashScreen } from '@capacitor/splash-screen';
import { SplashScreenComponent } from '../splash-screen/splash-screen.component';
import { ShellComponent } from '../../../../shared/shell/shell.component';
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
import { PlatformService } from '../../../../core/platform/platform.service';
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
  imports: [CommonModule, SplashScreenComponent, ShellComponent, IonIcon],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
})
export class HomePage implements OnInit {
  private platformService = inject(PlatformService);
  private pluginsCatalogService = inject(PluginsCatalogService);
  private router = inject(Router);

  readonly isSplashVisible = signal(true);
  readonly isSplashFading = signal(false);
  readonly pluginCategories = signal<PluginCategoryGroup[]>([]);

  readonly stats = computed<StatItem[]>(() =>
    this.buildStats(this.pluginCategories()),
  );

  async ngOnInit(): Promise<void> {
    if (this.platformService.isNativePlatform()) {
      SplashScreen.show();
    }
    await this.loadPlugins();
    if (this.platformService.isNativePlatform()) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await SplashScreen.hide();
    }
    this.fadeCustomSplash();
  }

  ionViewWillEnter() {
    this.loadPlugins();
  }

  async fadeCustomSplash() {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    this.isSplashFading.set(true);
    setTimeout(() => this.isSplashVisible.set(false), 500);
  }

  async loadPlugins() {
    this.pluginCategories.set(
      await this.pluginsCatalogService.listGroupedByCategory(),
    );
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
