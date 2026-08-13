import { Component, input } from '@angular/core';
import { LogoComponent } from '../../../../shared/ui/logo/logo.component';
import { SignatureComponent } from '../../../../shared/ui/signature/signature.component';

@Component({
  selector: 'app-ui-splash-screen',
  standalone: true,
  imports: [LogoComponent, SignatureComponent],
  templateUrl: './splash-screen.component.html',
  styleUrls: ['./splash-screen.component.scss'],
})
export class SplashScreenComponent {
  readonly isSplashVisible = input<boolean>(true);
  readonly isSplashFading = input<boolean>(false);
}
