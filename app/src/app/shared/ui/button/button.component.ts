import { Component, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';

type ButtonVariantType = 'solid' | 'outline';
type ButtonSize = 'default' | 'large' | 'small';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [IonButton, IonIcon],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
})
export class ButtonComponent {
  readonly text = input.required<string>();
  readonly icon = input<string>();
  readonly disabled = input<boolean>(false);
  readonly variant = input<ButtonVariantType>('solid');
  readonly size = input<ButtonSize>('default');

  readonly buttonClick = output<void>();

  handleClick() {
    if (this.disabled()) return;
    this.buttonClick.emit();
  }
}
