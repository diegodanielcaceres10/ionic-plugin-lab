import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  starOutline,
  star,
  chevronForwardOutline,
  heartDislikeOutline,
} from 'ionicons/icons';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import {
  PluginCatalogEntry,
  PluginsCatalogService,
} from '../../../../core/plugins-catalog/plugins-catalog.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule, ShellComponent, IonIcon],
  templateUrl: './favorites.page.html',
  styleUrls: ['./favorites.page.scss'],
})
export class FavoritesPage implements OnInit {
  private pluginsCatalogService = inject(PluginsCatalogService);
  private router = inject(Router);

  readonly favoritePlugins = signal<PluginCatalogEntry[]>([]);

  ngOnInit(): void {
    addIcons({
      'star-outline': starOutline,
      star: star,
      'chevron-forward-outline': chevronForwardOutline,
      'heart-dislike-outline': heartDislikeOutline,
    });
    this.loadFavorites();
  }

  // Re-run every time the tab is entered, so un-favoriting elsewhere
  // (or on this page itself) is always reflected.
  ionViewWillEnter() {
    this.loadFavorites();
  }

  async loadFavorites(): Promise<void> {
    const all = await this.pluginsCatalogService.listAll();
    this.favoritePlugins.set(all.filter((plugin) => plugin.isFavorited));
  }

  onPluginTap(plugin: PluginCatalogEntry): void {
    if (plugin.link) {
      this.router.navigateByUrl(plugin.link);
    }
  }

  async onUnfavoriteTap(
    plugin: PluginCatalogEntry,
    event: Event,
  ): Promise<void> {
    event.stopPropagation(); // prevent the parent row's onPluginTap from firing

    // Optimistic update: drop it from the list immediately.
    this.favoritePlugins.update((plugins) =>
      plugins.filter((p) => p.id !== plugin.id),
    );

    await this.pluginsCatalogService.setFavorited(plugin.id, false);
  }
}
