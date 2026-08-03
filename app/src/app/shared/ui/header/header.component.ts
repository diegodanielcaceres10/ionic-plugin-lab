import { Component, input } from '@angular/core';
import { IonIcon } from '@ionic/angular/standalone';

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
}
