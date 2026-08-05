import { Injectable } from '@angular/core';
import {
  Geolocation,
  Position,
  PermissionStatus,
  ClearWatchOptions,
} from '@capacitor/geolocation';

export interface PositionInfo {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

/** Thrown when the user denies (or has previously denied) the location permission. */
export class GeolocationPermissionDeniedError extends Error {
  constructor() {
    super('Location permission was denied.');
    this.name = 'GeolocationPermissionDeniedError';
  }
}

type WatchCallback = (position: PositionInfo) => void;
type WatchErrorCallback = (error: unknown) => void;

/**
 * Wraps @capacitor/geolocation so the page never talks to the plugin directly.
 * Works both on native (iOS/Android) and on browser, since Geolocation has a
 * real web implementation backed by the standard navigator.geolocation API.
 */
@Injectable({ providedIn: 'root' })
export class GeolocationService {
  /** Requests permission only if it hasn't been granted yet. */
  private async ensurePermissions(): Promise<void> {
    const status = await Geolocation.checkPermissions();

    if (this.isGranted(status)) {
      return;
    }

    const requested = await Geolocation.requestPermissions({
      permissions: ['location'],
    });

    if (!this.isGranted(requested)) {
      throw new GeolocationPermissionDeniedError();
    }
  }

  private isGranted(status: PermissionStatus): boolean {
    return status.location === 'granted' || status.coarseLocation === 'granted';
  }

  /** Requests permission (if needed) and resolves the current position once. */
  async getCurrentPosition(): Promise<PositionInfo> {
    await this.ensurePermissions();

    const position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return this.toPositionInfo(position);
  }

  /**
   * Requests permission (if needed) and starts watching the position,
   * invoking onPosition on every update. Returns the watchId, needed to
   * stop the watch later with stopWatch().
   */
  async startWatch(
    onPosition: WatchCallback,
    onError: WatchErrorCallback,
  ): Promise<string> {
    await this.ensurePermissions();

    return Geolocation.watchPosition(
      { enableHighAccuracy: true, timeout: 10000 },
      (position, err) => {
        if (err) {
          onError(err);
          return;
        }
        if (position) {
          onPosition(this.toPositionInfo(position));
        }
      },
    );
  }

  /** Stops an active watch started with startWatch(). Safe to call even if already stopped. */
  async stopWatch(watchId: string): Promise<void> {
    const options: ClearWatchOptions = { id: watchId };
    await Geolocation.clearWatch(options);
  }

  private toPositionInfo(position: Position): PositionInfo {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      speed: position.coords.speed,
      heading: position.coords.heading,
      timestamp: position.timestamp,
    };
  }
}
