import { Component } from '@angular/core';

@Component({
  selector: 'app-ui-signature',
  standalone: true,
  imports: [],
  templateUrl: './signature.component.html',
  styleUrls: ['./signature.component.scss'],
})
export class SignatureComponent {
  readonly appVersion = '1.0.0';
}
