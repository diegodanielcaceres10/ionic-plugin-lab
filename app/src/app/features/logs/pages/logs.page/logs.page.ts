import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  warningOutline,
  closeCircleOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { ShellComponent } from '../../../../shared/shell/shell.component';
import {
  PluginLogEntry,
  PluginLogsService,
} from '../../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../../core/plugins-catalog/plugins-catalog.service';

type StatusFilter = 'all' | 'success' | 'warning' | 'danger';

interface LogViewEntry extends PluginLogEntry {
  icon: string;
}

@Component({
  selector: 'app-logs',
  standalone: true,
  imports: [CommonModule, ShellComponent, IonIcon],
  templateUrl: './logs.page.html',
  styleUrls: ['./logs.page.scss'],
})
export class LogsPage implements OnInit {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  private readonly logs = signal<PluginLogEntry[]>([]);
  private readonly pluginIcons = signal<Map<string, string>>(new Map());

  readonly selectedStatus = signal<StatusFilter>('all');
  readonly selectedPlugin = signal<string>('all');

  readonly pluginOptions = computed(() => {
    const names = new Set(this.logs().map((log) => log.plugin));
    return Array.from(names).sort();
  });

  readonly logsWithIcon = computed<LogViewEntry[]>(() => {
    const icons = this.pluginIcons();
    return this.logs().map((log) => ({
      ...log,
      icon: icons.get(log.plugin) ?? 'document-text-outline',
    }));
  });

  readonly filteredLogs = computed<LogViewEntry[]>(() => {
    const status = this.selectedStatus();
    const plugin = this.selectedPlugin();
    return this.logsWithIcon().filter(
      (log) =>
        (status === 'all' || log.status === status) &&
        (plugin === 'all' || log.plugin === plugin),
    );
  });

  ngOnInit(): void {
    addIcons({
      'checkmark-circle-outline': checkmarkCircleOutline,
      'warning-outline': warningOutline,
      'close-circle-outline': closeCircleOutline,
      'document-text-outline': documentTextOutline,
    });
    this.loadLogs();
  }

  // Re-run every time the tab is entered, so logs from a demo just run
  // elsewhere show up here right away.
  ionViewWillEnter() {
    this.loadLogs();
  }

  async loadLogs(): Promise<void> {
    const [logs, plugins] = await Promise.all([
      this.pluginLogsService.list(),
      this.pluginsCatalogService.listAll(),
    ]);
    this.logs.set(logs);
    this.pluginIcons.set(new Map(plugins.map((p) => [p.name, p.icon])));
  }

  setStatusFilter(status: StatusFilter): void {
    this.selectedStatus.set(status);
  }

  setPluginFilter(plugin: string): void {
    this.selectedPlugin.set(plugin);
  }

  statusIcon(status: string): string {
    switch (status) {
      case 'success':
        return 'checkmark-circle-outline';
      case 'warning':
        return 'warning-outline';
      case 'danger':
        return 'close-circle-outline';
      default:
        return 'document-text-outline';
    }
  }
}
