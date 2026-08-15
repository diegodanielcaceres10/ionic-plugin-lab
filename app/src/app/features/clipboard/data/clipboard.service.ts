import { inject, Injectable } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { PluginLogsService } from '../../../core/plugin-logs/plugin-logs.service';
import { PluginsCatalogService } from '../../../core/plugins-catalog/plugins-catalog.service';

export type ClipboardContentType =
  | 'text/plain'
  | 'image/png'
  | 'image/jpeg'
  | 'unknown'
  | 'empty';

export interface ClipboardReadResult {
  value: string;
  type: ClipboardContentType;
}

/**
 * Small PNG (120×120) used as the sample image for the "Copy Image" feature.
 * It's embedded here so the demo works offline/on-device without any asset
 * fetching — the Clipboard plugin's write() expects a bare base64 string
 * (no data-URI prefix), which is exactly what's stored here.
 */
export const SAMPLE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAHgAAAB4CAYAAAA5ZDbSAAAEb0lEQVR4nO2dSXLjMAxFaVcfqnO6OKdLbpVeMaVmNHDA8AH9t7YtEE+ARMpFPUoy/r6+v1e+//V6PKRiQSD0YFZl9hJZeqjArYReEUk4fKAoUo9Alw0ZHLrUIxBlQwUUVWwLkmiIQLKIbUEQ7RpAVrEtnqJdDnwXsS0eop/WB7yr3FJ8xm52Rt1Z7B5W1WxSwZT7G6ucqAum3GMscqPWJih2DK2WrVLBlDuOVs7EBVPuPBq5ExVMuetI51BMMOXKIZlLEcGUK49UTpcFU64eErldujVHlvv5Pvb5tw+dOCRYmUJNfxFJ7qjMXpCkz0qe+hKCXC2pRyDInpH8RyMQTazFtsdFED3C8BnhVb1eYo/wEj1axUMf9pCLJrbFQ/SI5O4PWstFF9tiLbpXsvk/OnqIJrcU3Ji7BFtWL2qierCMvdfJZZlbyY0sdg+rln3VqiFadDa5peCM6VSwRfWiJEIDi7FdOXKt4MxyK95jPBSsXb3eA7dEe6xnrlwq+E5yK15j3hWM8DAhE28f+nfVR87MHzZYnsm9SdWMyfvhxK85lGb1WshdTahkjAjr1GYVHKVKtr+1ErN35VbCPQ/eop3E+vuR//7zXzlrtWeN6rVOYs8YUMRu2zTEUuUoHom8OiaK3Bb1Fh39pmXv+O2YvOM646eC0ee+SEncxoIUV2XrUrVFZ1+xQpTbEuIajJhIxJj2UBMsVb1REonKsxTc6y/lzlOdhmjRZB4VwRLtmdUrAys4ORScnIfGDdZqi2Z7loMVnBxxwdlXr6IBV8Fsz7LACSayUHByKDg5FJwcCk4OBSeHgpNDwcmh4OTACeZSpyzigrnUiAVcBRNZnghvyGxhm5bh6/V4sIKTQ8HJUREscaPFNi0DKzg5z1IwXkW+B6t4nupUrYKl5sOUvEaIFo0oGTGmPVQFZ1/ViiD5RzDqdbiClMxtLEhxVUw3YZGs4s9334QeHR9RciXENbjFI6FXx0SVbLaVYeS9siJthNZeakNWcEW7Zc/+PlI1czPShuj7erUVvHvnHF1y5W7bCe/NhMwFl4LVwizwfMXO7jUYfU4cDYvp3ZEzl5us7Ctce3iN+VCwdhXfSbL2WM9cuU6T7iDZe4yngi2uxd4J0MRibCHeXZhRMsqYuiqUr5ftx3ve29JVwZbTJpQzfwY0uaWAtOiWiJJRYx6qTI9th9FbNsJ68xnDrddrb2k00V4VO3q5nLq2em4g7i0a6VlvD+HefDb7NjKp40Zj+u4Y6TUAWrKRpM7OZJamP0iSWyL9zeaKlWnq8vwWWXIGVtcglufBfHash0RuRRY6KFkeqZyKrWRRshySuRRdqqTkdaRzKL4WTcnzaORO5WEDJY+jlTN1EZxGnaNdDOqPC1nNx1jkxuR5MCX/xion5om/e8u2PtnN/9Fx52r2GLtrsu9SzZ4nNUQ1ZRWN0K3cA9iSRTSC2ApMIFuiikYSW4ELqAVdNqLULdDBtaDIRpe6JUyge1gJjyS0JWzgR6xKjyxzj397KbvQdaBbiAAAAABJRU5ErkJggg==';

/**
 * Wraps @capacitor/clipboard so the page never talks to the plugin directly.
 * Supports writing text, writing an image (base64), reading with type
 * detection, and clearing the clipboard.
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  private pluginLogsService = inject(PluginLogsService);
  private pluginsCatalogService = inject(PluginsCatalogService);

  /** Writes a plain-text string to the clipboard. */
  async writeText(value: string): Promise<void> {
    try {
      await Clipboard.write({ string: value });
      await this.saveLog(
        'Write',
        `Copied text (${value.length} chars)`,
        'success',
      );
    } catch (error) {
      await this.saveLog(
        'Write',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /**
   * Writes a base64-encoded PNG to the clipboard.
   * NOTE: image write is only supported on native (iOS/Android).
   * On browser, @capacitor/clipboard falls back to no-op or throws —
   * callers should wrap this in try/catch and handle accordingly.
   */
  async writeImage(base64: string): Promise<void> {
    try {
      await Clipboard.write({ image: base64 });
      await this.saveLog('Write', 'Copied image (PNG)', 'success');
    } catch (error) {
      await this.saveLog(
        'Write',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Clears the clipboard by writing an empty string. */
  async clear(): Promise<void> {
    try {
      await Clipboard.write({ string: '' });
      await this.saveLog('Clear', 'Clipboard cleared', 'success');
    } catch (error) {
      await this.saveLog(
        'Clear',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /**
   * Reads the current clipboard contents and normalises the type into
   * one of the known ClipboardContentType values.
   */
  async read(): Promise<ClipboardReadResult> {
    try {
      const result = await Clipboard.read();
      const normalised: ClipboardReadResult = {
        value: result.value ?? '',
        type: this.normaliseType(result.type, result.value),
      };
      await this.saveLog(
        'Read',
        normalised.type === 'empty'
          ? 'Clipboard is empty'
          : `Read ${normalised.type}`,
        'success',
      );
      return normalised;
    } catch (error) {
      await this.saveLog(
        'Read',
        (error instanceof Error && error.message) || 'Unknown',
        'danger',
      );
      throw error;
    }
  }

  /** Writes the activity log entry and, on success, marks Clipboard as tested/recently used. */
  private async saveLog(
    type: string,
    message: string,
    status: 'success' | 'warning' | 'danger',
  ): Promise<void> {
    await this.pluginLogsService.add({
      plugin: 'Clipboard',
      type,
      message,
      status,
    });
    if (status !== 'danger') {
      await this.pluginsCatalogService.markAsTested('Clipboard');
    }
  }

  private normaliseType(
    raw: string | undefined,
    value: string | undefined,
  ): ClipboardContentType {
    if (!value) {
      return 'empty';
    }
    if (!raw) {
      return 'text/plain';
    }
    const lower = raw.toLowerCase();
    if (lower.includes('png')) return 'image/png';
    if (lower.includes('jpeg') || lower.includes('jpg')) return 'image/jpeg';
    if (lower.includes('text')) return 'text/plain';
    return 'unknown';
  }
}
