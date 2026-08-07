import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { PluginLog } from '../../../core/plugin-logs/plugin-logs.service';

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
})
export class ActivityLogComponent {
  readonly entries = input.required<PluginLog[]>();
}
