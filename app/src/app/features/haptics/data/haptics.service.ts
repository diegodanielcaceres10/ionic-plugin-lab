import { Injectable } from '@angular/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { PlatformService } from '../../../core/platform/platform.service';

/**
 * Wraps @capacitor/haptics. No runtime permissions involved on either
 * platform. On web it falls back to navigator.vibrate() when available
 * (mostly Android Chrome) — desktop browsers and iOS Safari have no
 * Vibration API, so calls silently produce nothing there.
 */
@Injectable({ providedIn: 'root' })
export class HapticsService {
  constructor(private platformService: PlatformService) {}

  /** True when running in the browser, where feedback depends on the Vibration API instead of real haptics. */
  isBrowser(): boolean {
    return !this.platformService.isNativePlatform();
  }

  /** True when the current browser exposes navigator.vibrate — irrelevant on native, where haptics always work. */
  isVibrationSupported(): boolean {
    return typeof navigator !== 'undefined' && 'vibrate' in navigator;
  }

  /** Short tap-style feedback with a given strength. */
  async impact(style: ImpactStyle): Promise<void> {
    await Haptics.impact({ style });
  }

  /** Feedback pattern meant to accompany a success/warning/error message. */
  async notification(type: NotificationType): Promise<void> {
    await Haptics.notification({ type });
  }

  /** Simulates a drag/scroll selection gesture: start → changed → end. */
  async selectionFeedback(): Promise<void> {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  }

  /** Raw vibration for a fixed duration (ms) — closest thing to a "manual" haptic. */
  async vibrate(durationMs: number): Promise<void> {
    await Haptics.vibrate({ duration: durationMs });
  }
}
