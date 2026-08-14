import { inject, Injectable } from '@angular/core';
import { Share, type ShareResult } from '@capacitor/share';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export interface ShareContent {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * Wraps @capacitor/share so the page never talks to the plugin directly.
 * No permissions or platform-specific setup are involved — the only thing
 * worth checking upfront is whether sharing is supported at all (mainly
 * relevant on desktop browsers without the Web Share API).
 */
@Injectable({ providedIn: 'root' })
export class ShareService {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /** Whether the current platform can open a share sheet at all. */
  async canShare(): Promise<boolean> {
    const result = await Share.canShare();
    return result.value;
  }

  /**
   * Opens the native/web share sheet with the given content.
   * `activityType` on the result is iOS-only and is often undefined on
   * Android/web — callers shouldn't assume it's always populated.
   */
  async share(content: ShareContent): Promise<ShareResult> {
    try {
      const result = await Share.share({
        title: content.title,
        text: content.text,
        url: content.url,
        dialogTitle: 'Share via Ionic Plugin Lab',
      });
      await this.saveLog(
        'Share',
        result.activityType
          ? `Shared via ${result.activityType}`
          : 'Share sheet completed',
        'success',
      );
      return result;
    } catch (error) {
      await this.saveLog(
        'Share',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Writes the activity log entry and, on success, marks Share as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Share',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Share');
    }
  }
}
