import { Injectable } from '@angular/core';
import { Share, type ShareResult } from '@capacitor/share';

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
    return Share.share({
      title: content.title,
      text: content.text,
      url: content.url,
      dialogTitle: 'Share via Ionic Plugin Lab',
    });
  }
}
