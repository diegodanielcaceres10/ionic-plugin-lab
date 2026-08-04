import { Injectable } from '@angular/core';
import { Device, DeviceInfo } from '@capacitor/device';

/** Combined snapshot of everything the Device plugin demo page needs. */
export interface DeviceSnapshot {
  id: string;
  info: DeviceInfo;
  language: string;
  locale: string;
}

/**
 * Thin wrapper around @capacitor/device.
 * Combines getId(), getInfo(), getLanguageCode() and getLanguageTag()
 * into a single snapshot, since the page always needs all four together.
 */
@Injectable({ providedIn: 'root' })
export class DeviceService {
  async getSnapshot(): Promise<DeviceSnapshot> {
    const [id, info, language, locale] = await Promise.all([
      Device.getId(),
      Device.getInfo(),
      Device.getLanguageCode(),
      Device.getLanguageTag(),
    ]);

    return {
      id: id.identifier,
      info,
      language: language.value,
      locale: locale.value,
    };
  }
}
