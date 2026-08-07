import { Component, input, output } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  shieldCheckmarkOutline,
  peopleOutline,
  star,
  starOutline,
} from 'ionicons/icons';

export type PluginBadgeType = 'official' | 'community';

@Component({
  selector: 'app-ui-header',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();

  /** Omit to render the header without a plugin-type badge (e.g. Home). */
  readonly pluginType = input<PluginBadgeType | null>(null);
  readonly isFavorited = input(false);

  /** Emitted when the favorite button is pressed; parent owns the state. */
  readonly favoriteToggled = output<void>();

  constructor() {
    addIcons({
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'people-outline': peopleOutline,
      star,
      'star-outline': starOutline,
    });
  }

  get badgeLabel(): string {
    return this.pluginType() === 'official'
      ? 'Official Capacitor Plugin'
      : 'Community Plugin';
  }

  get badgeIcon(): string {
    return this.pluginType() === 'official'
      ? 'shield-checkmark-outline'
      : 'people-outline';
  }
}
