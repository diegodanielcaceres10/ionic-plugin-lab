import { Component, input } from '@angular/core';

@Component({
  selector: 'app-ui-header',
  standalone: true,
  imports: [],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
}
