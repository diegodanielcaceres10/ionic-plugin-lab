import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

type BannerVariantType = 'info' | 'success' | 'danger' | 'disabled';

@Component({
  selector: 'app-ui-banner',
  standalone: true,
  imports: [IonIcon],
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.scss'],
})
export class BannerComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly bannerIcon = input.required<string>();
  readonly variant = input<BannerVariantType>('info');

  readonly badgeIcon = input<string>();
  readonly badge = input<string>();
}
