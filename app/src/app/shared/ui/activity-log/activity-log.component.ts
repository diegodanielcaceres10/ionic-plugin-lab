import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';

export type ActivityLogVariant = 'success' | 'danger' | 'info';

export interface ActivityLogEntry {
  message: string;
  variant: ActivityLogVariant;
  timestamp: Date;
}

@Component({
  selector: 'app-activity-log',
  standalone: true,
  imports: [CommonModule, IonIcon],
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
})
export class ActivityLogComponent {
  readonly entries = input.required<ActivityLogEntry[]>();
}
